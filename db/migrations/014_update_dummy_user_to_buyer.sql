-- Update Dummy User's user_type from farmer to buyer
UPDATE users 
SET user_type = 'buyer' 
WHERE email = 'dummy@example.com' AND name = 'Dummy User';