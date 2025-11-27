-- Add admin_viewed_at column to orders table to track when admin has viewed an order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_viewed_at TIMESTAMP;

-- Create index for faster queries on unread orders
CREATE INDEX IF NOT EXISTS idx_orders_admin_viewed_at ON orders(admin_viewed_at);

