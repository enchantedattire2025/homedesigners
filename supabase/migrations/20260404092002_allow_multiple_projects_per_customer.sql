/*
  # Allow Multiple Projects Per Customer

  1. Changes
    - Remove unique constraint on customers.user_id to allow multiple projects per customer
    - Each customer can now register multiple projects
    
  2. Security
    - Maintains data integrity while allowing flexibility
    - Customers can still be identified by their user_id but can have multiple project entries
    
  3. Important Notes
    - This allows customers to create and manage multiple interior design projects
    - Each project record in the customers table represents a separate project
*/

-- Remove the unique constraint on user_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customers_user_id_unique'
  ) THEN
    ALTER TABLE customers
    DROP CONSTRAINT customers_user_id_unique;
  END IF;
END $$;

-- The non-unique index idx_customers_user_id_unique can remain for query performance
-- but we'll recreate it without the unique constraint
DROP INDEX IF EXISTS idx_customers_user_id_unique;
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);