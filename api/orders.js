const { pool, send, readBody, requireUser } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const body = await readBody(req);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const total = Math.round(Number(body.total) || 0);

    if (!name || !phone || items.length === 0) {
      return send(res, 400, { error: 'Name, phone and items are required' });
    }
    const r = await pool.query(
      'INSERT INTO orders (customer_name, customer_phone, total, items_json, user_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, status',
      [name, phone, total, JSON.stringify(items), userId]
    );
    send(res, 201, { id: r.rows[0].id, status: r.rows[0].status });
  } catch (e) {
    send(res, 500, { error: 'Server error' });
  }
};