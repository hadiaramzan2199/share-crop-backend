
const pool = require('../../../../db');

async function getUsersOverview(req, res) {
  try {
    const farmersCount = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE user_type = 'farmer'");
    const buyersCount = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE user_type = 'buyer'");

    let activeCount, inactiveCount;
    try {
      const active = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active = TRUE");
      const inactive = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_active = FALSE");
      activeCount = active.rows[0].count;
      inactiveCount = inactive.rows[0].count;
    } catch (err) {
      const msg = err && err.code === '42703' ? 'Schema requires users.is_active' : 'Failed to count active/inactive users';
      return res.status(500).json({ error: msg });
    }

    res.json({
      totalFarmers: farmersCount.rows[0].count,
      totalBuyers: buyersCount.rows[0].count,
      activeUsers: activeCount,
      inactiveUsers: inactiveCount,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Error' });
  }
}

async function listPendingFarmers(req, res) {
  try {
    const result = await pool.query("SELECT id, name, email FROM users WHERE user_type = 'farmer' AND approval_status = 'pending'");
    res.json(result.rows);
  } catch (err) {
    const msg = err && err.code === '42703' ? 'Schema requires users.approval_status' : 'Server Error';
    res.status(500).json({ error: msg });
  }
}

async function getFarmerDocuments(req, res) {
  try {
    const { id } = req.params;
    // Optimized query - only fetch documents_json column with index hint
    const result = await pool.query(
      "SELECT documents_json FROM users WHERE id = $1 LIMIT 1", 
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return immediately without processing large JSON if not needed
    const documents = result.rows[0].documents_json;
    res.json({ documents: documents || null });
  } catch (err) {
    console.error('Error fetching farmer documents:', err);
    const msg = err && err.code === '42703' 
      ? 'Schema requires users.documents_json' 
      : err.message || 'Server Error';
    res.status(500).json({ error: msg });
  }
}

async function approveFarmer(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    
    const pre = await client.query("SELECT user_type, approval_status, is_active FROM users WHERE id = $1 FOR UPDATE", [id]);
    
    if (pre.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const row = pre.rows[0];
    
    // Case-insensitive check for user_type
    const userTypeLower = row.user_type?.toLowerCase();
    if (userTypeLower !== 'farmer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User is not a farmer', user_type: row.user_type });
    }
    
    // Handle case where approval_status might be null
    const approvalStatus = row.approval_status || 'pending';
    if (typeof approvalStatus !== 'string') {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Schema requires users.approval_status column', type: typeof approvalStatus });
    }
    
    // Case-insensitive check for approval_status
    const approvalStatusLower = approvalStatus.toLowerCase();
    if (approvalStatusLower !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `Farmer is already ${approvalStatus}. Cannot approve.`,
        current_status: approvalStatus 
      });
    }
    
    await client.query("UPDATE users SET approval_status = 'approved', is_active = TRUE WHERE id = $1", [id]);
    await client.query('COMMIT');
    res.json({ id, status: 'approved', message: 'Farmer approved successfully' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    const msg = err && err.code === '42703' 
      ? 'Database schema error: Missing required columns (approval_status or is_active)' 
      : err.message || 'Server Error';
    res.status(500).json({ error: msg, details: err.code });
  } finally {
    client.release();
  }
}

async function rejectFarmer(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    await client.query('BEGIN');
    const pre = await client.query("SELECT user_type, approval_status, is_active FROM users WHERE id = $1 FOR UPDATE", [id]);
    if (pre.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const row = pre.rows[0];
    // Case-insensitive check for user_type
    if (row.user_type?.toLowerCase() !== 'farmer') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User is not a farmer' });
    }
    // Handle case where approval_status might be null
    const approvalStatus = row.approval_status || 'pending';
    if (typeof approvalStatus !== 'string') {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Schema requires users.approval_status column' });
    }
    // Case-insensitive check for approval_status
    if (approvalStatus.toLowerCase() !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `Farmer is already ${approvalStatus}. Cannot reject.`,
        current_status: approvalStatus 
      });
    }
    await client.query("UPDATE users SET approval_status = 'rejected', is_active = FALSE, approval_reason = $2 WHERE id = $1", [id, reason || null]);
    await client.query('COMMIT');
    res.json({ id, status: 'rejected', message: 'Farmer rejected successfully' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Error rejecting farmer:', err);
    const msg = err && err.code === '42703' 
      ? 'Database schema error: Missing required columns (approval_status or is_active)' 
      : err.message || 'Server Error';
    res.status(500).json({ error: msg, details: err.code });
  } finally {
    client.release();
  }
}

module.exports = {
  getUsersOverview,
  listPendingFarmers,
  getFarmerDocuments,
  approveFarmer,
  rejectFarmer,
};
