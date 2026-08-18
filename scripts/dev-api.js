/* ============================================================
   Dev harness: run the single Vercel serverless function
   (api/index.js) locally against your Supabase database.
   Mirrors the vercel.json rewrite for /api/*.

   Usage:
     DATABASE_URL="postgres://..." JWT_SECRET="..." ADMIN_PASSWORD="..." \
       node scripts/dev-api.js

   Then the API is available at http://localhost:4000/api/...
============================================================ */
const http = require('http');
const { EventEmitter } = require('events');
const handler = require('../api/index.js');

const PORT = process.env.PORT || 4000;

/* Fake request that re-emits the buffered body, so readBody() works. */
function wrapReq(realReq, body, queryPath) {
  const ev = new EventEmitter();
  const fake = {
    method: realReq.method,
    url: '/api/index?path=' + encodeURIComponent(queryPath),
    headers: realReq.headers,
    query: {},
    on: (evt, fn) => {
      ev.on(evt, fn);
      return fake;
    },
  };
  queueMicrotask(() => {
    ev.emit('data', Buffer.from(body));
    ev.emit('end');
  });
  return fake;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    return;
  }
  const sub = url.pathname.replace(/^\/api\//, '');
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      handler(wrapReq(req, body, sub), res);
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String((e && e.message) || e) }));
    }
  });
});

server.listen(PORT, () => {
  console.log('API (serverless) harness on http://localhost:' + PORT);
});