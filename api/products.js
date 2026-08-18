const { pool, send } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  try {
    const r = await pool.query('SELECT id, name, category, price, unit, kind, color, tag, img FROM products ORDER BY id');
    send(res, 200, r.rows);
  } catch (e) {
    send(res, 500, { error: 'Database error' });
  }
};
