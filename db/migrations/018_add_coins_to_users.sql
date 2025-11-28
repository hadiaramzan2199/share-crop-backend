-- Add coins column to users table
ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 12500;

-- Update existing users to have default coins
UPDATE users SET coins = 12500 WHERE coins IS NULL;