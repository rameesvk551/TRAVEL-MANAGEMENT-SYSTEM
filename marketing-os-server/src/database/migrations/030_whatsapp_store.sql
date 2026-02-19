-- WhatsApp Store Automation (Starter Mode)
-- Products, Orders, and Store Settings for small business storefront

-- Store Products
CREATE TABLE IF NOT EXISTS store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    image_url TEXT,
    category VARCHAR(100),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_prod_tenant ON store_products(tenant_id);
CREATE INDEX idx_store_prod_category ON store_products(tenant_id, category);
CREATE INDEX idx_store_prod_enabled ON store_products(tenant_id, is_enabled) WHERE is_enabled = TRUE;

-- Store Orders
CREATE TABLE IF NOT EXISTS store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    delivery_address TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    payment_link TEXT,
    notes TEXT,
    conversation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_ord_tenant ON store_orders(tenant_id);
CREATE INDEX idx_store_ord_status ON store_orders(tenant_id, status);
CREATE INDEX idx_store_ord_phone ON store_orders(customer_phone);
CREATE INDEX idx_store_ord_payment ON store_orders(tenant_id, payment_status);

-- Store Settings (one per tenant)
CREATE TABLE IF NOT EXISTS store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    welcome_message TEXT DEFAULT 'Welcome to our store! 🛍️ Type "catalog" to browse our products or "status" to check your order.',
    payment_link_template TEXT DEFAULT '',
    checkout_reminder_minutes INTEGER NOT NULL DEFAULT 15,
    payment_reminder_minutes INTEGER NOT NULL DEFAULT 30,
    auto_keywords JSONB NOT NULL DEFAULT '{"catalog": ["hi", "hello", "catalog", "menu", "products", "shop"], "status": ["status", "my order", "order status", "track"]}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
