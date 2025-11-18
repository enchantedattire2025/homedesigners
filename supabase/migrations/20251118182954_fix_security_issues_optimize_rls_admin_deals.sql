/*
  # Fix Security Issues - Part 6: Optimize Admin and Deal RLS Policies

  1. Changes
    - Optimize admin and deal-related RLS policies
    - Replace auth.uid() with (select auth.uid())
  
  2. Security
    - Maintains security with better performance
*/

-- Fix designer_deals policies
DROP POLICY IF EXISTS "Admins can manage all deals" ON designer_deals;
CREATE POLICY "Admins can manage all deals"
  ON designer_deals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid()) 
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Designers can manage own deals" ON designer_deals;
CREATE POLICY "Designers can manage own deals"
  ON designer_deals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = designer_deals.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all deals" ON designer_deals;
DROP POLICY IF EXISTS "Admins can insert deals" ON designer_deals;
DROP POLICY IF EXISTS "Admins can update deals" ON designer_deals;
DROP POLICY IF EXISTS "Admins can delete deals" ON designer_deals;

-- Fix designer_projects_earnings policies
DROP POLICY IF EXISTS "Admins can manage all earnings" ON designer_projects_earnings;
CREATE POLICY "Admins can manage all earnings"
  ON designer_projects_earnings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid()) 
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all earnings" ON designer_projects_earnings;

DROP POLICY IF EXISTS "Designers can view own earnings" ON designer_projects_earnings;
CREATE POLICY "Designers can view own earnings"
  ON designer_projects_earnings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = designer_projects_earnings.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix deal_redemptions policies
DROP POLICY IF EXISTS "Customers can view own redemptions" ON deal_redemptions;
CREATE POLICY "Customers can view own redemptions"
  ON deal_redemptions
  FOR SELECT
  TO authenticated
  USING (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Customers can redeem deals" ON deal_redemptions;
CREATE POLICY "Customers can redeem deals"
  ON deal_redemptions
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all redemptions" ON deal_redemptions;
CREATE POLICY "Admins can view all redemptions"
  ON deal_redemptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (select auth.uid()) 
      AND admin_users.is_active = true
    )
  );