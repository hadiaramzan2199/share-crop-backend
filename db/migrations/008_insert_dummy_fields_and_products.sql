INSERT INTO fields (id, name, description, coordinates, location, image, farm_id, owner_id, is_own_field, field_size, field_size_unit, area_m2, available_area, total_area, weather, has_webcam)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Orchard Field', 'A field dedicated to growing organic apples.', '{"lat": 34.052235, "lng": -118.243683}', 'Los Angeles', 'https://example.com/orchard_field.jpg', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '3ee12330-1e09-479a-9c8e-9507b477a10f', TRUE, 10.5, 'acres', 42491.4, 40000.0, 42491.4, 'Sunny', TRUE);

INSERT INTO products (id, field_id, name, description, image_url, category, price, quantity, unit, coordinates)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Organic Apples', 'Fresh organic apples from our farm.', 'https://example.com/apples.jpg', 'Fruit', 2.50, 100, 'kg', '{"lat": 34.052235, "lng": -118.243683}'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Farm Fresh Eggs', 'Locally sourced cage-free eggs.', 'https://example.com/eggs.jpg', 'Dairy & Eggs', 4.00, 50, 'dozen', '{"lat": 34.052235, "lng": -118.243683}');