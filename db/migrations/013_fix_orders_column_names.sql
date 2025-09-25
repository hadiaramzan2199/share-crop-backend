-- Fix orders table column names to match the referenced tables
-- The users table has 'id' column, so buyer_id should reference users(id)
-- The fields table has 'id' column, so field_id should reference fields(id)

-- The foreign key constraints should already be correct, but let's ensure the column names are clear
-- Actually, let's check what the current orders table looks like first

-- For now, let's just ensure the foreign key constraints are properly set up
-- If buyer_id doesn't exist, we need to add it
-- If field_id doesn't exist, we need to add it

-- Check if buyer_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyer_id') THEN
        ALTER TABLE orders ADD COLUMN buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Check if field_id column exists, if not add it  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'field_id') THEN
        ALTER TABLE orders ADD COLUMN field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE;
    END IF;
END $$;