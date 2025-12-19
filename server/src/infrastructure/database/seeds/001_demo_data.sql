-- Seed data for development

-- Default tenant
INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Demo Travel Company',
    'demo',
    '{"timezone": "Asia/Kolkata", "currency": "INR"}'
) ON CONFLICT (slug) DO NOTHING;

-- Demo admin user (password: admin123)
INSERT INTO users (id, tenant_id, email, password_hash, name, role)
VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@demo.com',
    '$2a$10$rQzKqH8JHcq3zF7cU.VKXeQxQ9Yw5G5Rl5HcQ3zF7cU.VKXeQxQ9',
    'Demo Admin',
    'owner'
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- Sample resources
INSERT INTO resources (tenant_id, type, name, description, capacity, base_price)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ROOM', 'Deluxe Room 101', 'Mountain view deluxe room', 2, 5000),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ROOM', 'Suite 201', 'Luxury suite with balcony', 4, 12000),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TOUR', 'City Heritage Walk', '3-hour guided heritage tour', 15, 1500),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TREK', 'Sunrise Peak Trek', '2-day moderate trek', 10, 8000),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'VEHICLE', 'Toyota Innova', '7-seater SUV for transfers', 7, 3000)
ON CONFLICT DO NOTHING;
