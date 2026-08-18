const { pool, send, requireAdmin } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!requireAdmin(req, res)) return;
  try {
    const r = await pool.query(
      'SELECT o.*, u.name AS user_name, u.phone AS user_phone FROM orders o LEFT JOIN users u ON u.id = o.user_id ORDER BY o.id DESC'
    );
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