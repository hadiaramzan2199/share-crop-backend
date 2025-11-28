-- Add dummy orders for farmer user (acting as buyer)
-- First, we need to get the farmer user ID from the users table
-- Since the farmer user is created dynamically, we'll use a known email

-- Insert orders for farmer user (farmer@example.com)
-- We'll assume the farmer user has ID that we can reference

INSERT INTO orders (id, buyer_id, field_id, quantity, total_price, status, created_at, selected_harvest_date, selected_harvest_label)
VALUES 
    -- Order 1: Farmer bought some apple field
    ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 
     (SELECT id FROM users WHERE email = 'farmer@example.com' LIMIT 1), 
     '86151898-2c08-4808-94bb-44aff8f6c4c6', 
     25, 
     62.50, 
     'completed', 
     NOW() - INTERVAL '2 months',
     '2025-01-15',
     'Mid January 2025'),
     
    -- Order 2: Farmer bought some strawberry field
    ('f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 
     (SELECT id FROM users WHERE email = 'farmer@example.com' LIMIT 1), 
     '1548a089-2585-4c60-bd8e-1824507e6525', 
     10, 
     40.00, 
     'pending', 
     NOW() - INTERVAL '1 month',
     '2025-02-01',
     'Early February 2025');