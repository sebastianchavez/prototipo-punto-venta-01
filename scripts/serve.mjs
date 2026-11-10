/**
 * Servidor HTTP estático para desarrollo local. Sirve cada archivo HTML directamente, sin router SPA ni dependencias de producción.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url))),
  port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost'),
        relative = decodeURIComponent(url.pathname);
      const target = path.resolve(root, '.' + (relative === '/' ? '/index.html' : relative));
      if (
        !target.startsWith(root + path.sep) ||
        relative.includes('node_modules') ||
        relative.includes('/.')
      ) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      const content = await readFile(target);
      res.writeHead(200, {
        'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
