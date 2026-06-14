// HTTP server + router — İNCE. İsteği yalnız doğru route handler'a yönlendirir; başka iş yapmaz.
// Route'lar dışarıdan (index.mjs) DI ile verilir.
import http from 'node:http';
import { sendJson, sendHtml } from './lib/http.mjs';

export function createServer({ config, routes }) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, config.publicUrl);
    const route = `${req.method} ${url.pathname}`;
    try {
      switch (route) {
        case 'GET /connect':
          return await routes.connect(req, res, url);
        case 'POST /webhook':
          return await routes.webhook(req, res, url);
        case 'POST /action':
          return await routes.action(req, res, url);
        case 'GET /':
          return sendHtml(res, 200, homeHtml());
        default:
          return sendJson(res, 404, { error: 'not_found' });
      }
    } catch (error) {
      console.error('unhandled', route, error);
      sendJson(res, 500, { error: 'internal_error' });
    }
  });
}

function homeHtml() {
  return `<h2>Restomenum örnek eklenti</h2>
    <p>Uçlar: <code>/connect</code> (Connect redirect hedefi), <code>/webhook</code>, <code>/action</code>.</p>
    <p>Dokümanlar: <a href="https://dev.restomenum.com/docs">/docs</a></p>`;
}
