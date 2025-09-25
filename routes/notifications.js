const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all notifications
router.get('/', async (req, res) => {
    try {
        const allNotifications = await pool.query('SELECT * FROM notifications');
        res.json(allNotifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get notifications for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const notifications = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const updateNotification = await pool.query(
            'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
            [id]
        );
        if (updateNotification.rows.length === 0) {
            return res.status(404).json('Notification not found');
        }
        res.json(updateNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single notification by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
        if (notification.rows.length === 0) {
            return res.status(404).json('Notification not found');
        }
        res.json(notification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new notification
router.post('/', async (req, res) => {
    try {
        const { user_id, message, type, read = false } = req.body;
        const newNotification = await pool.query(
            'INSERT INTO notifications (user_id, message, type, read) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, message, type, read]
        );
        res.json(newNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a notification
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, message, type, read } = req.body;
        const updateNotification = await pool.query(
            'UPDATE notifications SET user_id = $1, message = $2, type = $3, read = $4 WHERE id = $5 RETURNING *',
            [user_id, message, type, read, id]
        );
        if (updateNotification.rows.length === 0) {
            return res.status(404).json('Notification not found');
        }
        res.json(updateNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteNotification = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
        if (deleteNotification.rows.length === 0) {
            return res.status(404).json('Notification not found');
        }
        res.json('Notification deleted');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get notifications for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userNotifications = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(userNotifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const updateNotification = await pool.query(
            'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
            [id]
        );
        if (updateNotification.rows.length === 0) {
            return res.status(404).json('Notification not found');
        }
        res.json(updateNotification.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;