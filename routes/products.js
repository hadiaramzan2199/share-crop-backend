const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all products
router.get('/', async (req, res) => {
    try {
        const allProducts = await pool.query("SELECT id, field_id, name, description, category, price, price_per_m2, unit, quantity, image_url as image, available, rating, reviews, production_rate, production_rate_unit, CASE WHEN coordinates IS NULL THEN NULL ELSE coordinates END as coordinates FROM products");
        res.json(allProducts.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await pool.query("SELECT id, field_id, name, description, category, price, price_per_m2, unit, quantity, image_url as image, available, rating, reviews, production_rate, production_rate_unit, CASE WHEN coordinates IS NULL THEN NULL ELSE coordinates END as coordinates FROM products WHERE id = $1", [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(product.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new product
router.post('/', async (req, res) => {
    try {
        const { field_id, name, description, category, price, price_per_m2, unit, quantity, image, available, rating, reviews, production_rate, production_rate_unit, coordinates } = req.body;
        const newProduct = await pool.query(
            "INSERT INTO products (field_id, name, description, category, price, price_per_m2, unit, quantity, image_url, available, rating, reviews, production_rate, production_rate_unit, coordinates) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *",
            [field_id, name, description, category, price, price_per_m2, unit, quantity, image, available, rating, reviews, production_rate, production_rate_unit, coordinates]
        );
        res.json(newProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { field_id, name, description, category, price, price_per_m2, unit, quantity, image, available, rating, reviews, production_rate, production_rate_unit, coordinates } = req.body;
        const updateProduct = await pool.query(
            "UPDATE products SET field_id = $1, name = $2, description = $3, category = $4, price = $5, price_per_m2 = $6, unit = $7, quantity = $8, image_url = $9, available = $10, rating = $11, reviews = $12, production_rate = $13, production_rate_unit = $14, coordinates = $15 WHERE id = $16 RETURNING *",
            [field_id, name, description, category, price, price_per_m2, unit, quantity, image, available, rating, reviews, production_rate, production_rate_unit, coordinates, id]
        );
        if (updateProduct.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json(updateProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteProduct = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
        if (deleteProduct.rows.length === 0) {
            return res.status(404).json({ msg: 'Product not found' });
        }
        res.json({ msg: 'Product deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;