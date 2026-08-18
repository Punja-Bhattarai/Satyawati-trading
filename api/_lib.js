/* ============================================================
   Satyawati Trading & Paints Suppliers — Vercel serverless lib
   Shared helpers: Supabase (Postgres) pool, JWT, body parsing.
   Files starting with "_" are never deployed as routes.
============================================================ */
const crypto = require('crypto');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 5,
});

/* Change this via the JWT_SECRET env var in production */
const JWT_SECRET = process.env.JWT_SECRET || 'satyawati-jwt-secret-change-me';

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) reject(new Error('Body too large'));
    });
    req.on('end', () => resolve(parseBody(data)));
    req.on('error', reject);
  });
}

/* ---- JWT (HS256 via node:crypto, no extra deps) ---- */
const b64u = (buf) => Buffer.from(buf).toString('base64url');

function signJWT(payload, ttlMs) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + Math.floor(ttlMs / 1000) };
  const h = b64u(Buffer.from(JSON.stringify(header)));
  const b = b64u(Buffer.from(JSON.stringify(body)));
  const sig = b64u(crypto.createHmac('sha256', JWT_SECRET).update(h + '.' + b).digest());
  return h + '.' + b + '.' + sig;
}

function verifyJWT(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const [h, b, s] = parts;
    const expected = b64u(crypto.createHmac('sha256', JWT_SECRET).update(h + '.' + b).digest());
    const a = Buffer.from(s);
    const b2 = Buffer.from(expected);
    if (a.length !== b2.length || !crypto.timingSafeEqual(a, b2)) return null;
    const payload = JSON.parse(Buffer.from(b, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function getToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function requireUser(req, res) {
  const p = verifyJWT(getToken(req));
  if (!p || p.role !== 'user') {
    send(res, 401, { error: 'Please login first' });
    return null;
  }
  return p.userId;
}

function requireAdmin(req, res) {
  const p = verifyJWT(getToken(req));
  if (!p || p.role !== 'admin') {
    send(res, 401, { error: 'Unauthorized' });
    return null;
  }
  return true;
}

/* ---- password hashing (scrypt, same scheme as local server) ---- */
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

module.exports = { pool, send, readBody, signJWT, verifyJWT, requireUser, requireAdmin, hashPassword, verifyPassword };
