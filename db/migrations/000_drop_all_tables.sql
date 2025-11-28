-- Drop all tables in the correct order to respect foreign key constraints
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS rented_fields CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS fields CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS users CASCADE;