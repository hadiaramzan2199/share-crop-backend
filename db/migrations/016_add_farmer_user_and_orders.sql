-- Add a farmer user for testing
INSERT INTO users (id, email, password, user_type, name, created_at)
VALUES
    ('f1e12330-1e09-479a-9c8e-9507b477a10f', 'farmer@example.com', 'hashedpassword', 'farmer', 'John Farmer', NOW());

-- Add some orders for the farmer (when acting as a buyer)
-- These orders represent fields that the farmer has purchased/rented from other farmers
INSERT INTO orders (id, buyer_id, field_id, quantity, total_price, status, created_at, selected_harvest_date, selected_harvest_label)
VALUES
    ('order-farmer-1', 'f1e12330-1e09-479a-9c8e-9507b477a10f', 1, 50, 1250.00, 'active', NOW() - INTERVAL '15 days', '2025-04-15', '15 Apr, 2025'),
    ('order-farmer-2', 'f1e12330-1e09-479a-9c8e-9507b477a10f', 2, 75, 2250.00, 'active', NOW() - INTERVAL '10 days', '2025-05-20', '20 May, 2025'),
    ('order-farmer-3', 'f1e12330-1e09-479a-9c8e-9507b477a10f', 3, 30, 900.00, 'pending', NOW() - INTERVAL '5 days', '2025-03-10', '10 Mar, 2025');

-- Add some orders for the buyer user (existing dummy user)
-- These orders represent fields that the buyer has purchased/rented
INSERT INTO orders (id, buyer_id, field_id, quantity, total_price, status, created_at, selected_harvest_date, selected_harvest_label)
VALUES
    ('order-buyer-1', '3ee12330-1e09-479a-9c8e-9507b477a10f', 4, 40, 1200.00, 'active', NOW() - INTERVAL '20 days', '2025-06-15', '15 Jun, 2025'),
    ('order-buyer-2', '3ee12330-1e09-479a-9c8e-9507b477a10f', 5, 60, 1800.00, 'active', NOW() - INTERVAL '12 days', '2025-07-20', '20 Jul, 2025');

-- Comments for documentation
-- This migration creates:
-- 1. A farmer user who can also act as a buyer
-- 2. Orders for the farmer (fields they purchased when acting as buyer)
-- 3. Orders for the buyer (fields they purchased)
-- This ensures proper separation of rented fields between user roles