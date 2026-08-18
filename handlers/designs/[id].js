const { pool, send, readBody, requireUser } = require('../../api/_lib');

module.exports = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  const id = Number(req.query.id);
  if (!id) return send(res, 400, { error: 'Invalid design id' });

  try {
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      if (!name) return send(res, 400, { error: 'Name is required' });
      const r = await pool.query(
        'UPDATE designs SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING id, name',
        [name, id, userId]
      );
      if (!r.rowCount) return send(res, 404, { error: 'Design not found' });
      return send(res, 200, { id, name: r.rows[0].name });
    }

    if (req.method === 'DELETE') {
      const r = await pool.query('DELETE FROM designs WHERE id = $1 AND user_id = $2', [id, userId]);
      if (!r.rowCount) return send(res, 404, { error: 'Design not found' });
      return send(res, 200, { ok: true });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};