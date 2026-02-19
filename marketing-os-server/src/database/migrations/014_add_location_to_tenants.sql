-- Add location column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS location VARCHAR(255);
