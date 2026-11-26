import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

/**
 * Menyajikan build statis frontend (`dist/`) pada port yang sama dengan backend API.
 */
export function tryServeStaticFrontend(
  method: string,
  pathname: string,
  res: http.ServerResponse,
  distDir = path.resolve(process.cwd(), 'dist')
): boolean {
  if (method !== 'GET' || pathname.startsWith('/api/')) return false;
  if (!fs.existsSync(path.join(distDir, 'index.html'))) return false;

  const safeRelativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolvedPath = path.resolve(distDir, safeRelativePath);

  // Cegah directory traversal keluar dari distDir
  if (!resolvedPath.startsWith(distDir)) return false;

  const targetFile =
    fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()
      ? resolvedPath
      : path.join(distDir, 'index.html');

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(targetFile).pipe(res);
  return true;
}
