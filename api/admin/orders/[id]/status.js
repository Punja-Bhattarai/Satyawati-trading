const { pool, send, readBody, requireAdmin } = require('../../../_lib');

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'PATCH') return send(res, 405, { error: 'Method not allowed' });

  const id = Number(req.query.id);
  const body = await readBody(req);
  const status = String(body.status || '');
  if (!['new', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return send(res, 400, { error: 'Invalid status' });
  }
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    send(res, 200, { ok: true });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};