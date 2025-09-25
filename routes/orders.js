const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const allOrders = await pool.query('SELECT * FROM orders');
        res.json(allOrders.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get orders for farmer's fields (orders placed by buyers on farmer's fields)
router.get('/farmer-orders', async (req, res) => {
    try {
        const { farmerId } = req.query;
        
        if (!farmerId) {
            return res.status(400).json({ error: 'Farmer ID is required' });
        }
        
        const farmerOrders = await pool.query(`
            SELECT 
                o.id,
                o.quantity,
                o.total_price,
                o.status,
                o.created_at,
                o.selected_harvest_date,
                o.selected_harvest_label,
                f.id as field_id,
                f.name as field_name,
                f.location,
                f.category as crop_type,
                f.available_area,
                f.total_area,
                f.price_per_m2,
                f.image as image_url,
                f.owner_id as farmer_id,
                buyer.name as buyer_name,
                buyer.email as buyer_email
            FROM orders o
            JOIN fields f ON o.field_id = f.id
            LEFT JOIN users buyer ON o.buyer_id = buyer.id
            WHERE f.owner_id = $1
            ORDER BY o.created_at DESC
        `, [farmerId]);
        
        res.json(farmerOrders.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (order.rows.length === 0) {
            return res.status(404).json('Order not found');
        }
        res.json(order.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new order
router.post('/', async (req, res) => {
    try {
        console.log('Creating order with data:', req.body);
        const { buyer_id, field_id, quantity, total_price, status = 'pending', selected_harvest_date, selected_harvest_label } = req.body;
        console.log('Extracted values:', { buyer_id, field_id, quantity, total_price, status, selected_harvest_date, selected_harvest_label });
        
        // Now using field_id directly since we dropped the products table
        const newOrder = await pool.query(
            'INSERT INTO orders (buyer_id, field_id, quantity, total_price, status, selected_harvest_date, selected_harvest_label) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [buyer_id, field_id, quantity, total_price, status, selected_harvest_date, selected_harvest_label]
        );
        console.log('Order created successfully:', newOrder.rows[0]);
        
        // Create notifications for both buyer and farmer
        // Get field information for notifications
        const fieldResult = await pool.query(
            'SELECT name as field_name, owner_id as farmer_id FROM fields WHERE id = $1',
            [field_id]
        );
        
        if (fieldResult.rows.length > 0) {
            const { field_name, farmer_id } = fieldResult.rows[0];
            
            // Notification for buyer
            await pool.query(
                'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [buyer_id, `Order placed successfully for ${field_name}`, 'success']
            );
            
            // Notification for farmer
            await pool.query(
                'INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)',
                [farmer_id, `New order received for ${field_name}`, 'info']
            );
        }
        
        res.json(newOrder.rows[0]);
    } catch (err) {
        console.error('Error creating order:', err.message);
        console.error('Full error:', err);
        res.status(500).send('Server Error');
    }
});

// Update an order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { buyer_id, field_id, quantity, total_price, status } = req.body;
        const result = await pool.query(
            'UPDATE orders SET buyer_id = $1, field_id = $2, quantity = $3, total_price = $4, status = $5 WHERE id = $6 RETURNING *',
            [buyer_id, field_id, quantity, total_price, status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get orders for a specific buyer with field details
router.get('/buyer/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        const buyerOrders = await pool.query(`
            SELECT 
                o.id,
                o.quantity,
                o.total_price,
                o.status,
                o.created_at,
                o.selected_harvest_date,
                o.selected_harvest_label,
                f.id as field_id,
                f.name as field_name,
                f.location,
                f.category as crop_type,
                f.available_area,
                f.total_area,
                f.price_per_m2,
                f.image as image_url,
                f.owner_id as farmer_id,
                u.name as farmer_name,
                u.email as farmer_email
            FROM orders o
            JOIN fields f ON o.field_id = f.id
            LEFT JOIN users u ON f.owner_id = u.id
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
        `, [buyerId]);
        
        res.json(buyerOrders.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete an order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOrder = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
        if (deleteOrder.rows.length === 0) {
            return res.status(404).json('Order not found');
        }
        res.json('Order deleted');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;