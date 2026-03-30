/*
  # Send Email Receipt on 3D Wallpaper Order Creation

  1. Changes
    - Create trigger function to automatically send email receipt when new wallpaper order is placed
    - Invokes the `send-order-receipt-email` Edge Function with order details
    - Sends email to customer with order summary and payment instructions
    
  2. Security
    - Uses SECURITY DEFINER for elevated permissions
    - Sets search_path to public for security
    - Only triggers on INSERT operations
    
  3. Important Notes
    - Email sent immediately after order is inserted
    - Contains complete order details including dimensions, pricing, and delivery address
    - Requires RESEND_API_KEY to be configured in Edge Function secrets
    - Customer email is retrieved from auth.users table via customer's user_id
*/

-- Function to send email receipt when wallpaper order is created
CREATE OR REPLACE FUNCTION send_wallpaper_order_receipt_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_email text;
  v_customer_user_id uuid;
  v_supabase_url text;
  v_supabase_anon_key text;
  v_function_url text;
  v_response text;
BEGIN
  -- Get Supabase URL and anon key from environment
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);

  -- If settings not available, use vault (fallback)
  IF v_supabase_url IS NULL THEN
    v_supabase_url := vault.get_secret('supabase_url');
  END IF;
  
  IF v_supabase_anon_key IS NULL THEN
    v_supabase_anon_key := vault.get_secret('supabase_anon_key');
  END IF;

  -- Get customer's user_id and then email from auth.users
  SELECT user_id INTO v_customer_user_id
  FROM customers
  WHERE id = NEW.customer_id;

  IF v_customer_user_id IS NOT NULL THEN
    SELECT email INTO v_customer_email
    FROM auth.users
    WHERE id = v_customer_user_id;
  END IF;

  -- Only proceed if we have a valid email
  IF v_customer_email IS NOT NULL AND v_customer_email != '' THEN
    -- Construct Edge Function URL
    v_function_url := v_supabase_url || '/functions/v1/send-order-receipt-email';

    -- Call the Edge Function asynchronously using pg_net extension
    PERFORM net.http_post(
      url := v_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_supabase_anon_key
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
        'orderDate', NEW.order_date
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send order receipt email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to send email on new wallpaper order
DROP TRIGGER IF EXISTS trigger_send_wallpaper_order_receipt_email ON wallpaper_orders;

CREATE TRIGGER trigger_send_wallpaper_order_receipt_email
AFTER INSERT ON wallpaper_orders
FOR EACH ROW
EXECUTE FUNCTION send_wallpaper_order_receipt_email();

-- Store Supabase configuration in app settings for the trigger function
DO $$
BEGIN
  -- These will be set from environment variables at runtime
  PERFORM set_config('app.settings.supabase_url', current_setting('SUPABASE_URL', true), false);
  PERFORM set_config('app.settings.supabase_anon_key', current_setting('SUPABASE_ANON_KEY', true), false);
EXCEPTION
  WHEN OTHERS THEN
    -- Settings will be retrieved from vault if not available
    NULL;
END $$;
