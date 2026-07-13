/*
  # Restore admin_users RLS policies and helper functions

  ## Problem
  admin_users has RLS enabled but ZERO policies, so no authenticated
  client can read any row. AdminLogin queries admin_users by user_id and
  always gets null -> "Access denied. This account does not have admin
  privileges."

  ## Root cause
  The helper functions (is_active_admin, is_super_admin) and the admin_users
  RLS policies from earlier migrations are missing from the live database.

  ## Fix
  Recreate the SECURITY DEFINER helper functions and the admin_users RLS
  policies using the recursion-safe pattern: the functions bypass RLS, so
  the SELECT policy can call is_active_admin() without infinite recursion.
*/

-- Helper function: is the current user an active admin? (bypasses RLS)
CREATE OR REPLACE FUNCTION is_active_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Helper function: is the current user a super admin? (bypasses RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_active_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- SELECT: active admins can read admin_users rows
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (is_active_admin());

-- INSERT/UPDATE/DELETE: only super admins can manage admin_users
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
