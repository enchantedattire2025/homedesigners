/*
  # Consolidate Redundant RLS Policies

  1. Purpose
    - Consolidate truly redundant policies that serve the same purpose
    - Keep separate policies when they serve distinct user roles (admin vs user vs designer)
    - Improve policy clarity and reduce maintenance overhead

  2. Changes
    - Remove "admin can read customer details" as it duplicates "Admins can view all customers"
    - Remove "Enable read access for all users" as it's too permissive (let specific policies handle access)
    - Consolidate duplicate INSERT policies for chat_conversations
*/

-- ============================================================================
-- CUSTOMERS TABLE - Remove Redundant Policies
-- ============================================================================

-- Remove the redundant admin policy (already covered by "Admins can view all customers")
DROP POLICY IF EXISTS "admin can read customer details" ON customers;

-- Remove the overly permissive "Enable read access for all users" policy
-- Specific policies will handle access (customers see own, designers see assigned, admins see all)
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;

-- ============================================================================
-- CHAT_CONVERSATIONS TABLE - Consolidate Duplicate Policies
-- ============================================================================

-- Remove redundant insert policy for authenticated users
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON chat_conversations;

-- Keep "Users can manage own conversations" which is more specific and secure

-- Remove redundant anon insert policy if it exists
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON chat_conversations;

-- Keep "Anonymous users can create conversations" for anon users
