-- Migration to unify fields and products into a single fields table
-- This migration adds all necessary columns to the fields table to handle both field and product data

-- Add missing columns to the fields table
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS price_per_m2 NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS farmer_name TEXT,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS production_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS production_rate_unit TEXT,
ADD COLUMN IF NOT EXISTS harvest_dates JSONB,
ADD COLUMN IF NOT EXISTS shipping_option TEXT,
ADD COLUMN IF NOT EXISTS delivery_charges NUMERIC(10, 2);

-- Update existing records to have default values for new columns
UPDATE fields 
SET 
    available = TRUE,
    rating = 0.0,
    reviews = 0,
    farmer_name = 'Demo Farmer'
WHERE available IS NULL OR rating IS NULL OR reviews IS NULL OR farmer_name IS NULL;

-- Create index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_fields_category ON fields(category);
CREATE INDEX IF NOT EXISTS idx_fields_available ON fields(available);
CREATE INDEX IF NOT EXISTS idx_fields_price ON fields(price);

-- Add comments to document the unified table structure
COMMENT ON TABLE fields IS 'Unified table containing both field and product information';
COMMENT ON COLUMN fields.category IS 'Product category (e.g., vegetables, fruits, grains)';
COMMENT ON COLUMN fields.price IS 'Price of the product/field';
COMMENT ON COLUMN fields.price_per_m2 IS 'Price per square meter';
COMMENT ON COLUMN fields.unit IS 'Unit of measurement for the product';
COMMENT ON COLUMN fields.quantity IS 'Available quantity of the product';
COMMENT ON COLUMN fields.farmer_name IS 'Name of the farmer owning this field';
COMMENT ON COLUMN fields.available IS 'Whether the field/product is available for purchase';
COMMENT ON COLUMN fields.rating IS 'Average rating of the field/product';
COMMENT ON COLUMN fields.reviews IS 'Number of reviews for the field/product';
COMMENT ON COLUMN fields.production_rate IS 'Production rate of the field';
COMMENT ON COLUMN fields.production_rate_unit IS 'Unit for production rate';
COMMENT ON COLUMN fields.harvest_dates IS 'JSON array of harvest dates';
COMMENT ON COLUMN fields.shipping_option IS 'Available shipping options';
COMMENT ON COLUMN fields.delivery_charges IS 'Delivery charges for the product';