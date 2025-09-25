require('dotenv').config();
const express = require('express');
// Updated for Neon database connection
const cors = require('cors');
const usersRoutes = require('./routes/users');
const farmsRoutes = require('./routes/farms');
const fieldsRoutes = require('./routes/fields'); // Import fields routes
const authRoutes = require('./routes/auth'); // Import auth routes
// const productsRoutes = require('./routes/products'); // Removed - using fields directly
const notificationsRoutes = require('./routes/notifications'); // Import notifications routes
const ordersRoutes = require('./routes/orders'); // Import orders routes
const coinsRoutes = require('./routes/coins'); // Import coins routes
const { Pool } = require('pg');
const app = express();
const port = 5000;

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

// New route to test database connection
app.get('/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.status(200).send(`Database connected: ${result.rows[0].now}`);
  } catch (err) {
    console.error('Database connection error', err);
    res.status(500).send('Database connection failed');
  }
});

app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies
app.use('/api/users', usersRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/fields', fieldsRoutes); // Use fields routes
app.use('/api/auth', authRoutes); // Use auth routes
// app.use('/api/products', productsRoutes); // Removed - using fields directly
app.use('/api/notifications', notificationsRoutes); // Use notifications routes
app.use('/api/orders', ordersRoutes); // Use orders routes
app.use('/api/coins', coinsRoutes); // Use coins routes

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});