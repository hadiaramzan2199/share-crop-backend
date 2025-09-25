const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all rented fields
router.get('/', async (req, res) => {
    try {
        const allRentedFields = await pool.query('SELECT * FROM rented_fields');
        res.json(allRentedFields.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single rented field by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rentedField = await pool.query('SELECT * FROM rented_fields WHERE id = $1', [id]);
        if (rentedField.rows.length === 0) {
            return res.status(404).json('Rented field not found');
        }
        res.json(rentedField.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new rented field
router.post('/', async (req, res) => {
    try {
        const { renter_id, field_id, start_date, end_date, price } = req.body;
        const newRentedField = await pool.query(
            'INSERT INTO rented_fields (renter_id, field_id, start_date, end_date, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [renter_id, field_id, start_date, end_date, price]
        );
        res.json(newRentedField.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update a rented field
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { renter_id, field_id, start_date, end_date, price } = req.body;
        const updateRentedField = await pool.query(
            'UPDATE rented_fields SET renter_id = $1, field_id = $2, start_date = $3, end_date = $4, price = $5 WHERE id = $6 RETURNING *',
            [renter_id, field_id, start_date, end_date, price, id]
        );
        if (updateRentedField.rows.length === 0) {
            return res.status(404).json('Rented field not found');
        }
        res.json(updateRentedField.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a rented field
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteRentedField = await pool.query('DELETE FROM rented_fields WHERE id = $1 RETURNING *', [id]);
        if (deleteRentedField.rows.length === 0) {
            return res.status(404).json('Rented field not found');
        }
        res.json('Rented field deleted');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;