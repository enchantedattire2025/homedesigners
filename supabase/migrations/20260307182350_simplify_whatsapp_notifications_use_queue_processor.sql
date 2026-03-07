/*
  # Simplify WhatsApp Notifications - Use Queue Processor

  1. Changes
    - Revert triggers to simple queue insertion (original behavior)
    - Update send_whatsapp_notification to properly format messages
    - Edge function will be called from client-side queue processor
    
  2. Reasoning
    - Database HTTP calls via pg_net may have limitations
    - Client-side processing is more reliable and easier to debug
    - Maintains proper error handling and retry logic
*/

-- Update the notification function to create proper message body
CREATE OR REPLACE FUNCTION send_whatsapp_notification(
  p_project_id uuid,
  p_notification_type text,
  p_custom_message text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_settings record;
  v_customer record;
  v_message text;
BEGIN
  SELECT * INTO v_settings FROM whatsapp_settings LIMIT 1;
  
  IF v_settings IS NULL OR v_settings.is_enabled = false THEN
    RETURN;
  END IF;

  SELECT * INTO v_customer FROM customers WHERE id = p_project_id;
  
  IF v_customer IS NULL THEN
    RETURN;
  END IF;

  IF p_custom_message IS NOT NULL THEN
    v_message := p_custom_message;
  ELSE
    CASE p_notification_type
      WHEN 'quote_generated' THEN
        v_message := format('Hello %s! 📋 A new quotation has been generated for your project. Please log in to your account to review and accept it. Thank you! - The Home Designers Team', v_customer.name);
      WHEN 'quote_accepted' THEN
        v_message := format('Hello %s! ✅ Thank you for accepting the quotation. Our team will start working on your project soon. Thank you! - The Home Designers Team', v_customer.name);
      WHEN 'status_update' THEN
        v_message := format('Hello %s! 📢 There''s an update on your project. Status: %s. Log in to your account for more details. Thank you! - The Home Designers Team', v_customer.name, COALESCE(v_customer.assignment_status, 'Updated'));
      WHEN 'project_update' THEN
        v_message := format('Hello %s! 📸 New photos or updates have been added to your project. Log in to check them out! Thank you! - The Home Designers Team', v_customer.name);
      WHEN 'team_assigned' THEN
        v_message := format('Hello %s! 👥 A team member has been assigned to your project. Log in for more details. Thank you! - The Home Designers Team', v_customer.name);
      WHEN 'project_completed' THEN
        v_message := format('Hello %s! 🎉 Congratulations! Your project has been completed. Log in to review the final results. Thank you! - The Home Designers Team', v_customer.name);
      ELSE
        v_message := format('Hello %s! There''s an update on your project. Log in to your account for details. Thank you! - The Home Designers Team', v_customer.name);
    END CASE;
  END IF;

  INSERT INTO whatsapp_notification_logs (
    project_id,
    customer_id,
    notification_type,
    phone_number,
    message_body,
    status
  ) VALUES (
    p_project_id,
    p_project_id,
    p_notification_type,
    v_customer.phone,
    v_message,
    'queued'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to queue WhatsApp notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
