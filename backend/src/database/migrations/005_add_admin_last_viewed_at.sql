-- Add admin_last_viewed_at column to chat_conversations table
ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS admin_last_viewed_at TIMESTAMP;


