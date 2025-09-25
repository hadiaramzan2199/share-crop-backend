-- Drop the products table since fields and products are the same
DROP TABLE IF EXISTS products CASCADE;

-- Update orders table to use field_id instead of product_id
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_id_fkey;
ALTER TABLE orders DROP COLUMN IF EXISTS product_id;
ALTER TABLE orders ADD COLUMN field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE;

-- Add some sample data to fields table if it doesn't exist
INSERT INTO fields (id, name, description, coordinates, location, owner_id, field_size, field_size_unit, area_m2, available_area, total_area, weather, has_webcam)
VALUES 
    ('9b105480-b18d-41e5-9beb-963846f904ff', 'Watery Watermelon', 'Fresh watermelons ready for harvest', '{"lat": 34.052235, "lng": -118.243683}', 'Los Angeles', '3ee12330-1e09-479a-9c8e-9507b477a10f', 5.0, 'acres', 20234.0, 18000.0, 20234.0, 'Sunny', true),
    ('a1105480-b18d-41e5-9beb-963846f904aa', 'Yummy Strawberry', 'Sweet organic strawberries', '{"lat": 34.062235, "lng": -118.253683}', 'Los Angeles', '3ee12330-1e09-479a-9c8e-9507b477a10f', 3.0, 'acres', 12140.0, 11000.0, 12140.0, 'Sunny', false),
    ('b2205480-b18d-41e5-9beb-963846f904bb', 'Juicy Peach', 'Ripe peaches from our orchard', '{"lat": 34.072235, "lng": -118.263683}', 'Los Angeles', '3ee12330-1e09-479a-9c8e-9507b477a10f', 4.0, 'acres', 16187.0, 15000.0, 16187.0, 'Sunny', true)
ON CONFLICT (id) DO NOTHING;