-- Migration script to add role column to users table
-- Run this SQL in your PostgreSQL database

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
        RAISE NOTICE 'Column role added to users table';
    ELSE
        RAISE NOTICE 'Column role already exists';
    END IF;
END $$;

-- Update existing users to have 'user' role if NULL
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create an admin user for testing (change credentials as needed)
INSERT INTO users (phone, password, name, email, role) 
VALUES ('0123456789', '123456', 'Admin User', 'admin@example.com', 'admin')
ON CONFLICT (phone) 
DO UPDATE SET role = 'admin';

SELECT 'Migration completed successfully!' AS status;
