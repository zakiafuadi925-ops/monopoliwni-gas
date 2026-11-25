import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Muat variabel .env lokal secara ringan tanpa dependensi eksternal.
 */
function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const PORT = Number(process.env.AI_PROXY_PORT ?? 3001);
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const VALID_IMPACTS = new Set(['INFLATION', 'TAX', 'CORRUPTION_CRACKDOWN', 'SUBSIDY_CUT']);

interface NarratorRequestBody {
  round?: number;
  macro?: {
    inflationRate?: number;
    biRate?: number;
    usdIdrRate?: number;
    trend?: string;
    monthIndex?: number;
    year?: number;
  };
  activeLawsCount?: number;
  playersSummary?: Array<{
    name: string;
    cash: number;
    stress: number;
    kpkSuspicionLevel: number;
    isInCorruptionRoute: boolean;
  }>;
}

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function generateGeminiNews(body: NarratorRequestBody, apiKey: string) {
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
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

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const url = req.url ?? '/';
  if (req.method === 'GET' && url === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      aiEnabled: Boolean(process.env.GEMINI_API_KEY),
      model: GEMINI_MODEL
    });
    return;
  }

  if (req.method === 'POST' && url === '/api/breaking-news') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      sendJson(res, 503, {
        error: 'GEMINI_API_KEY belum dikonfigurasi di server.',
        fallback: true
      });
      return;
    }

    try {
      const rawBody = await readRequestBody(req);
      const parsedBody = rawBody ? (JSON.parse(rawBody) as NarratorRequestBody) : {};
      const news = await generateGeminiNews(parsedBody, apiKey);
      sendJson(res, 200, news);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghasilkan berita AI';
      sendJson(res, 502, { error: message, fallback: true });
    }
    return;
  }

  sendJson(res, 404, { error: 'Endpoint tidak ditemukan' });
});

server.listen(PORT, () => {
  console.log(`[AI Proxy] Monopoli WNI Narrator aktif di http://localhost:${PORT}`);
});
