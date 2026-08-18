/* ============================================================
   Dev harness: run the Vercel serverless functions locally
   against your Supabase database.

   Usage:
     DATABASE_URL="postgres://..." JWT_SECRET="..." ADMIN_PASSWORD="..." \
       node scripts/dev-api.js

   Then the API is available at http://localhost:4000/api/...
   (Static pages are still served by server.js on port 3000.)
============================================================ */
const http = require('http');
const { EventEmitter } = require('events');

const ROUTES = [
  [/^\/api\/auth\/register$/, 'POST', require('../api/auth/register.js')],
  [/^\/api\/auth\/login$/, 'POST', require('../api/auth/login.js')],
  [/^\/api\/auth\/logout$/, 'POST', require('../api/auth/logout.js')],
  [/^\/api\/auth\/me$/, 'GET', require('../api/auth/me.js')],
  [/^\/api\/my-orders$/, 'GET', require('../api/my-orders.js')],
  [/^\/api\/orders$/, 'POST', require('../api/orders.js')],
  [/^\/api\/messages$/, 'POST', require('../api/messages.js')],
  [/^\/api\/products$/, 'GET', require('../api/products.js')],
  [/^\/api\/admin\/login$/, 'POST', require('../api/admin/login.js')],
  [/^\/api\/admin\/orders$/, 'GET', require('../api/admin/orders.js')],
  [/^\/api\/admin\/orders\/(\d+)\/status$/, 'PATCH', require('../api/admin/orders/[id]/status.js')],
  [/^\/api\/admin\/orders\/(\d+)$/, 'DELETE', require('../api/admin/orders/[id].js')],
  [/^\/api\/admin\/messages$/, 'GET', require('../api/admin/messages.js')],
  [/^\/api\/admin\/messages\/(\d+)$/, 'DELETE', require('../api/admin/messages/[id].js')],
];

const PORT = process.env.PORT || 4000;

/* Build a fake request that re-emits the buffered body, so the
   serverless functions' readBody() (from _lib) works unchanged. */
function wrapReq(realReq, body) {
  const ev = new EventEmitter();
  const fake = {
    method: realReq.method,
    url: realReq.url,
    headers: realReq.headers,
    query: realReq.query || {},
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let pathname = url.pathname;
  let handler = null;
  let match = null;

  for (const [re, method, fn] of ROUTES) {
    const m = pathname.match(re);
    if (m && method === req.method) {
      handler = fn;
      match = m;
      break;
    }
  }
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found');
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const fake = wrapReq(req, body);
    if (match && match[1]) fake.query.id = match[1];
    try {
      handler(fake, res);
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String((e && e.message) || e) }));
    }
  });
});

server.listen(PORT, () => {
  console.log('API (serverless) harness on http://localhost:' + PORT);
});