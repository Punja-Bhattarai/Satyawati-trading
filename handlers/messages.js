const { pool, send, readBody } = require('../api/_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !message) return send(res, 400, { error: 'Name and message are required' });
    await pool.query(
      'INSERT INTO messages (name, phone, subject, message) VALUES ($1,$2,$3,$4)',
      [name, phone, subject, message]
    );
    send(res, 201, { ok: true });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};