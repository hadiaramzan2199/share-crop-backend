const pool = require('../../../../db');

function ensureTable(err, table) {
  if (err && err.code === '42P01') {
    throw Object.assign(new Error(`Schema requires table ${table}`), { status: 500 });
  }
}

async function listComplaints(req, res) {
  try {
    const { status } = req.query;
    let q = `
      SELECT
        c.id,
        c.created_by,
        u.name AS created_by_name,
        u.email AS created_by_email,
        u.user_type AS created_by_type,
        c.category,
        c.target_type,
        c.target_id,
        c.description,
        c.status,
        c.admin_remarks,
        c.created_at,
        c.updated_at
      FROM complaints c
      LEFT JOIN users u ON u.id = c.created_by
    `;
    const params = [];
    if (status) {
      q += ' WHERE c.status = $1';
      params.push(status);
    }
    q += ' ORDER BY c.updated_at DESC';
    const result = await pool.query(q, params);
    res.json(result.rows);
  } catch (err) {
    ensureTable(err, 'complaints');
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message || 'Server Error' });
  }
}

const allowedTransitions = {
  open: new Set(['in_review', 'resolved']),
  in_review: new Set(['resolved']),
  resolved: new Set([]),
};

async function updateComplaintStatus(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, admin_remarks } = req.body || {};
    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }
    if (!['open', 'in_review', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await client.query('BEGIN');
    const pre = await client.query('SELECT status FROM complaints WHERE id = $1 FOR UPDATE', [id]);
    if (pre.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not Found' });
    }
    const current = pre.rows[0].status;
    const allowed = allowedTransitions[current];
    if (!allowed || !allowed.has(status)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Invalid transition' });
    }
    await client.query(
      'UPDATE complaints SET status = $2, admin_remarks = $3, updated_at = now() WHERE id = $1',
      [id, status, admin_remarks || null]
    );
    await client.query('COMMIT');
    res.json({ id, status });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    ensureTable(err, 'complaints');
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message || 'Server Error' });
  } finally {
    client.release();
  }
}

async function updateComplaintRemarks(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { remarks } = req.body || {};
    await client.query('BEGIN');
    const pre = await client.query('SELECT id FROM complaints WHERE id = $1 FOR UPDATE', [id]);
    if (pre.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not Found' });
    }
    await client.query(
      'UPDATE complaints SET admin_remarks = $2, updated_at = now() WHERE id = $1',
      [id, remarks || null]
    );
    await client.query('COMMIT');
    res.json({ id, admin_remarks: remarks || null });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    ensureTable(err, 'complaints');
    const statusCode = err.status || 500;
    res.status(statusCode).json({ error: err.message || 'Server Error' });
  } finally {
    client.release();
  }
}

module.exports = { listComplaints, updateComplaintStatus, updateComplaintRemarks };
