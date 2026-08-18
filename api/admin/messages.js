const { pool, send, requireAdmin } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  try {
    const r = await pool.query('SELECT * FROM messages ORDER BY id DESC');
    send(res, 200, r.rows);
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};