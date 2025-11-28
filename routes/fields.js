const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all fields
router.get('/', async (req, res) => {
    try {
        const { owner_id } = req.query;
        let query = "SELECT * FROM fields";
        let values = [];

        if (owner_id) {
            query += " WHERE owner_id = $1";
            values.push(owner_id);
        }

        const allFields = await pool.query(query, values);
        res.json(allFields.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get a single field by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const field = await pool.query("SELECT * FROM fields WHERE id = $1", [id]);
        if (field.rows.length === 0) {
            return res.status(404).json({ msg: 'Field not found' });
        }
        res.json(field.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new field
router.post('/', async (req, res) => {
  try {
    console.log('Creating field with data:', req.body);
    
    // Extract all fields that can be stored in the unified fields table
    const {
      name,
      description,
      coordinates,
      location,
      image,
      farm_id,
      owner_id,
      field_size,
      field_size_unit,
      area_m2,
      available_area,
      total_area,
      weather,
      has_webcam,
      is_own_field = true,
      category,
      subcategory,
      price,
      price_per_m2,
      unit,
      quantity,
      farmer_name,
      available = true,
      rating = 0.0,
      reviews = 0,
      production_rate,
      production_rate_unit,
      harvest_dates,
      shipping_option,
      delivery_charges
    } = req.body;

    // Stringify JSON fields if they exist
    const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;
    const harvestDatesJson = harvest_dates ? JSON.stringify(harvest_dates) : null;

    // Convert numeric fields to proper types
    const numericFieldSize = field_size ? parseFloat(field_size) : null;
    const numericAreaM2 = area_m2 ? parseFloat(area_m2) : null;
    const numericAvailableArea = available_area ? parseFloat(available_area) : null;
    const numericTotalArea = total_area ? parseFloat(total_area) : null;
    const numericPrice = price ? parseFloat(price) : null;
    const numericPricePerM2 = price_per_m2 ? parseFloat(price_per_m2) : null;
    const numericQuantity = quantity ? parseFloat(quantity) : null;
    const numericRating = rating ? parseFloat(rating) : 0.0;
    const numericProductionRate = production_rate ? parseFloat(production_rate) : null;
    const numericDeliveryCharges = delivery_charges ? parseFloat(delivery_charges) : null;

    const result = await pool.query(
      `INSERT INTO fields (
        name, description, coordinates, location, image, farm_id, owner_id, 
        field_size, field_size_unit, area_m2, available_area, total_area, 
        weather, has_webcam, is_own_field, category, subcategory, price, price_per_m2, 
        unit, quantity, farmer_name, available, rating, reviews, 
        production_rate, production_rate_unit, harvest_dates, shipping_option, delivery_charges
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) 
       RETURNING *`,
      [
        name, description, coordinatesJson, location, image, farm_id, owner_id,
        numericFieldSize, field_size_unit, numericAreaM2, numericAvailableArea, numericTotalArea,
        weather, has_webcam, is_own_field, category, subcategory, numericPrice, numericPricePerM2,
        unit, numericQuantity, farmer_name, available, numericRating, reviews,
        numericProductionRate, production_rate_unit, harvestDatesJson, shipping_option, numericDeliveryCharges
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating field:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create field', details: error.message });
  }
});

// Update a field
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      coordinates,
      location,
      image,
      farm_id,
      field_size,
      field_size_unit,
      area_m2,
      available_area,
      total_area,
      weather,
      has_webcam,
      is_own_field,
      category,
      subcategory,
      price,
      price_per_m2,
      unit,
      quantity,
      farmer_name,
      available,
      rating,
      reviews,
      production_rate,
      production_rate_unit,
      harvest_dates,
      shipping_option,
      delivery_charges,
      owner_id
    } = req.body;

    // Stringify JSON fields if they exist
    const coordinatesJson = coordinates ? JSON.stringify(coordinates) : null;
    const harvestDatesJson = harvest_dates ? JSON.stringify(harvest_dates) : null;

    const result = await pool.query(
      `UPDATE fields 
       SET name = $1, description = $2, coordinates = $3, location = $4, image = $5, 
           farm_id = $6, field_size = $7, field_size_unit = $8, area_m2 = $9, 
           available_area = $10, total_area = $11, weather = $12, has_webcam = $13, is_own_field = $14,
           category = $15, subcategory = $16, price = $17, price_per_m2 = $18, unit = $19, quantity = $20,
           farmer_name = $21, available = $22, rating = $23, reviews = $24,
           production_rate = $25, production_rate_unit = $26, harvest_dates = $27,
           shipping_option = $28, delivery_charges = $29, owner_id = $30
       WHERE id = $31 
       RETURNING *`,
      [
        name, description, coordinatesJson, location, image, farm_id, field_size, field_size_unit, 
        area_m2, available_area, total_area, weather, has_webcam, is_own_field,
        category, subcategory, price, price_per_m2, unit, quantity, farmer_name, available, rating, reviews,
        production_rate, production_rate_unit, harvestDatesJson, shipping_option, delivery_charges, owner_id, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating field:', error);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

// Delete a field
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteField = await pool.query("DELETE FROM fields WHERE id = $1 RETURNING *", [id]);
        if (deleteField.rows.length === 0) {
            return res.status(404).json({ msg: 'Field not found' });
        }
        res.json({ msg: 'Field deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;