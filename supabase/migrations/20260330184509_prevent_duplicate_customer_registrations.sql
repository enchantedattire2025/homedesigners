/*
  # Prevent Duplicate Customer Registrations

  1. Changes
    - Add unique constraint on customers.user_id to prevent duplicate registrations
    - Add NOT NULL constraint on project_name to prevent empty projects
    - Delete existing duplicate/empty customer records (keep only the most recent valid one per user)
    
  2. Security
    - Ensures data integrity by preventing duplicate customer records
    - Prevents empty projects from being created
    
  3. Important Notes
    - Cleans up existing empty/duplicate customer records
    - Keeps the most recent valid customer record for each user
*/

-- First, identify and delete empty customer records (where project_name is NULL or empty)
DELETE FROM customers
WHERE project_name IS NULL OR project_name = '';

-- For users with multiple valid customer records, keep only the most recent one
WITH ranked_customers AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM customers
  WHERE user_id IS NOT NULL
)
DELETE FROM customers
WHERE id IN (
  SELECT id FROM ranked_customers WHERE rn > 1
);

-- Add NOT NULL constraint to project_name if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers'
      AND column_name = 'project_name'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE customers
    ALTER COLUMN project_name SET NOT NULL;
  END IF;
END $$;

-- Add unique constraint on user_id to prevent duplicate registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_user_id_unique'
  ) THEN
    ALTER TABLE customers
    ADD CONSTRAINT customers_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Create index on user_id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_customers_user_id_unique ON customers(user_id);
