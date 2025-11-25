/*
  # Fix RLS Performance and Security Issues

  1. Performance Issues Fixed
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation for each row, improving query performance at scale

  2. Security Issues Fixed
    - Fix function search_path to be immutable
    - Remove duplicate indexes
    - Drop unused indexes to reduce storage and maintenance overhead

  3. Policy Optimizations
    - Consolidate multiple permissive policies where appropriate
    - Keep separate policies only where they serve distinct purposes
*/

-- ============================================================================
-- PART 1: Fix auth.uid() Performance Issues in RLS Policies
-- ============================================================================

-- CUSTOMERS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (is_active_admin());

DROP POLICY IF EXISTS "Customers can insert own projects" ON customers;
CREATE POLICY "Customers can insert own projects"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Customers can update own projects" ON customers;
CREATE POLICY "Customers can update own projects"
  ON customers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Designers can view assigned projects" ON customers;
CREATE POLICY "Designers can view assigned projects"
  ON customers FOR SELECT
  TO authenticated
  USING (
    assigned_designer_id IN (
      SELECT id FROM designers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can view customer projects" ON customers;
CREATE POLICY "Designers can view customer projects"
  ON customers FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_shares
      WHERE designer_email IN (
        SELECT email FROM designers WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "admin can read customer details" ON customers;
CREATE POLICY "admin can read customer details"
  ON customers FOR SELECT
  TO anon, authenticated, authenticator, dashboard_user
  USING (is_active_admin());

-- DESIGNERS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can update all designers" ON designers;
CREATE POLICY "Admins can update all designers"
  ON designers FOR UPDATE
  TO authenticated
  USING (is_active_admin())
  WITH CHECK (is_active_admin());

DROP POLICY IF EXISTS "Admins can view all designers" ON designers;
CREATE POLICY "Admins can view all designers"
  ON designers FOR SELECT
  TO authenticated
  USING (is_active_admin());

DROP POLICY IF EXISTS "Designers can insert own profile" ON designers;
CREATE POLICY "Designers can insert own profile"
  ON designers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Designers can read own profile" ON designers;
CREATE POLICY "Designers can read own profile"
  ON designers FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Designers can update own profile" ON designers;
CREATE POLICY "Designers can update own profile"
  ON designers FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- SHARED_GALLERY_ITEMS TABLE POLICIES
DROP POLICY IF EXISTS "Designers can delete their own gallery items" ON shared_gallery_items;
CREATE POLICY "Designers can delete their own gallery items"
  ON shared_gallery_items FOR DELETE
  TO authenticated
  USING (
    designer_id IN (
      SELECT id FROM designers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can insert their own gallery items" ON shared_gallery_items;
CREATE POLICY "Designers can insert their own gallery items"
  ON shared_gallery_items FOR INSERT
  TO authenticated
  WITH CHECK (
    designer_id IN (
      SELECT id FROM designers WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can update their own gallery items" ON shared_gallery_items;
CREATE POLICY "Designers can update their own gallery items"
  ON shared_gallery_items FOR UPDATE
  TO authenticated
  USING (
    designer_id IN (
      SELECT id FROM designers WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    designer_id IN (
      SELECT id FROM designers WHERE user_id = (select auth.uid())
    )
  );

-- ADMIN_USERS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
CREATE POLICY "Admins can read own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 2: Fix Function Search Paths
-- ============================================================================

-- Drop and recreate functions with immutable search_path
DROP FUNCTION IF EXISTS is_admin();
CREATE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

DROP FUNCTION IF EXISTS get_customer_quotes(uuid);
CREATE FUNCTION get_customer_quotes(customer_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  designer_id uuid,
  project_id uuid,
  quote_number text,
  title text,
  description text,
  subtotal numeric,
  discount_amount numeric,
  tax_rate numeric,
  tax_amount numeric,
  total_amount numeric,
  status text,
  valid_until date,
  terms_and_conditions text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  customer_accepted boolean,
  acceptance_date timestamptz,
  customer_feedback text,
  notification_sent boolean,
  customer_name text,
  customer_email text,
  customer_phone text,
  project_name text,
  assigned_designer_id uuid,
  designer_name text,
  designer_email text,
  designer_phone text,
  designer_profile_image text,
  designer_specialization text,
  items json
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.designer_id,
    q.project_id,
    q.quote_number,
    q.title,
    q.description,
    q.subtotal,
    q.discount_amount,
    q.tax_rate,
    q.tax_amount,
    q.total_amount,
    q.status,
    q.valid_until,
    q.terms_and_conditions,
    q.notes,
    q.created_at,
    q.updated_at,
    q.customer_accepted,
    q.acceptance_date,
    q.customer_feedback,
    q.notification_sent,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    c.project_name,
    c.assigned_designer_id,
    d.name as designer_name,
    d.email as designer_email,
    d.phone as designer_phone,
    d.profile_image as designer_profile_image,
    d.specialization as designer_specialization,
    (
      SELECT json_agg(i.*)
      FROM quote_items i
      WHERE i.quote_id = q.id
    ) as items
  FROM designer_quotes q
  JOIN customers c ON c.id = q.project_id
  JOIN designers d ON d.id = q.designer_id
  WHERE c.user_id = customer_user_id
  ORDER BY q.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_customer_quotes(uuid) TO authenticated;

DROP FUNCTION IF EXISTS get_designer_assigned_projects(uuid);
CREATE FUNCTION get_designer_assigned_projects(designer_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  location text,
  project_name text,
  property_type text,
  project_area text,
  budget_range text,
  timeline text,
  requirements text,
  preferred_designer text,
  layout_image_url text,
  inspiration_links text[],
  room_types text[],
  special_requirements text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  version integer,
  assigned_designer_id uuid,
  assignment_status text,
  last_modified_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.location,
    c.project_name,
    c.property_type,
    c.project_area,
    c.budget_range,
    c.timeline,
    c.requirements,
    c.preferred_designer,
    c.layout_image_url,
    c.inspiration_links,
    c.room_types,
    c.special_requirements,
    c.status,
    c.created_at,
    c.updated_at,
    c.user_id,
    c.version,
    c.assigned_designer_id,
    c.assignment_status,
    c.last_modified_by
  FROM customers c
  WHERE c.assigned_designer_id IN (
    SELECT d.id FROM designers d WHERE d.user_id = designer_user_id
  )
  ORDER BY c.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION get_designer_assigned_projects(uuid) TO authenticated;

-- ============================================================================
-- PART 3: Remove Duplicate Indexes
-- ============================================================================

-- Drop duplicate index, keep the original
DROP INDEX IF EXISTS idx_customers_assigned_designer_id;

-- ============================================================================
-- PART 4: Drop Unused Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chatbot_knowledge_category;
DROP INDEX IF EXISTS idx_chatbot_knowledge_keywords;
DROP INDEX IF EXISTS idx_design_furniture_project_id;
DROP INDEX IF EXISTS idx_design_projects_customer_project_id;
DROP INDEX IF EXISTS idx_design_rooms_project_id;
DROP INDEX IF EXISTS idx_design_walls_project_id;
DROP INDEX IF EXISTS idx_designer_material_prices_category;
DROP INDEX IF EXISTS idx_designer_material_prices_name;
DROP INDEX IF EXISTS idx_designer_quotes_customer_accepted;
DROP INDEX IF EXISTS idx_designers_user_id_email;
DROP INDEX IF EXISTS idx_project_activities_created_at;
DROP INDEX IF EXISTS idx_project_shares_designer_email;
DROP INDEX IF EXISTS idx_project_team_members_added_by;
DROP INDEX IF EXISTS idx_project_updates_created_at;
DROP INDEX IF EXISTS idx_project_updates_designer_id;
DROP INDEX IF EXISTS idx_quote_acceptance_history_created_at;
DROP INDEX IF EXISTS idx_quote_acceptance_history_quote_id;
DROP INDEX IF EXISTS idx_quote_items_material_id;
DROP INDEX IF EXISTS idx_review_responses_review_id;
DROP INDEX IF EXISTS idx_review_votes_review_id;
DROP INDEX IF EXISTS idx_reviews_created_at;
DROP INDEX IF EXISTS idx_reviews_designer_id;
DROP INDEX IF EXISTS idx_reviews_project_id;
DROP INDEX IF EXISTS idx_reviews_rating;
DROP INDEX IF EXISTS idx_admin_users_email;
DROP INDEX IF EXISTS idx_designer_deals_designer_id;
DROP INDEX IF EXISTS idx_designer_deals_featured;
DROP INDEX IF EXISTS idx_designer_projects_earnings_designer_id;
DROP INDEX IF EXISTS idx_designer_projects_earnings_payment_status;
DROP INDEX IF EXISTS idx_deal_redemptions_deal_id;
DROP INDEX IF EXISTS idx_customers_last_modified_by;
DROP INDEX IF EXISTS idx_project_activities_user_id;
DROP INDEX IF EXISTS idx_project_assignments_customer_id;
DROP INDEX IF EXISTS idx_project_shares_customer_id;
DROP INDEX IF EXISTS idx_project_versions_created_by;
DROP INDEX IF EXISTS idx_quote_acceptance_history_changed_by;
DROP INDEX IF EXISTS idx_review_responses_designer_id_fkey;
DROP INDEX IF EXISTS idx_shared_gallery_items_designer_id;
