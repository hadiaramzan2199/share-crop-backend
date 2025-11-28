-- Rename the existing fields table to a temporary name
ALTER TABLE fields RENAME TO fields_old;

-- Create the new fields table
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coordinates JSONB,
    location TEXT,
    image TEXT,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_own_field BOOLEAN DEFAULT TRUE,
    field_size NUMERIC(10, 2),
    field_size_unit TEXT,
    area_m2 NUMERIC(10, 2),
    available_area NUMERIC(10, 2),
    total_area NUMERIC(10, 2),
    weather TEXT,
    has_webcam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the new products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT, -- Added image_url column
    category TEXT,
    price NUMERIC(10, 2) NOT NULL,
    price_per_m2 NUMERIC(10, 2),
    unit TEXT,
    quantity NUMERIC(10, 2),
    coordinates JSONB, -- Added coordinates column
    available BOOLEAN DEFAULT TRUE,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews INTEGER DEFAULT 0,
    production_rate NUMERIC(10, 2),
    production_rate_unit TEXT,
    harvest_dates JSONB,
    shipping_option TEXT,
    shipping_pickup BOOLEAN DEFAULT FALSE,
    shipping_delivery BOOLEAN DEFAULT FALSE,
    delivery_charges NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate data from fields_old to new fields and products tables
INSERT INTO fields (id, name, description, coordinates, location, image, farm_id, owner_id, is_own_field, field_size, field_size_unit, area_m2, available_area, total_area, weather, has_webcam, created_at)
SELECT id, name, description, coordinates, location, image, farm_id, '3ee12330-1e09-479a-9c8e-9507b477a10f', is_own_field, field_size, field_size_unit, area_m2, available_area, total_area, weather, has_webcam, created_at
FROM fields_old;

INSERT INTO products (id, field_id, name, description, image_url, category, price, price_per_m2, unit, quantity, available, rating, reviews, production_rate, production_rate_unit, harvest_dates, shipping_option, shipping_pickup, shipping_delivery, delivery_charges, created_at)
SELECT id, id, name, description, image, category, price, price_per_m2, unit, quantity, available, rating, reviews, production_rate, production_rate_unit, harvest_dates, shipping_option, shipping_pickup, shipping_delivery, delivery_charges, created_at
FROM fields_old;

-- Drop foreign key constraints before dropping the old fields table
ALTER TABLE orders DROP CONSTRAINT orders_field_id_fkey;
ALTER TABLE rented_fields DROP CONSTRAINT rented_fields_field_id_fkey;

-- Drop the old fields table
DROP TABLE fields_old;

-- Update the orders table to reference products.id
ALTER TABLE orders RENAME COLUMN field_id TO product_id;
ALTER TABLE orders ADD CONSTRAINT orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Update the rented_fields table to reference fields.id
ALTER TABLE rented_fields ADD CONSTRAINT rented_fields_field_id_fkey FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE;