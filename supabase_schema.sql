-- Rent360 Supabase PostgreSQL Schema (Part 1)

-- 1. Stores (Tenants)
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    gst_number VARCHAR(50),
    logo_url TEXT,
    upi_id VARCHAR(100),
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_roles_store_id ON roles(store_id);

-- 3. Users (Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_users_store_id ON users(store_id);

-- 4. Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_code VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_categories_store_id ON categories(store_id);

-- 5. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_code VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    base_rent_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    base_security_deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_urls JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_products_store_id ON products(store_id);

-- 6. Product_Items (SKU)
CREATE TABLE product_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku_code VARCHAR(100) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_product_items_store_id ON product_items(store_id);
CREATE INDEX idx_product_items_sku ON product_items(sku_code);

-- 7. Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    alternate_mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    reference_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_customers_store_id ON customers(store_id);
CREATE INDEX idx_customers_mobile ON customers(mobile);

-- 8. Offers & Discounts
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    offer_code VARCHAR(50) NOT NULL,
    offer_name VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL, -- PERCENTAGE or FLAT_AMOUNT
    discount_value DECIMAL(10,2) NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_offers_store_id ON offers(store_id);

-- 9. Time_Slots
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_time_slots_store_id ON time_slots(store_id);

-- 10. Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    booking_no VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    event_date DATE,
    time_slot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL,
    pickup_date TIMESTAMP WITH TIME ZONE,
    return_date TIMESTAMP WITH TIME ZONE,
    total_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_security DECIMAL(10,2) NOT NULL DEFAULT 0,
    offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    internal_notes TEXT,
    status VARCHAR(50) DEFAULT 'UPCOMING',
    salesman_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_bookings_store_id ON bookings(store_id);
CREATE INDEX idx_bookings_booking_no ON bookings(booking_no);

-- 11. Booking_Items
CREATE TABLE booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    product_item_id UUID NOT NULL REFERENCES product_items(id) ON DELETE RESTRICT,
    rent_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    security_deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    tailor_measurements JSONB DEFAULT '{}',
    tailor_status VARCHAR(50) DEFAULT 'PENDING',
    bundled_accessories JSONB DEFAULT '[]',
    item_status VARCHAR(50) DEFAULT 'PICKED_UP'
);
CREATE INDEX idx_booking_items_booking_id ON booking_items(booking_id);
