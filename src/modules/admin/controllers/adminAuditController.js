const pool = require('../../../../db');

async function getAuditLogs(req, res) {
  try {
    const { from, to, user, action, entity_type, entity_id } = req.query;
    const params = [];
    const where = [];
    if (user) { params.push(user); where.push(`actor_id = $${params.length}`); }
    if (action) { params.push(action); where.push(`action = $${params.length}`); }
    if (entity_type) { params.push(entity_type); where.push(`entity_type = $${params.length}`); }
    if (entity_id) { params.push(entity_id); where.push(`entity_id = $${params.length}`); }
    if (from) { params.push(from); where.push(`created_at >= $${params.length}`); }
    if (to) { params.push(to); where.push(`created_at <= $${params.length}`); }
    const sql = `SELECT id, actor_id, action, entity_type, entity_id, metadata, created_at FROM audit_logs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 1000`;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    const code = err && err.code;
    if (code === '42P01') return res.status(500).json({ error: 'Schema requires audit_logs table' });
    res.status(500).json({ error: 'Server Error' });
  }
}

module.exports = { getAuditLogs };
