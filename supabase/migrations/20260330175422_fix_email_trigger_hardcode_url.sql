/*
  # Fix Email Trigger with Hardcoded Supabase Configuration

  1. Changes
    - Update trigger function to use hardcoded Supabase URL and key
    - Add better error logging for debugging
    - Ensure reliable email sending on wallpaper order creation
    
  2. Security
    - Uses SECURITY DEFINER with restricted search_path
    - Anon key is public-safe and meant for client use
*/

-- Update the trigger function with hardcoded configuration
CREATE OR REPLACE FUNCTION send_wallpaper_order_receipt_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_email text;
  v_customer_user_id uuid;
  v_function_url text;
  v_request_id bigint;
BEGIN
  -- Hardcode the Supabase configuration
  v_function_url := 'https://aqcvftydzrsvahiuurts.supabase.co/functions/v1/send-order-receipt-email';

  -- Get customer's user_id and then email from auth.users
  SELECT user_id INTO v_customer_user_id
  FROM customers
  WHERE id = NEW.customer_id;

  IF v_customer_user_id IS NOT NULL THEN
    SELECT email INTO v_customer_email
    FROM auth.users
    WHERE id = v_customer_user_id;
  END IF;

  -- Log what we found
  RAISE NOTICE 'Processing order % for customer %: user_id=%, email=%', 
    NEW.id, NEW.customer_id, v_customer_user_id, v_customer_email;

  -- Only proceed if we have a valid email
  IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
    
    -- Call the Edge Function asynchronously using pg_net extension
    SELECT net.http_post(
      url := v_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxY3ZmdHlkenJzdmFoaXV1cnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjU1MjksImV4cCI6MjA2NDkwMTUyOX0.Jyl2e4RkuuutTZ3ZnkwPir-fvKMV6alAF87xSJmpinc'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'customerEmail', v_customer_email,
        'customerName', NEW.customer_name,
        'customerPhone', NEW.customer_phone,
        'customerAddress', NEW.customer_address,
        'wallSizeLength', NEW.wall_size_length,
        'wallSizeHeight', NEW.wall_size_height,
        'wallUnit', NEW.wall_unit,
        'wallpaperType', NEW.wallpaper_type,
        'ratePerSqft', NEW.rate_per_sqft,
        'totalAreaSqft', NEW.total_area_sqft,
        'totalAmount', NEW.total_amount,
        'advanceAmount', NEW.advance_amount,
        'orderDate', NEW.order_date::text
      )
    ) INTO v_request_id;
    
    RAISE NOTICE 'Email trigger fired successfully for order: % to email: %, request_id: %', 
      NEW.id, v_customer_email, v_request_id;
  ELSE
    RAISE WARNING 'Could not send email - missing customer email for order %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send order receipt email for order %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_send_wallpaper_order_receipt_email ON wallpaper_orders;

CREATE TRIGGER trigger_send_wallpaper_order_receipt_email
AFTER INSERT ON wallpaper_orders
FOR EACH ROW
EXECUTE FUNCTION send_wallpaper_order_receipt_email();
