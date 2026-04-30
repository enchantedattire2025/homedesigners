/*
  # Add PayPal payment tracking to wallpaper_orders

  1. Modified Tables
    - `wallpaper_orders`
      - `payment_method` (text) - Payment method used: 'paypal' or 'screenshot'
      - `paypal_order_id` (text) - PayPal order/transaction ID
      - `paypal_payer_email` (text) - PayPal payer email
      - `payment_status` (text) - Payment status: 'pending', 'completed', 'failed'

  2. Important Notes
    - Existing orders retain backward compatibility (payment_screenshot_url remains)
    - New PayPal fields are nullable for existing records
    - payment_screenshot_url is now also nullable (already was) for PayPal payments
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallpaper_orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE wallpaper_orders ADD COLUMN payment_method text DEFAULT 'screenshot';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallpaper_orders' AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE wallpaper_orders ADD COLUMN paypal_order_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallpaper_orders' AND column_name = 'paypal_payer_email'
  ) THEN
    ALTER TABLE wallpaper_orders ADD COLUMN paypal_payer_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallpaper_orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE wallpaper_orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;
END $$;