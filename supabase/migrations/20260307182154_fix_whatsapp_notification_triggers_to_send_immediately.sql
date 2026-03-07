/*
  # Fix WhatsApp Notification Triggers to Send Immediately

  1. Changes
    - Update triggers to directly call the edge function via HTTP request
    - Remove the queuing system and send notifications immediately
    - Use pg_net extension to make HTTP calls from database
    
  2. Implementation
    - Create function to make HTTP request to edge function
    - Update all trigger functions to call edge function directly
    - Maintain backwards compatibility with existing notification logs
*/

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to call WhatsApp notification edge function via HTTP
CREATE OR REPLACE FUNCTION send_whatsapp_notification_http(
  p_project_id uuid,
  p_notification_type text,
  p_custom_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_settings record;
  v_supabase_url text;
  v_anon_key text;
  v_request_id bigint;
BEGIN
  SELECT * INTO v_settings FROM whatsapp_settings LIMIT 1;
  
  IF v_settings IS NULL OR v_settings.is_enabled = false THEN
    RETURN;
  END IF;

  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_anon_key := current_setting('app.settings.supabase_anon_key', true);

  IF v_supabase_url IS NULL OR v_anon_key IS NULL THEN
    RAISE WARNING 'Supabase URL or anon key not configured';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/send-whatsapp-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key
    ),
    body := jsonb_build_object(
      'projectId', p_project_id,
      'notificationType', p_notification_type,
      'customMessage', p_custom_message
    )
  ) INTO v_request_id;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to send WhatsApp notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger functions to use HTTP call

CREATE OR REPLACE FUNCTION trigger_notify_quote_generated()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification_http(
      NEW.project_id,
      'quote_generated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_notify_quote_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.customer_accepted = true AND OLD.customer_accepted = false THEN
    PERFORM send_whatsapp_notification_http(
      NEW.project_id,
      'quote_accepted'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_notify_status_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.assignment_status IS DISTINCT FROM OLD.assignment_status THEN
    PERFORM send_whatsapp_notification_http(
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

CREATE OR REPLACE FUNCTION trigger_notify_project_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification_http(
      NEW.project_id,
      'project_update'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trigger_notify_team_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM send_whatsapp_notification_http(
      NEW.project_id,
      'team_assigned'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
