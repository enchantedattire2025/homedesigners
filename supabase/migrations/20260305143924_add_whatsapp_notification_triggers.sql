/*
  # WhatsApp Notification Triggers

  1. Functions
    - `notify_quote_generated()` - Triggered when a new quote is created
    - `notify_quote_accepted()` - Triggered when a quote is accepted
    - `notify_status_update()` - Triggered when project status changes
    - `notify_project_update()` - Triggered when project update is added
    - `notify_team_assigned()` - Triggered when team member is assigned
    - `notify_project_completed()` - Triggered when project is completed

  2. Triggers
    - Creates triggers on relevant tables to automatically send notifications
    - Uses background jobs to avoid blocking main operations
*/

-- Function to call WhatsApp notification edge function
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
  p_project_id uuid,
  p_notification_type text,
  p_custom_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_settings record;
BEGIN
  -- Check if WhatsApp is enabled
  SELECT * INTO v_settings FROM whatsapp_settings LIMIT 1;
  
  IF v_settings IS NULL OR v_settings.is_enabled = false THEN
    RETURN;
  END IF;

  -- Insert into notification logs as pending
  -- The edge function will be called separately via client or scheduled job
  INSERT INTO whatsapp_notification_logs (
    project_id,
    customer_id,
    notification_type,
    phone_number,
    message_body,
    status
  )
  SELECT 
    p_project_id,
    p_project_id,
    p_notification_type,
    c.phone,
    COALESCE(p_custom_message, 'Notification pending'),
    'queued'
  FROM customers c
  WHERE c.id = p_project_id;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the main operation
  RAISE WARNING 'Failed to queue WhatsApp notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for quote generated
CREATE OR REPLACE FUNCTION trigger_notify_quote_generated()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification(
      NEW.project_id,
      'quote_generated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for quote accepted
CREATE OR REPLACE FUNCTION trigger_notify_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.customer_accepted = true AND OLD.customer_accepted = false THEN
    PERFORM send_whatsapp_notification(
      NEW.project_id,
      'quote_accepted'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for project status update
CREATE OR REPLACE FUNCTION trigger_notify_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.assignment_status IS DISTINCT FROM OLD.assignment_status THEN
    -- Send notification for status changes
    PERFORM send_whatsapp_notification(
      NEW.id,
      CASE 
        WHEN NEW.assignment_status = 'completed' THEN 'project_completed'
        ELSE 'status_update'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for project updates
CREATE OR REPLACE FUNCTION trigger_notify_project_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification(
      NEW.project_id,
      'project_update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for team member assigned
CREATE OR REPLACE FUNCTION trigger_notify_team_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification(
      NEW.project_id,
      'team_assigned'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers

-- Quote generated trigger
DROP TRIGGER IF EXISTS whatsapp_quote_generated ON designer_quotes;
CREATE TRIGGER whatsapp_quote_generated
  AFTER INSERT ON designer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_quote_generated();

-- Quote accepted trigger
DROP TRIGGER IF EXISTS whatsapp_quote_accepted ON designer_quotes;
CREATE TRIGGER whatsapp_quote_accepted
  AFTER UPDATE ON designer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_quote_accepted();

-- Project status update trigger
DROP TRIGGER IF EXISTS whatsapp_status_update ON customers;
CREATE TRIGGER whatsapp_status_update
  AFTER UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_status_update();

-- Project update trigger
DROP TRIGGER IF EXISTS whatsapp_project_update ON project_updates;
CREATE TRIGGER whatsapp_project_update
  AFTER INSERT ON project_updates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_project_update();

-- Team member assigned trigger
DROP TRIGGER IF EXISTS whatsapp_team_assigned ON project_team_members;
CREATE TRIGGER whatsapp_team_assigned
  AFTER INSERT ON project_team_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_notify_team_assigned();