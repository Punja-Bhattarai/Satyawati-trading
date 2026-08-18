const { send, readBody, signJWT } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const password = String(body.password || '');
    const expected = process.env.ADMIN_PASSWORD || 'satyawati123';

    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    const ok =
      a.length === b.length &&
      (a.length === 0 || require('crypto').timingSafeEqual(a, b));

    if (!ok) return send(res, 401, { error: 'Wrong password' });
    const token = signJWT({ role: 'admin' }, 12 * 60 * 60 * 1000);
    send(res, 200, { token });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};