-- Migration to add subcategory column to fields table
-- This allows storing the specific subcategory (e.g., 'Green Apple') separate from the main category (e.g., 'Fruits')

-- Add subcategory column to the fields table
ALTER TABLE fields 
ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Create index on subcategory for better query performance
CREATE INDEX IF NOT EXISTS idx_fields_subcategory ON fields(subcategory);

-- Add comment to document the subcategory column
COMMENT ON COLUMN fields.subcategory IS 'Product subcategory (e.g., Green Apple, Red Apple for Fruits category)';