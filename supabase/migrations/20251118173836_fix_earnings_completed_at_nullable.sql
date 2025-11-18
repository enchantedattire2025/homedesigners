/*
  # Fix Earnings Table and Populate Data

  1. Changes
    - Make completed_at and paid_at nullable for pending projects
    - Add unique constraint on project_id
    - Create functions to calculate and populate earnings
    - Add trigger for automatic earnings updates
    - Populate existing project earnings
  
  2. Security
    - Maintains existing RLS policies
*/

-- Make completed_at and paid_at nullable
ALTER TABLE designer_projects_earnings 
  ALTER COLUMN completed_at DROP NOT NULL;

ALTER TABLE designer_projects_earnings 
  ALTER COLUMN paid_at DROP NOT NULL;

-- Add unique constraint on project_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'designer_projects_earnings_project_id_key'
  ) THEN
    ALTER TABLE designer_projects_earnings 
    ADD CONSTRAINT designer_projects_earnings_project_id_key UNIQUE (project_id);
  END IF;
END $$;

-- Function to calculate earnings based on budget range
CREATE OR REPLACE FUNCTION calculate_project_value(budget_range text)
RETURNS numeric AS $$
BEGIN
  RETURN CASE 
    WHEN budget_range LIKE '%5-10%' THEN 750000
    WHEN budget_range LIKE '%10-20%' THEN 1500000
    WHEN budget_range LIKE '%20-30%' THEN 2500000
    WHEN budget_range LIKE '%30-50%' THEN 4000000
    WHEN budget_range LIKE '%50%' OR budget_range LIKE '%Above%' THEN 6000000
    WHEN budget_range LIKE '%3-5%' THEN 400000
    WHEN budget_range LIKE '%1-3%' THEN 200000
    WHEN budget_range LIKE '%Below%' OR budget_range LIKE '%Under%' THEN 100000
    ELSE 500000
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update earnings record for a project
CREATE OR REPLACE FUNCTION upsert_project_earnings(
  p_customer_id uuid,
  p_designer_id uuid,
  p_status text
)
RETURNS void AS $$
DECLARE
  v_customer customers%ROWTYPE;
  v_project_value numeric;
  v_commission_percentage numeric := 10;
  v_designer_earnings numeric;
  v_platform_commission numeric;
  v_payment_status text;
BEGIN
  SELECT * INTO v_customer FROM customers WHERE id = p_customer_id;
  
  IF NOT FOUND OR p_designer_id IS NULL THEN
    RETURN;
  END IF;
  
  v_project_value := calculate_project_value(v_customer.budget_range);
  v_platform_commission := v_project_value * v_commission_percentage / 100;
  v_designer_earnings := v_project_value - v_platform_commission;
  
  v_payment_status := CASE 
    WHEN p_status = 'completed' THEN 'paid'
    WHEN p_status IN ('assigned', 'in_progress') THEN 'processing'
    ELSE 'pending'
  END;
  
  INSERT INTO designer_projects_earnings (
    designer_id,
    project_id,
    project_name,
    project_type,
    project_value,
    designer_earnings,
    platform_commission,
    commission_percentage,
    payment_status,
    completed_at,
    paid_at,
    created_at,
    updated_at
  ) VALUES (
    p_designer_id,
    p_customer_id,
    v_customer.project_name,
    COALESCE(v_customer.property_type, 'Residential'),
    v_project_value,
    v_designer_earnings,
    v_platform_commission,
    v_commission_percentage,
    v_payment_status,
    CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (project_id) 
  DO UPDATE SET
    project_name = EXCLUDED.project_name,
    project_value = EXCLUDED.project_value,
    designer_earnings = EXCLUDED.designer_earnings,
    platform_commission = EXCLUDED.platform_commission,
    payment_status = EXCLUDED.payment_status,
    completed_at = EXCLUDED.completed_at,
    paid_at = EXCLUDED.paid_at,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function
CREATE OR REPLACE FUNCTION trigger_update_project_earnings()
RETURNS trigger AS $$
BEGIN
  IF NEW.assigned_designer_id IS NOT NULL THEN
    PERFORM upsert_project_earnings(
      NEW.id,
      NEW.assigned_designer_id,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_project_earnings_trigger ON customers;

CREATE TRIGGER update_project_earnings_trigger
  AFTER INSERT OR UPDATE OF assigned_designer_id, status
  ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_earnings();

-- Populate earnings for all existing assigned projects
DO $$
DECLARE
  customer_record customers%ROWTYPE;
BEGIN
  FOR customer_record IN 
    SELECT * FROM customers WHERE assigned_designer_id IS NOT NULL
  LOOP
    PERFORM upsert_project_earnings(
      customer_record.id,
      customer_record.assigned_designer_id,
      COALESCE(customer_record.status, 'pending')
    );
  END LOOP;
END $$;