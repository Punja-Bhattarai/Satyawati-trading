const { pool, send, readBody, signJWT, hashPassword } = require('../../api/_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (!name || !phone || password.length < 4) {
      return send(res, 400, { error: 'Name, phone and a password (min 4 characters) are required' });
    }
    const exists = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    if (exists.rowCount > 0) {
      return send(res, 409, { error: 'An account with this phone already exists' });
    }
    const r = await pool.query(
      'INSERT INTO users (name, phone, password_hash) VALUES ($1,$2,$3) RETURNING id',
      [name, phone, hashPassword(password)]
    );
    const token = signJWT({ userId: r.rows[0].id, role: 'user' }, 12 * 60 * 60 * 1000);
    send(res, 201, { token, user: { id: r.rows[0].id, name, phone } });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};
