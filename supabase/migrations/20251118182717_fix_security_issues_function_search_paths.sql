/*
  # Fix Security Issues - Part 3: Fix Function Search Paths

  1. Changes
    - Set immutable search paths on all functions to prevent SQL injection
    - Critical security fix for function security
  
  2. Security
    - Sets search_path to pg_catalog, public for all affected functions
    - Prevents search_path manipulation attacks
*/

-- Fix calculate_project_value function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Fix upsert_project_earnings function
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
    designer_id, project_id, project_name, project_type, project_value,
    designer_earnings, platform_commission, commission_percentage,
    payment_status, completed_at, paid_at, created_at, updated_at
  ) VALUES (
    p_designer_id, p_customer_id, v_customer.project_name,
    COALESCE(v_customer.property_type, 'Residential'), v_project_value,
    v_designer_earnings, v_platform_commission, v_commission_percentage,
    v_payment_status,
    CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CASE WHEN p_status = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Fix trigger_update_project_earnings function
CREATE OR REPLACE FUNCTION trigger_update_project_earnings()
RETURNS trigger AS $$
BEGIN
  IF NEW.assigned_designer_id IS NOT NULL THEN
    PERFORM upsert_project_earnings(NEW.id, NEW.assigned_designer_id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix log_project_activity function
CREATE OR REPLACE FUNCTION log_project_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_activities (project_id, activity_type, description, user_id)
    VALUES (
      NEW.id,
      'status_change',
      'Project status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Fix update_review_helpful_votes function
CREATE OR REPLACE FUNCTION update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reviews
  SET helpful_votes = (
    SELECT COUNT(*) FROM review_votes WHERE review_id = NEW.review_id AND vote_type = 'helpful'
  )
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix update_designer_rating function
CREATE OR REPLACE FUNCTION update_designer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE designers
  SET 
    rating = (SELECT AVG(rating) FROM reviews WHERE designer_id = NEW.designer_id),
    total_projects = (SELECT COUNT(*) FROM reviews WHERE designer_id = NEW.designer_id)
  WHERE id = NEW.designer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix track_quote_acceptance function
CREATE OR REPLACE FUNCTION track_quote_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_accepted IS DISTINCT FROM OLD.customer_accepted THEN
    INSERT INTO quote_acceptance_history (
      quote_id, previous_status, new_status, changed_by
    ) VALUES (
      NEW.id,
      CASE WHEN OLD.customer_accepted THEN 'accepted' WHEN OLD.customer_accepted = false THEN 'rejected' ELSE 'pending' END,
      CASE WHEN NEW.customer_accepted THEN 'accepted' WHEN NEW.customer_accepted = false THEN 'rejected' ELSE 'pending' END,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- Fix update_design_project_cost function
CREATE OR REPLACE FUNCTION update_design_project_cost()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE design_projects
  SET estimated_cost = (
    SELECT COALESCE(SUM(COALESCE(estimated_cost, 0)), 0)
    FROM design_furniture
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix update_quote_status_on_send function
CREATE OR REPLACE FUNCTION update_quote_status_on_send()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL THEN
    NEW.status = 'sent';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix update_deal_redemptions_count function
CREATE OR REPLACE FUNCTION update_deal_redemptions_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE designer_deals
  SET 
    redemptions_count = (
      SELECT COUNT(*) 
      FROM deal_redemptions 
      WHERE deal_id = NEW.deal_id
    )
  WHERE id = NEW.deal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog, public;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;