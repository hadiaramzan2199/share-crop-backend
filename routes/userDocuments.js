const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all documents for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM user_documents WHERE user_id = $1 ORDER BY uploaded_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user documents:', err.message);
        res.status(500).send('Server Error');
    }
});

// Add a new document record
router.post('/', async (req, res) => {
    try {
        const { user_id, file_name, file_url, file_type } = req.body;

        if (!user_id || !file_name || !file_url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await pool.query(
            'INSERT INTO user_documents (user_id, file_name, file_url, file_type) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, file_name, file_url, file_type || 'other']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error adding user document:', err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a document record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM user_documents WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting user document:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
