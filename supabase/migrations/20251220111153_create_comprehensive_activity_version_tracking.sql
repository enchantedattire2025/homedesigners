/*
  # Create Comprehensive Activity and Version Tracking System
  
  1. Changes
    - Drop old incomplete activity logging function
    - Create new comprehensive activity logging function that tracks ALL changes
    - Create version tracking function that takes snapshots
    - Update triggers to properly log activities and versions
    - Track user information (name, type) for better activity logs
  
  2. What Gets Tracked
    - All project updates (any field changes)
    - Project status changes
    - Designer assignments
    - Quote acceptance
    - Project design uploads
    - Customer and designer information
  
  3. Security
    - Functions run with proper context
    - User information captured from auth and related tables
*/

-- Drop old incomplete function
DROP FUNCTION IF EXISTS log_project_activity() CASCADE;

-- Create comprehensive activity logging function
CREATE OR REPLACE FUNCTION log_project_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
  v_user_type text;
  v_description text;
  v_old_values jsonb;
  v_new_values jsonb;
  v_customer_rec record;
  v_designer_rec record;
BEGIN
  -- Get the user who made the change
  v_user_id := auth.uid();
  
  -- Determine user type and name
  IF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := NEW.last_modified_by;
    IF v_user_id IS NULL THEN
      v_user_id := auth.uid();
    END IF;
  END IF;

  -- Get user information
  SELECT name, email INTO v_customer_rec
  FROM customers
  WHERE user_id = v_user_id
  LIMIT 1;

  SELECT name FROM designers
  WHERE user_id = v_user_id
  LIMIT 1
  INTO v_designer_rec;

  IF v_designer_rec.name IS NOT NULL THEN
    v_user_name := v_designer_rec.name;
    v_user_type := 'designer';
  ELSIF v_customer_rec.name IS NOT NULL THEN
    v_user_name := v_customer_rec.name;
    v_user_type := 'customer';
  ELSE
    v_user_name := 'System';
    v_user_type := 'system';
  END IF;

  -- Handle different operations
  IF TG_OP = 'INSERT' THEN
    v_description := 'Project created';
    v_old_values := NULL;
    v_new_values := to_jsonb(NEW);
    
    INSERT INTO project_activities (
      project_id, user_id, user_type, user_name, activity_type, description, 
      old_values, new_values
    ) VALUES (
      NEW.id, v_user_id, v_user_type, v_user_name, 'INSERT', v_description,
      v_old_values, v_new_values
    );
    
    -- Create initial version
    INSERT INTO project_versions (
      project_id, version, data, created_by, created_by_type, 
      created_by_name, change_summary
    ) VALUES (
      NEW.id, 1, to_jsonb(NEW), v_user_id, v_user_type, 
      v_user_name, 'Initial project creation'
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Build description based on what changed
    IF OLD.assignment_status IS DISTINCT FROM NEW.assignment_status THEN
      v_description := 'Project status changed from ' || COALESCE(OLD.assignment_status, 'unassigned') || 
                      ' to ' || NEW.assignment_status;
    ELSIF OLD.assigned_designer_id IS DISTINCT FROM NEW.assigned_designer_id THEN
      v_description := 'Designer assignment updated';
    ELSE
      v_description := 'Project details updated';
    END IF;

    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    
    INSERT INTO project_activities (
      project_id, user_id, user_type, user_name, activity_type, description,
      old_values, new_values
    ) VALUES (
      NEW.id, v_user_id, v_user_type, v_user_name, 'UPDATE', v_description,
      v_old_values, v_new_values
    );
    
    -- Create new version snapshot
    INSERT INTO project_versions (
      project_id, version, data, created_by, created_by_type,
      created_by_name, change_summary
    ) VALUES (
      NEW.id, NEW.version, to_jsonb(NEW), v_user_id, v_user_type,
      v_user_name, v_description
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for comprehensive activity logging
DROP TRIGGER IF EXISTS project_activity_trigger ON customers;
CREATE TRIGGER project_activity_trigger
  AFTER INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION log_project_activity();

-- Create function to log quote-related activities
CREATE OR REPLACE FUNCTION log_quote_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_user_name text;
  v_user_type text;
  v_description text;
  v_designer_rec record;
  v_customer_rec record;
BEGIN
  v_user_id := auth.uid();
  
  -- Get designer info
  SELECT d.name, d.user_id INTO v_designer_rec
  FROM designers d
  WHERE d.id = NEW.designer_id
  LIMIT 1;

  IF TG_OP = 'UPDATE' AND OLD.customer_accepted IS DISTINCT FROM NEW.customer_accepted THEN
    IF NEW.customer_accepted = true THEN
      v_description := 'Quote accepted by customer';
      v_user_type := 'customer';
      
      -- Get customer name
      SELECT c.name INTO v_customer_rec
      FROM customers c
      WHERE c.id = NEW.project_id
      LIMIT 1;
      
      v_user_name := COALESCE(v_customer_rec.name, 'Customer');
      
      -- Log activity for the project
      INSERT INTO project_activities (
        project_id, user_id, user_type, user_name, activity_type, description,
        old_values, new_values
      ) VALUES (
        NEW.project_id, v_user_id, v_user_type, v_user_name, 'QUOTE_ACCEPTED',
        v_description || ' (Quote #' || NEW.quote_number || ')',
        jsonb_build_object('customer_accepted', OLD.customer_accepted),
        jsonb_build_object('customer_accepted', NEW.customer_accepted)
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    v_user_type := 'designer';
    v_user_name := COALESCE(v_designer_rec.name, 'Designer');
    v_description := 'Quote generated';
    
    INSERT INTO project_activities (
      project_id, user_id, user_type, user_name, activity_type, description,
      old_values, new_values
    ) VALUES (
      NEW.project_id, v_designer_rec.user_id, v_user_type, v_user_name, 'QUOTE_CREATED',
      v_description || ' (Quote #' || NEW.quote_number || ')',
      NULL,
      jsonb_build_object('quote_id', NEW.id, 'total_amount', NEW.total_amount)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for quote activities
DROP TRIGGER IF EXISTS quote_activity_trigger ON designer_quotes;
CREATE TRIGGER quote_activity_trigger
  AFTER INSERT OR UPDATE ON designer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION log_quote_activity();

-- Create function to log design upload activities
CREATE OR REPLACE FUNCTION log_design_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_designer_rec record;
  v_description text;
BEGIN
  -- Get designer info
  SELECT d.name, d.user_id INTO v_designer_rec
  FROM designers d
  WHERE d.id = NEW.designer_id
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    v_description := 'Design uploaded (Version ' || NEW.version || ')';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_description := 'Design status changed from ' || OLD.status || ' to ' || NEW.status;
    ELSIF OLD.customer_feedback IS DISTINCT FROM NEW.customer_feedback AND NEW.customer_feedback IS NOT NULL AND NEW.customer_feedback != '' THEN
      v_description := 'Customer provided feedback on design';
    ELSE
      v_description := 'Design updated (Version ' || NEW.version || ')';
    END IF;
  END IF;

  INSERT INTO project_activities (
    project_id, user_id, user_type, user_name, activity_type, description,
    old_values, new_values
  ) VALUES (
    NEW.project_id,
    v_designer_rec.user_id,
    CASE WHEN NEW.customer_feedback IS DISTINCT FROM COALESCE(OLD.customer_feedback, '') 
         THEN 'customer' ELSE 'designer' END,
    COALESCE(v_designer_rec.name, 'Designer'),
    CASE WHEN TG_OP = 'INSERT' THEN 'DESIGN_UPLOADED' ELSE 'DESIGN_UPDATED' END,
    v_description,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$;

-- Create trigger for design activities
DROP TRIGGER IF EXISTS design_activity_trigger ON project_designs;
CREATE TRIGGER design_activity_trigger
  AFTER INSERT OR UPDATE ON project_designs
  FOR EACH ROW
  EXECUTE FUNCTION log_design_activity();

-- Create function to log project update activities
CREATE OR REPLACE FUNCTION log_project_update_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_designer_rec record;
BEGIN
  -- Get designer info
  SELECT d.name, d.user_id INTO v_designer_rec
  FROM designers d
  WHERE d.id = NEW.designer_id
  LIMIT 1;

  INSERT INTO project_activities (
    project_id, user_id, user_type, user_name, activity_type, description,
    old_values, new_values
  ) VALUES (
    NEW.project_id,
    v_designer_rec.user_id,
    'designer',
    COALESCE(v_designer_rec.name, 'Designer'),
    'PROJECT_UPDATE',
    'Posted update: ' || NEW.title,
    NULL,
    jsonb_build_object(
      'update_id', NEW.id,
      'title', NEW.title,
      'update_type', NEW.update_type,
      'completion_percentage', NEW.completion_percentage
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for project updates
DROP TRIGGER IF EXISTS project_update_activity_trigger ON project_updates;
CREATE TRIGGER project_update_activity_trigger
  AFTER INSERT ON project_updates
  FOR EACH ROW
  EXECUTE FUNCTION log_project_update_activity();
