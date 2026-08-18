const { pool, send, requireAdmin } = require('../../../api/_lib');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.query.id);

  if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM orders WHERE id = $1', [id]);
      send(res, 200, { ok: true });
    } catch (e) {
      send(res, 500, { error: 'Server error' });
    }
    return;
  }

  send(res, 405, { error: 'Method not allowed' });
};