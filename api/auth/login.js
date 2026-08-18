const { pool, send, readBody, signJWT, verifyPassword } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    const r = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = r.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return send(res, 401, { error: 'Wrong phone number or password' });
    }
    const token = signJWT({ userId: user.id, role: 'user' }, 12 * 60 * 60 * 1000);
    send(res, 200, { token, user: { id: user.id, name: user.name, phone: user.phone } });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};