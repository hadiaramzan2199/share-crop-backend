const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all farms, optionally filtered by owner_id
router.get('/', async (req, res) => {
    try {
        const { owner_id } = req.query;
        console.log('Farms API called with owner_id:', owner_id);
        let query = "SELECT * FROM farms";
        let values = [];

        if (owner_id) {
            query += " WHERE owner_id = $1";
            values.push(owner_id);
        }

        console.log('Executing query:', query, 'with values:', values);
        const allFarms = await pool.query(query, values);
        console.log('Found farms:', allFarms.rows.length);
        console.log('Farms data:', allFarms.rows);
        res.json(allFarms.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single farm by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const farm = await pool.query("SELECT * FROM farms WHERE id = $1", [id]);
        if (farm.rows.length === 0) {
            return res.status(404).json({ msg: 'Farm not found' });
        }
        res.json(farm.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new farm
router.post('/', async (req, res) => {
    try {
        const { name, location, owner_id, farmIcon, coordinates, webcamUrl, description } = req.body;
        
        // Debug logging
        console.log('Farm creation request body:', req.body);
        console.log('Extracted farmIcon value:', farmIcon);
        console.log('farmIcon type:', typeof farmIcon);
        console.log('Coordinates received:', coordinates);
        
        // Properly stringify coordinates for JSONB storage
        const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;
        
        const newFarm = await pool.query(
            "INSERT INTO farms (farm_name, location, owner_id, farm_icon, coordinates, webcam_url, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, location, owner_id, farmIcon, coordinatesJson, webcamUrl, description]
        );
        
        console.log('Created farm:', newFarm.rows[0]);
        res.json(newFarm.rows[0]);
    } catch (err) {
        console.error('Error creating farm:', err.message);
        console.error('Error details:', err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// Update a farm
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, owner_id, farmIcon, coordinates, webcamUrl, description } = req.body;
        
        // Properly stringify coordinates for JSONB storage
        const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;
        
        const updateFarm = await pool.query(
            "UPDATE farms SET farm_name = $1, location = $2, owner_id = $3, farm_icon = $4, coordinates = $5, webcam_url = $6, description = $7 WHERE id = $8 RETURNING *",
            [name, location, owner_id, farmIcon, coordinatesJson, webcamUrl, description, id]
        );
        if (updateFarm.rows.length === 0) {
            return res.status(404).json({ msg: 'Farm not found' });
        }
        res.json(updateFarm.rows[0]);
    } catch (err) {
        console.error('Error updating farm:', err.message);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// Delete a farm
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteFarm = await pool.query("DELETE FROM farms WHERE id = $1 RETURNING *", [id]);
        if (deleteFarm.rows.length === 0) {
            return res.status(404).json({ msg: 'Farm not found' });
        }
        res.json({ msg: 'Farm deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;