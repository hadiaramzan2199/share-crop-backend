const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming db.js is in the parent directory

// Get all users
router.get('/', async (req, res) => {
  try {
    const allUsers = await pool.query('SELECT * FROM users');
    res.json(allUsers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      return res.status(404).json('User not found');
    }
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single user by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Received request for user by email:', email);

    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log('Query result:', user.rows);

    if (user.rows.length === 0) {
      console.log('User not found for email:', email);
      return res.status(404).json('User not found');
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error('Error in GET /email/:email:', err);  // Log the full error object
    res.status(500).send('Server Error');
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { id, name, email, password, user_type } = req.body;
    console.log('Received request to create user:', { id, name, email, user_type }); // Add logging
    const newUser = await pool.query(
      'INSERT INTO users (id, name, email, password, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, email, password, user_type]
    );
    console.log('User created successfully:', newUser.rows[0]); // Add logging
    res.json(newUser.rows[0]);
  } catch (err) {
    console.error('Error in POST /users:', err.message); // Add logging
    res.status(500).send('Server Error');
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const updateUser = await pool.query(
      'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4 RETURNING *',
      [name, email, password, id]
    );
    if (updateUser.rows.length === 0) {
      return res.status(404).json('User not found');
    }
    res.json(updateUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteUser = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    if (deleteUser.rows.length === 0) {
      return res.status(404).json('User not found');
    }
    res.json('User deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
