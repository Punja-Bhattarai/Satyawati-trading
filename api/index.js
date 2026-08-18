/* ============================================================
   Single Vercel serverless function — routes every /api/* call.
   vercel.json rewrites /api/(.*) to /api/index?path=$1 so all
   endpoints live in ONE function (fits Vercel Hobby's 12-function
   limit) and dispatch happens here by method + path.
============================================================ */
const { send } = require('./_lib');

const EXACT = {
  'POST /api/auth/register': require('../handlers/auth/register.js'),
  'POST /api/auth/login': require('../handlers/auth/login.js'),
  'POST /api/auth/logout': require('../handlers/auth/logout.js'),
  'GET /api/auth/me': require('../handlers/auth/me.js'),
  'GET /api/my-orders': require('../handlers/my-orders.js'),
  'POST /api/orders': require('../handlers/orders.js'),
  'POST /api/messages': require('../handlers/messages.js'),
  'GET /api/products': require('../handlers/products.js'),
  'POST /api/admin/login': require('../handlers/admin/login.js'),
  'GET /api/admin/orders': require('../handlers/admin/orders.js'),
  'GET /api/admin/messages': require('../handlers/admin/messages.js'),
};

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const sub = String(url.searchParams.get('path') || '').replace(/^\/+|\/+$/g, '');
  const pathname = '/api/' + (sub ? sub : '');

  const exact = EXACT[req.method + ' ' + pathname];
  if (exact) return exact(req, res);

  req.query = Object.assign({}, req.query);

  let m;
  if (req.method === 'PATCH' && (m = pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/))) {
    req.query.id = m[1];
    return require('../handlers/admin/orders/[id]/status.js')(req, res);
  }
  if (req.method === 'DELETE' && (m = pathname.match(/^\/api\/admin\/orders\/(\d+)$/))) {
    req.query.id = m[1];
    return require('../handlers/admin/orders/[id].js')(req, res);
  }
  if (req.method === 'DELETE' && (m = pathname.match(/^\/api\/admin\/messages\/(\d+)$/))) {
    req.query.id = m[1];
    return require('../handlers/admin/messages/[id].js')(req, res);
  }

  send(res, 404, { error: 'Not Found' });
};