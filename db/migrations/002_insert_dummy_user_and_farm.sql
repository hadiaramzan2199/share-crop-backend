INSERT INTO users (id, email, password, user_type, name, created_at)
VALUES
    ('3ee12330-1e09-479a-9c8e-9507b477a10f', 'dummy@example.com', 'hashedpassword', 'farmer', 'Dummy User', NOW());

INSERT INTO farms (id, farm_name, description, location, owner_id, created_at)
VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Dummy Farm', 'A farm for testing purposes.', 'Dummyville', '3ee12330-1e09-479a-9c8e-9507b477a10f', NOW());