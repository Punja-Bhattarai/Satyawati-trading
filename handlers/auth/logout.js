const { send } = require('../../api/_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  /* JWT is stateless — the client simply deletes the token */
  send(res, 200, { ok: true });
};