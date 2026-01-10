const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get messages for a specific conversation
router.get('/:conversationId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { conversationId } = req.params;
        const userId = req.user.id;

        // Verify user is part of the conversation
        const conv = await pool.query(
            'SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
            [conversationId, userId]
        );

        if (conv.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await pool.query(
            'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
            [conversationId]
        );

        // Mark messages as read
        await pool.query(
            'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
            [conversationId, userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Send a message
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { conversationId, content, messageType } = req.body;
        const senderId = req.user.id;

        if (!conversationId || !content) {
            return res.status(400).json({ error: 'Conversation ID and content are required' });
        }

        // Save message
        const result = await pool.query(
            'INSERT INTO messages (conversation_id, sender_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [conversationId, senderId, content, messageType || 'text']
        );

        const newMessage = result.rows[0];

        // Update conversation last_message
        await pool.query(
            'UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2',
            [content, conversationId]
        );

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error sending message:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Mark messages as read manually
router.put('/read/:conversationId', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { conversationId } = req.params;
        const userId = req.user.id;

        await pool.query(
            'UPDATE messages SET is_read = true WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false',
            [conversationId, userId]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error marking messages as read:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;
