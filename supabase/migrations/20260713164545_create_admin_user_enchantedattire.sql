/*
  # Create admin user: enchantedattire2025@gmail.com

  ## Summary
  Creates a super_admin account in two steps:
  1. auth.users entry with id 3513dbc7-0e42-4098-9514-30a5d19d7fea and
     email enchantedattire2025@gmail.com (the dependent table — required
     because admin_users.user_id has a FK to auth.users.id).
  2. admin_users entry with id 589c7dfa-d43a-4a1b-9aba-c166eb7a0e1d,
     role super_admin, and the specified permissions.

  ## Credentials
  - Email: enchantedattire2025@gmail.com
  - Password: admin123  (CHANGE IMMEDIATELY after first login)

  ## Notes
  - Email is auto-confirmed via the existing auto_confirm_admin_email
    trigger, so login works immediately.
  - Idempotent: re-running is safe (ON CONFLICT DO NOTHING for admin_users;
    DO block checks for existing auth.users row).
*/

DO $$
BEGIN
  -- Create auth.users entry if it does not already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '3513dbc7-0e42-4098-9514-30a5d19d7fea') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      '3513dbc7-0e42-4098-9514-30a5d19d7fea',
      'authenticated',
      'authenticated',
      'enchantedattire2025@gmail.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      '2026-03-05 12:40:44.505465+00'::timestamptz,
      '2026-03-05 12:40:44.505465+00'::timestamptz,
      '',
      '',
      '',
      ''
    );
    RAISE NOTICE 'auth.users entry created for enchantedattire2025@gmail.com';
  ELSE
    RAISE NOTICE 'auth.users entry already exists';
  END IF;
END $$;

-- Insert admin_users row with the exact id specified
INSERT INTO public.admin_users
  (id, user_id, email, role, permissions, is_active, created_at, updated_at)
VALUES
  (
    '589c7dfa-d43a-4a1b-9aba-c166eb7a0e1d',
    '3513dbc7-0e42-4098-9514-30a5d19d7fea',
    'enchantedattire2025@gmail.com',
    'super_admin',
    '{"manage_deals": true, "manage_users": true, "view_earnings": true, "manage_designers": true}'::jsonb,
    true,
    '2026-03-05 12:40:44.505465+00'::timestamptz,
    '2026-03-05 12:40:44.505465+00'::timestamptz
  )
ON CONFLICT (id) DO NOTHING;
