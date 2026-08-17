/* ============================================================
   Satyawati Trading & Paints Suppliers — Backend Server
   Node.js (zero dependencies) + built-in SQLite (node:sqlite)
   Serves the static site AND the JSON API.
   Run:  node server.js   (default port 3000)
============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'satyawati123';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'shop.db');

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_PATH);

/* ============================================================
   SCHEMA
============================================================ */
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id       INTEGER PRIMARY KEY,
    name     TEXT NOT NULL,
    category TEXT NOT NULL,
    price    INTEGER NOT NULL,
    unit     TEXT NOT NULL DEFAULT 'L',
    kind     TEXT,
    color    TEXT,
    tag      TEXT,
    img      TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total         INTEGER NOT NULL,
    items_json    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'new',
    created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT,
    subject    TEXT,
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    phone         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`);

/* migrate existing orders table to track the customer user */
try {
  db.exec('ALTER TABLE orders ADD COLUMN user_id INTEGER');
} catch (err) {
  /* column already exists */
}

/* ============================================================
   SEED PRODUCTS (first run only)
============================================================ */
const PRODUCTS = [
  { id: 1,  name: 'Royale Luxury Emulsion',     category: 'interior', price: 450, unit: 'L',  img: 'royale-luxury.png' },
  { id: 2,  name: 'Royale Shyne',               category: 'interior', price: 620, unit: 'L',  img: 'royale-shyne.png' },
  { id: 3,  name: 'Royale Aspira',              category: 'interior', price: 520, unit: 'L',  img: 'royale-aspira.png' },
  { id: 4,  name: 'Royale Blynn',               category: 'interior', price: 470, unit: 'L',  img: 'royale-blynn.png' },
  { id: 5,  name: 'Apcolite Premium Emulsion',  category: 'interior', price: 310, unit: 'L',  img: 'apcolite-premium.png' },
  { id: 6,  name: 'Tractor Shine Emulsion',     category: 'interior', price: 220, unit: 'L',  img: 'tractor-shine.png' },
  { id: 7,  name: 'Tractor Emulsion',           category: 'interior', price: 185, unit: 'L',  img: 'tractor-emulsion.png' },
  { id: 8,  name: 'Apex Ultima',                category: 'exterior', price: 480, unit: 'L',  img: 'apex-ultima.png' },
  { id: 9,  name: 'Apex Ultima Protek Shyne',   category: 'exterior', price: 650, unit: 'L',  img: 'apex-ultima-protek-shyne.png' },
  { id: 10, name: 'Apex Ultima Protek',         category: 'exterior', price: 560, unit: 'L',  img: 'apex-ultima-protek.png' },
  { id: 11, name: 'Apex Weatherproof Emulsion', category: 'exterior', price: 390, unit: 'L',  img: 'apex-weatherproof.png' },
  { id: 12, name: 'Ace',                        category: 'exterior', price: 330, unit: 'L',  img: 'ace.png' },
  { id: 13, name: 'Ace Shyne',                  category: 'exterior', price: 430, unit: 'L',  img: 'ace-shyne.png' },
  { id: 14, name: 'Interior Wall Primer',       category: 'primer',   price: 180, unit: 'L',  kind: 'drum',  color: '#e8e4da' },
  { id: 15, name: 'Exterior Wall Primer',       category: 'primer',   price: 210, unit: 'L',  kind: 'drum',  color: '#d8d2c0' },
  { id: 16, name: 'Paint Brush 1"',             category: 'brush',    price: 60,  unit: 'pc',  kind: 'brush', tag: '1 inch' },
  { id: 17, name: 'Paint Brush 1.5"',           category: 'brush',    price: 80,  unit: 'pc',  kind: 'brush', tag: '1.5 inch' },
  { id: 18, name: 'Paint Brush 2"',             category: 'brush',    price: 100, unit: 'pc',  kind: 'brush', tag: '2 inch' },
  { id: 19, name: 'Paint Brush 2.5"',           category: 'brush',    price: 120, unit: 'pc',  kind: 'brush', tag: '2.5 inch' },
  { id: 20, name: 'Paint Brush 3"',             category: 'brush',    price: 150, unit: 'pc',  kind: 'brush', tag: '3 inch' },
  { id: 21, name: 'Roller 4"',                  category: 'roller',   price: 90,  unit: 'pc',  kind: 'roller', tag: '4 inch' },
  { id: 22, name: 'Roller 7"',                  category: 'roller',   price: 130, unit: 'pc',  kind: 'roller', tag: '7 inch' },
  { id: 23, name: 'Roller 9"',                  category: 'roller',   price: 160, unit: 'pc',  kind: 'roller', tag: '9 inch' },
  { id: 24, name: 'Roller Tray & Set',          category: 'roller',   price: 250, unit: 'pc',  kind: 'roller', tag: 'complete set' },
];

const seeded = db.prepare('SELECT COUNT(*) AS c FROM products').get();
if (seeded.c === 0) {
  const ins = db.prepare(
    'INSERT INTO products (id,name,category,price,unit,kind,color,tag,img) VALUES (?,?,?,?,?,?,?,?,?)'
  );
  PRODUCTS.forEach((p) =>
    ins.run(p.id, p.name, p.category, p.price, p.unit, p.kind || null, p.color || null, p.tag || null, p.img || null)
  );
}

/* ============================================================
   HELPERS
============================================================ */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

/* --- static file serving (path-safe) --- */
function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath);
  if (rel === '/' || rel === '') rel = '/index.html';

  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

/* --- admin auth (in-memory tokens) --- */
const sessions = new Map(); // token -> expiry ms
const TOKEN_TTL = 12 * 60 * 60 * 1000;

function requireAuth(req, res) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const exp = sessions.get(token);
  if (!exp || exp < Date.now()) {
    sessions.delete(token);
    sendJSON(res, 401, { error: 'Unauthorized' });
    return false;
  }
  return true;
}

/* --- customer user sessions (separate from admin) --- */
const userSessions = new Map(); // token -> { userId, exp }
const USER_TOKEN_TTL = 12 * 60 * 60 * 1000;

function requireUser(req, res) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const s = userSessions.get(token);
  if (!s || s.exp < Date.now()) {
    userSessions.delete(token);
    sendJSON(res, 401, { error: 'Please login first' });
    return null;
  }
  return s.userId;
}

/* --- password hashing (scrypt, no external deps) --- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  const candidate = crypto.scryptSync(pw, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), candidate);
}

/* ============================================================
   ROUTER
============================================================ */
const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const method = req.method;

  try {
    /* ---------- API: products ---------- */
    if (pathname === '/api/products' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM products ORDER BY id').all();
      return sendJSON(res, 200, rows);
    }

    /* ---------- API: register user ---------- */
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const password = String(body.password || '');

      if (!name || !phone || password.length < 4) {
        return sendJSON(res, 400, { error: 'Name, phone and a password (min 4 characters) are required' });
      }
      const exists = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
      if (exists) return sendJSON(res, 409, { error: 'An account with this phone already exists' });

      const result = db
        .prepare('INSERT INTO users (name, phone, password_hash) VALUES (?,?,?)')
        .run(name, phone, hashPassword(password));
      const token = crypto.randomBytes(24).toString('hex');
      userSessions.set(token, { userId: Number(result.lastInsertRowid), exp: Date.now() + USER_TOKEN_TTL });
      return sendJSON(res, 201, { token, user: { id: Number(result.lastInsertRowid), name, phone } });
    }

    /* ---------- API: login user ---------- */
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readBody(req);
      const phone = String(body.phone || '').trim();
      const password = String(body.password || '');

      const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
      if (!user || !verifyPassword(password, user.password_hash)) {
        return sendJSON(res, 401, { error: 'Wrong phone number or password' });
      }
      const token = crypto.randomBytes(24).toString('hex');
      userSessions.set(token, { userId: user.id, exp: Date.now() + USER_TOKEN_TTL });
      return sendJSON(res, 200, { token, user: { id: user.id, name: user.name, phone: user.phone } });
    }

    /* ---------- API: logout user ---------- */
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const h = req.headers.authorization || '';
      userSessions.delete(h.startsWith('Bearer ') ? h.slice(7) : '');
      return sendJSON(res, 200, { ok: true });
    }

    /* ---------- API: current user ---------- */
    if (pathname === '/api/auth/me' && method === 'GET') {
      const uid = requireUser(req, res);
      if (!uid) return;
      const user = db.prepare('SELECT id, name, phone FROM users WHERE id = ?').get(uid);
      if (!user) return sendJSON(res, 401, { error: 'Unauthorized' });
      return sendJSON(res, 200, { user });
    }

    /* ---------- API: my orders ---------- */
    if (pathname === '/api/my-orders' && method === 'GET') {
      const uid = requireUser(req, res);
      if (!uid) return;
      const rows = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC').all(uid);
      rows.forEach((r) => (r.items = JSON.parse(r.items_json || '[]')));
      return sendJSON(res, 200, rows);
    }

    /* ---------- API: place order (login required) ---------- */
    if (pathname === '/api/orders' && method === 'POST') {
      const userId = requireUser(req, res);
      if (!userId) return;
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const items = Array.isArray(body.items) ? body.items : [];
      const total = Math.round(Number(body.total) || 0);

      if (!name || !phone || items.length === 0) {
        return sendJSON(res, 400, { error: 'Name, phone and items are required' });
      }

      const result = db
        .prepare('INSERT INTO orders (customer_name, customer_phone, total, items_json, user_id) VALUES (?,?,?,?,?)')
        .run(name, phone, total, JSON.stringify(items), userId);

      return sendJSON(res, 201, { id: Number(result.lastInsertRowid), status: 'new' });
    }

    /* ---------- API: admin login ---------- */
    if (pathname === '/api/admin/login' && method === 'POST') {
      const body = await readBody(req);
      if (body.password === ADMIN_PASSWORD) {
        const token = crypto.randomBytes(24).toString('hex');
        sessions.set(token, Date.now() + TOKEN_TTL);
        return sendJSON(res, 200, { token });
      }
      return sendJSON(res, 401, { error: 'Wrong password' });
    }

    /* ---------- API: list orders (auth) ---------- */
    if (pathname === '/api/admin/orders' && method === 'GET') {
      if (!requireAuth(req, res)) return;
      const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all();
      rows.forEach((r) => (r.items = JSON.parse(r.items_json || '[]')));
      return sendJSON(res, 200, rows);
    }

    /* ---------- API: update order status (auth) ---------- */
    const statusMatch = pathname.match(/^\/api\/admin\/orders\/(\d+)\/status$/);
    if (statusMatch && method === 'PATCH') {
      if (!requireAuth(req, res)) return;
      const body = await readBody(req);
      const allowed = ['new', 'confirmed', 'completed', 'cancelled'];
      if (!allowed.includes(body.status)) {
        return sendJSON(res, 400, { error: 'Invalid status' });
      }
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(body.status, Number(statusMatch[1]));
      return sendJSON(res, 200, { ok: true });
    }

    /* ---------- API: delete order (auth) ---------- */
    const delOrder = pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
    if (delOrder && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      db.prepare('DELETE FROM orders WHERE id = ?').run(Number(delOrder[1]));
      return sendJSON(res, 200, { ok: true });
    }

    /* ---------- API: contact message ---------- */
    if (pathname === '/api/messages' && method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const phone = String(body.phone || '').trim();
      const subject = String(body.subject || '').trim();
      const message = String(body.message || '').trim();

      if (!name || !message) {
        return sendJSON(res, 400, { error: 'Name and message are required' });
      }
      db.prepare('INSERT INTO messages (name, phone, subject, message) VALUES (?,?,?,?)')
        .run(name, phone, subject, message);
      return sendJSON(res, 201, { ok: true });
    }

    /* ---------- API: list messages (auth) ---------- */
    if (pathname === '/api/admin/messages' && method === 'GET') {
      if (!requireAuth(req, res)) return;
      const rows = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
      return sendJSON(res, 200, rows);
    }

    /* ---------- API: delete message (auth) ---------- */
    const delMsg = pathname.match(/^\/api\/admin\/messages\/(\d+)$/);
    if (delMsg && method === 'DELETE') {
      if (!requireAuth(req, res)) return;
      db.prepare('DELETE FROM messages WHERE id = ?').run(Number(delMsg[1]));
      return sendJSON(res, 200, { ok: true });
    }

    /* ---------- static files ---------- */
    return serveStatic(req, res, pathname);
  } catch (err) {
    return sendJSON(res, 500, { error: 'Server error: ' + err.message });
  }
});

server.listen(PORT, () => {
  console.log('Satyawati Trading & Paints backend running');
  console.log('  Site:   http://localhost:' + PORT);
  console.log('  Admin:  http://localhost:' + PORT + '/admin.html');
  console.log('  Data:   ' + DB_PATH);
});