const { pool, send, requireUser } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  const uid = requireUser(req, res);
  if (!uid) return;
  try {
    const r = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [uid]);
    const rows = r.rows.map((o) => {
      let items = [];
      try {
        items = JSON.parse(o.items_json || '[]');
      } catch (e) {}
      return { ...o, items };
    });
    send(res, 200, rows);
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};