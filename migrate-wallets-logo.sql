-- Migration script to add logo_url column to wallets table
-- Run this SQL directly in your database if the column doesn't exist

-- Add logo_url column if it doesn't exist
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND column_name = 'logo_url';

