-- Table for Users
CREATE TABLE users ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('farmer', 'buyer')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Farms
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_name TEXT NOT NULL,
    farm_icon TEXT,
    location TEXT,
    coordinates JSONB, -- Store as JSONB for flexibility (e.g., { "lat": 47.3769, "lng": 8.5417 })
    webcam_url TEXT,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Fields (Products)
CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC(10, 2) NOT NULL,
    price_per_m2 NUMERIC(10, 2),
    unit TEXT,
    quantity NUMERIC(10, 2),
    coordinates JSONB, -- Store as JSONB for flexibility
    location TEXT,
    image TEXT,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL, -- A field can exist without a farm, or be deleted if farm is deleted
    is_own_field BOOLEAN DEFAULT TRUE,
    available BOOLEAN DEFAULT TRUE,
    rating NUMERIC(2, 1) DEFAULT 0.0,
    reviews INTEGER DEFAULT 0,
    field_size NUMERIC(10, 2),
    field_size_unit TEXT,
    production_rate NUMERIC(10, 2),
    production_rate_unit TEXT,
    harvest_dates JSONB, -- Store as JSONB for flexibility (e.g., [{ "date": "2023-10-26", "yield": 100 }])
    shipping_option TEXT,
    shipping_pickup BOOLEAN DEFAULT FALSE,
    shipping_delivery BOOLEAN DEFAULT FALSE,
    delivery_charges NUMERIC(10, 2),
    has_webcam BOOLEAN DEFAULT FALSE,
    area_m2 NUMERIC(10, 2),
    available_area NUMERIC(10, 2),
    total_area NUMERIC(10, 2),
    weather TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'active')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for Rented Fields (if different from Orders, otherwise can be combined)
-- Assuming 'rented fields' are distinct from 'orders' for now, perhaps for long-term leases.
CREATE TABLE rented_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    rented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- Table for Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT, -- e.g., 'info', 'warning', 'error', 'success'
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);