const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get user's coin balance
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Received request for user coins:', userId);
        
        const result = await pool.query(
            'SELECT coins FROM users WHERE id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ coins: result.rows[0].coins });
    } catch (err) {
        console.error('Error getting user coins:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update user's coin balance
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { coins } = req.body;
        console.log('Received request to update user coins:', userId, 'to', coins);
        
        if (typeof coins !== 'number' || coins < 0) {
            return res.status(400).json({ error: 'Invalid coins value' });
        }
        
        const result = await pool.query(
            'UPDATE users SET coins = $1 WHERE id = $2 RETURNING coins',
            [coins, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ coins: result.rows[0].coins });
    } catch (err) {
        console.error('Error updating user coins:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Deduct coins from user's balance
router.post('/:userId/deduct', async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;
        
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount value' });
        }
        
        // Get current balance
        const currentResult = await pool.query(
            'SELECT coins FROM users WHERE id = $1',
            [userId]
        );
        
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentCoins = currentResult.rows[0].coins;
        
        if (currentCoins < amount) {
            return res.status(400).json({ error: 'Insufficient coins' });
        }
        
        // Deduct coins
        const newCoins = currentCoins - amount;
        const result = await pool.query(
            'UPDATE users SET coins = $1 WHERE id = $2 RETURNING coins',
            [newCoins, userId]
        );
        
        res.json({ coins: result.rows[0].coins, deducted: amount });
    } catch (err) {
        console.error('Error deducting coins:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Add coins to user's balance
router.post('/:userId/add', async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;
        
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount value' });
        }
        
        // Get current balance
        const currentResult = await pool.query(
            'SELECT coins FROM users WHERE id = $1',
            [userId]
        );
        
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const currentCoins = currentResult.rows[0].coins;
        const newCoins = currentCoins + amount;
        
        const result = await pool.query(
            'UPDATE users SET coins = $1 WHERE id = $2 RETURNING coins',
            [newCoins, userId]
        );
        
        res.json({ coins: result.rows[0].coins, added: amount });
    } catch (err) {
        console.error('Error adding coins:', err.message);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;