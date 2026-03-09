/*
  # Remove Twilio Support from WhatsApp Configuration

  1. Changes
    - Remove Twilio-specific columns from whatsapp_settings table
    - Update provider default to 'waha'
    - Keep only WAHA-related fields

  2. Columns Removed
    - account_sid (Twilio-specific)
    - auth_token (Twilio-specific)
    - from_number (Twilio-specific)

  3. Notes
    - Existing data in these columns will be permanently deleted
    - Only WAHA provider is now supported
*/

-- Drop Twilio-specific columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_settings' AND column_name = 'account_sid'
  ) THEN
    ALTER TABLE whatsapp_settings DROP COLUMN account_sid;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_settings' AND column_name = 'auth_token'
  ) THEN
    ALTER TABLE whatsapp_settings DROP COLUMN auth_token;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_settings' AND column_name = 'from_number'
  ) THEN
    ALTER TABLE whatsapp_settings DROP COLUMN from_number;
  END IF;
END $$;

-- Update provider column to default to 'waha'
ALTER TABLE whatsapp_settings 
  ALTER COLUMN provider SET DEFAULT 'waha';

-- Update any existing records to use 'waha' if they were using 'twilio'
UPDATE whatsapp_settings 
SET provider = 'waha' 
WHERE provider = 'twilio';
