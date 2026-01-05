const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * POST /api/complaints
 * Create a new complaint (for both farmers and buyers)
 * 
 * Body:
 * - created_by: uuid (user ID creating the complaint)
 * - target_type: string ('field', 'order', 'user', 'payment', 'delivery', etc.)
 * - target_id: uuid (ID of the target being complained about)
 * - category: string (optional, e.g., 'Service', 'Quality', 'Delivery', 'Payment', 'Refund', 'Field', 'Order', 'User')
 * - description: string (required, the complaint details/message)
 */
router.post('/', async (req, res) => {
  try {
    const { created_by, target_type, target_id, category, description } = req.body;

    // Validation
    if (!created_by) {
      return res.status(400).json({ error: 'created_by is required' });
    }
    if (!target_type) {
      return res.status(400).json({ error: 'target_type is required' });
    }
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: 'description is required and cannot be empty' });
    }

    // Validate target_type
    const validTargetTypes = ['field', 'order', 'user', 'payment', 'delivery', 'service', 'quality', 'refund'];
    const normalizedTargetType = target_type.toLowerCase();
    if (!validTargetTypes.includes(normalizedTargetType)) {
      return res.status(400).json({ 
        error: `Invalid target_type. Must be one of: ${validTargetTypes.join(', ')}` 
      });
    }

    // Verify user exists
    const userCheck = await pool.query('SELECT id, user_type FROM users WHERE id = $1', [created_by]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Target types that require target_id
    const requiresTargetId = ['field', 'order', 'user'];
    
    // For types that require target_id, validate it exists
    if (requiresTargetId.includes(normalizedTargetType)) {
      if (!target_id || target_id.trim() === '') {
        return res.status(400).json({ error: `target_id is required for target_type: ${target_type}` });
      }

      // Verify target exists based on target_type
      let targetExists = false;
      if (normalizedTargetType === 'field') {
        const fieldCheck = await pool.query('SELECT id FROM fields WHERE id = $1', [target_id]);
        targetExists = fieldCheck.rows.length > 0;
      } else if (normalizedTargetType === 'order') {
        const orderCheck = await pool.query('SELECT id FROM orders WHERE id = $1', [target_id]);
        targetExists = orderCheck.rows.length > 0;
      } else if (normalizedTargetType === 'user') {
        const userTargetCheck = await pool.query('SELECT id FROM users WHERE id = $1', [target_id]);
        targetExists = userTargetCheck.rows.length > 0;
      }

      if (!targetExists) {
        return res.status(404).json({ error: `Target ${target_type} with id ${target_id} not found` });
      }
    }
    
    // For general complaint types (service, quality, refund, etc.), target_id is optional
    // Use a placeholder UUID if not provided
    const finalTargetId = target_id && target_id.trim() !== '' 
      ? target_id 
      : '00000000-0000-0000-0000-000000000000'; // Placeholder UUID for general complaints

    // Insert complaint
    const result = await pool.query(
      `INSERT INTO complaints (created_by, target_type, target_id, category, description, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING *`,
      [created_by, normalizedTargetType, finalTargetId, category || null, description.trim()]
    );

    const complaint = result.rows[0];

    // Create notification for admin (optional - you might want to notify admins of new complaints)
    // This is optional and can be removed if you don't want notifications

    res.status(201).json({
      id: complaint.id,
      created_by: complaint.created_by,
      target_type: complaint.target_type,
      target_id: complaint.target_id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      created_at: complaint.created_at,
      updated_at: complaint.updated_at,
      message: 'Complaint submitted successfully'
    });
  } catch (err) {
    console.error('Error creating complaint:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

/**
 * GET /api/complaints
 * Get complaints for the authenticated user
 * 
 * Query params:
 * - status: filter by status ('open', 'in_review', 'resolved')
 * - user_id: optional, if provided returns complaints created by that user
 */
router.get('/', async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = `
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
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (user_id) {
      paramCount++;
      query += ` AND c.created_by = $${paramCount}`;
      params.push(user_id);
    }

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching complaints:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

/**
 * GET /api/complaints/:id
 * Get a single complaint by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
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
      WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching complaint:', err.message);
    res.status(500).json({ error: 'Server Error', details: err.message });
  }
});

module.exports = router;

