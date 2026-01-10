const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all conversations for the logged-in user
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = req.user.id;

        const query = `
      SELECT 
        c.id,
        c.last_message,
        c.last_message_at,
        c.created_at,
        u.id as participant_id,
        u.name as participant_name,
        u.profile_image_url as participant_avatar,
        u.user_type as participant_type,
        (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != $1 AND m.is_read = false) as unread_count
      FROM conversations c
      JOIN users u ON (CASE WHEN c.user1_id = $1 THEN c.user2_id = u.id ELSE c.user1_id = u.id END)
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.last_message_at DESC
    `;

        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching conversations:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Start or get a conversation with another user
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { participantId } = req.body;
        const currentUserId = req.user.id;

        if (!participantId) {
            return res.status(400).json({ error: 'Participant ID is required' });
        }

        if (participantId === currentUserId) {
            return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
        }

        // Ensure user1_id < user2_id for consistent lookup
        const [u1, u2] = currentUserId < participantId ? [currentUserId, participantId] : [participantId, currentUserId];

        // Check if conversation already exists
        const existing = await pool.query(
            'SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2',
            [u1, u2]
        );

        if (existing.rows.length > 0) {
            return res.json({ id: existing.rows[0].id });
        }

        // Create new conversation
        const result = await pool.query(
            'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
            [u1, u2]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error starting conversation:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
