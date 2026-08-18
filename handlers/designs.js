const { pool, send, readBody, requireUser } = require('../api/_lib');

module.exports = async (req, res) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    if (req.method === 'POST') {
      const body = await readBody(req);
      const name = String(body.name || '').trim() || 'My Design';
      const original = String(body.original_image || '');
      const final = String(body.final_image || '');
      const shades = Array.isArray(body.shades) ? body.shades : [];
      const regions = Array.isArray(body.regions) ? body.regions : [];

      if (!final) return send(res, 400, { error: 'Final image is required' });

      const r = await pool.query(
        'INSERT INTO designs (user_id, name, original_image, final_image, shades, regions) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, created_at',
        [userId, name, original, final, JSON.stringify(shades), JSON.stringify(regions)]
      );
      return send(res, 201, { id: r.rows[0].id, name: r.rows[0].name, created_at: r.rows[0].created_at });
    }

    if (req.method === 'GET') {
      const r = await pool.query(
        'SELECT id, name, original_image, final_image, shades, created_at FROM designs WHERE user_id = $1 ORDER BY id DESC',
        [userId]
      );
      return send(res, 200, { designs: r.rows });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};