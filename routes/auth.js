const express = require('express');
const router = express.Router();
const pool = require('../db');

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For simplicity, we're returning the user object directly. In a real app,
    // you'd generate a JWT token here and send it back.
    res.json({ user: user.rows[0], message: 'Login successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;