/*
  # Update WhatsApp Settings for WAHA Integration

  1. Changes
    - Add WAHA-specific fields to whatsapp_settings table
    - Add provider field to track which service is being used (twilio or waha)
    - Add WAHA API URL and session name fields
    - Keep Twilio fields for backward compatibility
    
  2. New Fields
    - provider: enum ('twilio', 'waha') - which service to use
    - waha_api_url: text - WAHA instance URL
    - waha_session: text - WAHA session name
    - waha_api_key: text - WAHA API key (optional, for secured instances)
*/

-- Add provider type enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_provider') THEN
    CREATE TYPE whatsapp_provider AS ENUM ('twilio', 'waha');
  END IF;
END $$;

-- Add WAHA fields to whatsapp_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_settings' AND column_name = 'provider'
  ) THEN
    ALTER TABLE whatsapp_settings 
    ADD COLUMN provider whatsapp_provider DEFAULT 'twilio';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_settings' AND column_name = 'waha_api_url'
  ) THEN
    ALTER TABLE whatsapp_settings 
    ADD COLUMN waha_api_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_settings' AND column_name = 'waha_session'
  ) THEN
    ALTER TABLE whatsapp_settings 
    ADD COLUMN waha_session text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'whatsapp_settings' AND column_name = 'waha_api_key'
  ) THEN
    ALTER TABLE whatsapp_settings 
    ADD COLUMN waha_api_key text;
  END IF;
END $$;

-- Add comment explaining the fields
COMMENT ON COLUMN whatsapp_settings.provider IS 'WhatsApp provider: twilio or waha';
COMMENT ON COLUMN whatsapp_settings.waha_api_url IS 'WAHA instance URL (e.g., http://localhost:3000 or https://waha.yourdomain.com)';
COMMENT ON COLUMN whatsapp_settings.waha_session IS 'WAHA session name (e.g., default)';
COMMENT ON COLUMN whatsapp_settings.waha_api_key IS 'WAHA API key for secured instances (optional)';
