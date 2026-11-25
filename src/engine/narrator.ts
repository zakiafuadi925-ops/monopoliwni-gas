import { ActiveLaw, BreakingNewsEvent, MacroEconomy, Player } from '../types/game';

const VALID_IMPACT_TYPES = new Set<BreakingNewsEvent['impactType']>([
  'INFLATION',
  'TAX',
  'CORRUPTION_CRACKDOWN',
  'SUBSIDY_CUT'
]);

export interface NarratorContextPayload {
  round: number;
  macro: {
    inflationRate: number;
    biRate: number;
    usdIdrRate: number;
    trend: MacroEconomy['trend'];
    monthIndex: number;
    year: number;
  };
  activeLawsCount: number;
  playersSummary: Array<{
    name: string;
    cash: number;
    stress: number;
    kpkSuspicionLevel: number;
    isInCorruptionRoute: boolean;
  }>;
}

export function buildNarratorContext(
  macro: MacroEconomy,
  players: Player[],
  activeLaws: ActiveLaw[],
  round: number
): NarratorContextPayload {
  return {
    round,
    macro: {
      inflationRate: macro.inflationRate,
      biRate: macro.biRate,
      usdIdrRate: macro.usdIdrRate,
      trend: macro.trend,
      monthIndex: macro.monthIndex,
      year: macro.year
    },
    activeLawsCount: activeLaws.length,
    playersSummary: players
      .filter(p => !p.isBankrupt)
      .map(p => ({
        name: p.name,
        cash: p.cash,
        stress: p.stress,
        kpkSuspicionLevel: p.kpkSuspicionLevel,
        isInCorruptionRoute: p.isInCorruptionRoute
      }))
  };
}

export function isValidBreakingNewsEvent(candidate: unknown): candidate is BreakingNewsEvent {
  if (!candidate || typeof candidate !== 'object') return false;
  const obj = candidate as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.headline === 'string' &&
    obj.headline.length > 0 &&
    typeof obj.detail === 'string' &&
    obj.detail.length > 0 &&
    typeof obj.impactSummary === 'string' &&
    obj.impactSummary.length > 0 &&
    typeof obj.impactType === 'string' &&
    VALID_IMPACT_TYPES.has(obj.impactType as BreakingNewsEvent['impactType'])
  );
}

export function pickFallbackBreakingNews(
  templates: BreakingNewsEvent[],
  randomFn: () => number = Math.random
): BreakingNewsEvent {
  const index = Math.floor(randomFn() * templates.length);
  return templates[index] ?? templates[0];
}

export interface FetchDynamicNewsOptions {
  proxyUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  randomFn?: () => number;
}

/**
 * Mengambil Breaking News dinamis dari proxy AI backend; otomatis fallback ke template statis
 * bila server proxy tidak aktif, timeout, atau GEMINI_API_KEY belum diset.
 */
export async function fetchDynamicBreakingNews(
  context: NarratorContextPayload,
  fallbackTemplates: BreakingNewsEvent[],
  options: FetchDynamicNewsOptions = {}
): Promise<{ news: BreakingNewsEvent; source: 'AI' | 'TEMPLATE' }> {
  const envUrl =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_PROXY_URL
      ? String(import.meta.env.VITE_AI_PROXY_URL)
      : 'http://localhost:3001';
  const proxyUrl = (options.proxyUrl ?? envUrl).replace(/\/$/, '');
  const timeoutMs = options.timeoutMs ?? 3000;
  const fetchFn = options.fetchFn ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(`${proxyUrl}/api/breaking-news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(context),
      signal: controller.signal
    });

    if (!response.ok) {
      return { news: pickFallbackBreakingNews(fallbackTemplates, options.randomFn), source: 'TEMPLATE' };
    }

    const data: unknown = await response.json();
    if (isValidBreakingNewsEvent(data)) {
      return { news: data, source: 'AI' };
    }
  } catch {
    // Fallback diam-diam ke template lokal bila backend proxy belum dijalankan
  } finally {
    clearTimeout(timer);
  }

  return { news: pickFallbackBreakingNews(fallbackTemplates, options.randomFn), source: 'TEMPLATE' };
}
