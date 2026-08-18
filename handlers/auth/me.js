const { pool, send, requireUser } = require('../../api/_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const uid = requireUser(req, res);
  if (!uid) return;
  try {
    const r = await pool.query('SELECT id, name, phone FROM users WHERE id = $1', [uid]);
    if (!r.rows[0]) return send(res, 401, { error: 'Unauthorized' });
    send(res, 200, { user: r.rows[0] });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};