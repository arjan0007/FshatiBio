-- Migration: Add FCM token column to users table
-- Date: 2024

-- Add fcm_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'fcm_token'
    ) THEN
        ALTER TABLE users ADD COLUMN fcm_token TEXT;
        RAISE NOTICE 'Column fcm_token added to users table';
    ELSE
        RAISE NOTICE 'Column fcm_token already exists in users table';
    END IF;
END $$;

