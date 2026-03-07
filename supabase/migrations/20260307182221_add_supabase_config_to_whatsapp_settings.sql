/*
  # Add Supabase Configuration to WhatsApp Settings

  1. Changes
    - Add supabase_url and supabase_anon_key columns to whatsapp_settings
    - These will be used by the database triggers to call the edge function
    
  2. Security
    - These settings are only accessible by admins via RLS
*/

-- Add Supabase configuration columns
ALTER TABLE whatsapp_settings 
ADD COLUMN IF NOT EXISTS supabase_url text,
ADD COLUMN IF NOT EXISTS supabase_anon_key text;

-- Update the HTTP notification function to read from settings
CREATE OR REPLACE FUNCTION send_whatsapp_notification_http(
  p_project_id uuid,
  p_notification_type text,
  p_custom_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_settings record;
  v_request_id bigint;
BEGIN
  SELECT * INTO v_settings FROM whatsapp_settings LIMIT 1;
  
  IF v_settings IS NULL OR v_settings.is_enabled = false THEN
    RETURN;
  END IF;

  IF v_settings.supabase_url IS NULL OR v_settings.supabase_anon_key IS NULL THEN
    RAISE WARNING 'Supabase URL or anon key not configured in whatsapp_settings';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := v_settings.supabase_url || '/functions/v1/send-whatsapp-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_settings.supabase_anon_key
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
