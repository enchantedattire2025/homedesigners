/*
  # Fix Security Issues - Part 4: Optimize RLS Policies

  1. Changes
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Improves query performance at scale by preventing re-evaluation
  
  2. Security
    - Maintains same security posture with better performance
    - Fixes Auth RLS Initialization Plan issues
*/

-- Fix designer_quotes policies
DROP POLICY IF EXISTS "Customers can accept or reject quotes" ON designer_quotes;
CREATE POLICY "Customers can accept or reject quotes"
  ON designer_quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = designer_quotes.project_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Customers can view quotes for their projects" ON designer_quotes;
CREATE POLICY "Customers can view quotes for their projects"
  ON designer_quotes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = designer_quotes.project_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can manage their own quotes" ON designer_quotes;
CREATE POLICY "Designers can manage their own quotes"
  ON designer_quotes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = designer_quotes.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all quotes" ON designer_quotes;
CREATE POLICY "Admins can view all quotes"
  ON designer_quotes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid()) 
      AND admin_users.is_active = true
    )
  );

-- Fix project_assignments policies
DROP POLICY IF EXISTS "Customers can create assignments" ON project_assignments;
CREATE POLICY "Customers can create assignments"
  ON project_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_assignments.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can update assignments" ON project_assignments;
CREATE POLICY "Designers can update assignments"
  ON project_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = project_assignments.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their assignments" ON project_assignments;
CREATE POLICY "Users can view their assignments"
  ON project_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_assignments.customer_id 
      AND customers.user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = project_assignments.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix reviews policies
DROP POLICY IF EXISTS "Customers can create reviews for their projects" ON reviews;
CREATE POLICY "Customers can create reviews for their projects"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = reviews.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Customers can update own reviews" ON reviews;
CREATE POLICY "Customers can update own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = reviews.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

-- Fix project_shares policies
DROP POLICY IF EXISTS "Customers can insert own shares" ON project_shares;
CREATE POLICY "Customers can insert own shares"
  ON project_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_shares.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Customers can read own shares" ON project_shares;
CREATE POLICY "Customers can read own shares"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_shares.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Customers can update own shares" ON project_shares;
CREATE POLICY "Customers can update own shares"
  ON project_shares
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_shares.customer_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can view shares sent to them" ON project_shares;
CREATE POLICY "Designers can view shares sent to them"
  ON project_shares
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.email = project_shares.designer_email 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix quote_acceptance_history policies
DROP POLICY IF EXISTS "Customers can view acceptance history for their quotes" ON quote_acceptance_history;
CREATE POLICY "Customers can view acceptance history for their quotes"
  ON quote_acceptance_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designer_quotes dq
      JOIN customers c ON c.id = dq.project_id
      WHERE dq.id = quote_acceptance_history.quote_id 
      AND c.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can view acceptance history for their quotes" ON quote_acceptance_history;
CREATE POLICY "Designers can view acceptance history for their quotes"
  ON quote_acceptance_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designer_quotes dq
      JOIN designers d ON d.id = dq.designer_id
      WHERE dq.id = quote_acceptance_history.quote_id 
      AND d.user_id = (select auth.uid())
    )
  );

-- Fix quote_items policies
DROP POLICY IF EXISTS "Customers can view quote items for their projects" ON quote_items;
CREATE POLICY "Customers can view quote items for their projects"
  ON quote_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designer_quotes dq
      JOIN customers c ON c.id = dq.project_id
      WHERE dq.id = quote_items.quote_id 
      AND c.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can manage their own quote items" ON quote_items;
CREATE POLICY "Designers can manage their own quote items"
  ON quote_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designer_quotes dq
      JOIN designers d ON d.id = dq.designer_id
      WHERE dq.id = quote_items.quote_id 
      AND d.user_id = (select auth.uid())
    )
  );