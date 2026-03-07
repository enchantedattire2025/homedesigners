/*
  # Add Logging to WhatsApp Triggers for Debugging

  1. Changes
    - Add RAISE NOTICE to trigger functions to log execution
    - Wrap in exception handlers to catch any errors
    
  2. Purpose
    - Debug why triggers aren't firing notifications
*/

-- Trigger function for quote generated with logging
CREATE OR REPLACE FUNCTION trigger_notify_quote_generated()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'WhatsApp trigger fired for quote_generated, project_id: %', NEW.project_id;
  
  IF TG_OP = 'INSERT' THEN
    BEGIN
      PERFORM send_whatsapp_notification(
        NEW.project_id,
        'quote_generated'
      );
      RAISE NOTICE 'WhatsApp notification queued successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for quote accepted with logging
CREATE OR REPLACE FUNCTION trigger_notify_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.customer_accepted = true AND OLD.customer_accepted = false THEN
    RAISE NOTICE 'WhatsApp trigger fired for quote_accepted, project_id: %', NEW.project_id;
    
    BEGIN
      PERFORM send_whatsapp_notification(
        NEW.project_id,
        'quote_accepted'
      );
      RAISE NOTICE 'WhatsApp notification queued successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for project status update with logging
CREATE OR REPLACE FUNCTION trigger_notify_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.assignment_status IS DISTINCT FROM OLD.assignment_status THEN
    RAISE NOTICE 'WhatsApp trigger fired for status_update, project_id: %, status: %', NEW.id, NEW.assignment_status;
    
    BEGIN
      PERFORM send_whatsapp_notification(
        NEW.id,
        CASE 
          WHEN NEW.assignment_status = 'completed' THEN 'project_completed'
          ELSE 'status_update'
        END
      );
      RAISE NOTICE 'WhatsApp notification queued successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for project updates with logging
CREATE OR REPLACE FUNCTION trigger_notify_project_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'WhatsApp trigger fired for project_update, project_id: %', NEW.project_id;
    
    BEGIN
      PERFORM send_whatsapp_notification(
        NEW.project_id,
        'project_update'
      );
      RAISE NOTICE 'WhatsApp notification queued successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for team member assigned with logging
CREATE OR REPLACE FUNCTION trigger_notify_team_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    RAISE NOTICE 'WhatsApp trigger fired for team_assigned, project_id: %', NEW.project_id;
    
    BEGIN
      PERFORM send_whatsapp_notification(
        NEW.project_id,
        'team_assigned'
      );
      RAISE NOTICE 'WhatsApp notification queued successfully';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'WhatsApp notification failed: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
