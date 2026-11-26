import http from 'node:http';
import { parseJsonBody, sendJson } from '../utils/http';

const VALID_IMPACTS = new Set(['INFLATION', 'TAX', 'CORRUPTION_CRACKDOWN', 'SUBSIDY_CUT']);

async function generateGeminiNews(body: Record<string, unknown>, apiKey: string, model: string) {
  const prompt = [
    'Kamu adalah redaktur berita satir ekonomi-politik Indonesia untuk game Monopoli WNI Simulator.',
    'Buat 1 berita kilat (Breaking News) singkat dalam Bahasa Indonesia yang relevan dengan kondisi permainan saat ini.',
    `Data kondisi saat ini: ${JSON.stringify(body)}`,
    'Kembalikan HANYA JSON valid dengan struktur persis:',
    '{',
    '  "headline": "BREAKING NEWS: <judul singkat maksimal 90 karakter>",',
    '  "detail": "<narasi satir 1-2 kalimat maksimal 180 karakter>",',
    '  "impactType": "INFLATION" | "TAX" | "CORRUPTION_CRACKDOWN" | "SUBSIDY_CUT",',
    '  "impactSummary": "<ringkasan dampak 1 kalimat maksimal 90 karakter>"',
    '}'
  ].join('\n');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Respons Gemini kosong');
  }

  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const impactType = String(parsed.impactType ?? '');
  if (!VALID_IMPACTS.has(impactType)) {
    throw new Error(`impactType tidak valid: ${impactType}`);
  }

  return {
    id: `ai_news_${Date.now()}`,
    headline: String(parsed.headline ?? 'BREAKING NEWS: Gejolak Ekonomi Nasional!'),
    detail: String(parsed.detail ?? 'Pelaku pasar dan warga bersiap menghadapi penyesuaian kebijakan mendadak.'),
    impactType,
    impactSummary: String(parsed.impactSummary ?? 'Kondisi makroekonomi dan tekanan warga berubah.')
  };
}

export async function handleNarratorRoutes(
  method: string,
  pathname: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  config: { apiKey?: string; model: string }
): Promise<boolean> {
  if (method !== 'POST' || pathname !== '/api/breaking-news') {
    return false;
  }

  if (!config.apiKey) {
    sendJson(res, 503, { error: 'GEMINI_API_KEY belum dikonfigurasi di server.', fallback: true });
    return true;
  }

  try {
    const body = await parseJsonBody(req);
    const news = await generateGeminiNews(body, config.apiKey, config.model);
    sendJson(res, 200, news);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghasilkan berita AI';
    sendJson(res, 502, { error: message, fallback: true });
  }
  return true;
}
