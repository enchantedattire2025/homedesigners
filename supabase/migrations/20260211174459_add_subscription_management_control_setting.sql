/*
  # Add Subscription Management Control Setting
  
  1. Purpose
    - Allow admin to enable/disable the "Manage Subscription" button for all designers
    - Provides centralized control over subscription feature visibility
  
  2. Changes
    - Insert a new setting in site_settings table for subscription_management_enabled
    - Default value is false (disabled) to match current state
  
  3. Security
    - No RLS changes needed, site_settings already has proper RLS policies
*/

-- Insert subscription management control setting
INSERT INTO site_settings (setting_key, video_type, video_url, video_title, video_description, is_active, created_at, updated_at)
VALUES (
  'subscription_management_enabled',
  NULL,
  NULL,
  'Subscription Management Control',
  'Enable or disable the Manage Subscription button for designers',
  false,
  now(),
  now()
)
ON CONFLICT (setting_key) DO NOTHING;
