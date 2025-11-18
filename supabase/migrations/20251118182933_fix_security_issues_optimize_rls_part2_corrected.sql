/*
  # Fix Security Issues - Part 5: Optimize RLS Policies (Part 2 Corrected)

  1. Changes
    - Continue optimizing RLS policies with (select auth.uid())
    - Uses correct column names
  
  2. Security
    - Maintains security with better performance
*/

-- Fix project_team_members policies
DROP POLICY IF EXISTS "Customers can view team members for their projects" ON project_team_members;
CREATE POLICY "Customers can view team members for their projects"
  ON project_team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_team_members.project_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can manage team members for their projects" ON project_team_members;
CREATE POLICY "Designers can manage team members for their projects"
  ON project_team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = project_team_members.project_id 
      AND c.assigned_designer_id IN (
        SELECT id FROM designers WHERE user_id = (select auth.uid())
      )
    )
  );

-- Fix project_updates policies
DROP POLICY IF EXISTS "Customers can view updates for their projects" ON project_updates;
CREATE POLICY "Customers can view updates for their projects"
  ON project_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_updates.project_id 
      AND customers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can manage updates for their assigned projects" ON project_updates;
CREATE POLICY "Designers can manage updates for their assigned projects"
  ON project_updates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = project_updates.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix designer_material_prices policies
DROP POLICY IF EXISTS "Designers can manage their own material prices" ON designer_material_prices;
CREATE POLICY "Designers can manage their own material prices"
  ON designer_material_prices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = designer_material_prices.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix review_responses policies
DROP POLICY IF EXISTS "Designers can respond to their reviews" ON review_responses;
CREATE POLICY "Designers can respond to their reviews"
  ON review_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = review_responses.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Designers can update own responses" ON review_responses;
CREATE POLICY "Designers can update own responses"
  ON review_responses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designers 
      WHERE designers.id = review_responses.designer_id 
      AND designers.user_id = (select auth.uid())
    )
  );

-- Fix review_votes policies
DROP POLICY IF EXISTS "Users can update own votes" ON review_votes;
CREATE POLICY "Users can update own votes"
  ON review_votes
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can vote on reviews" ON review_votes;
CREATE POLICY "Users can vote on reviews"
  ON review_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Fix project_activities policies
DROP POLICY IF EXISTS "Users can view activities for their projects" ON project_activities;
CREATE POLICY "Users can view activities for their projects"
  ON project_activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_activities.project_id 
      AND customers.user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM customers c
      JOIN designers d ON d.id = c.assigned_designer_id
      WHERE c.id = project_activities.project_id 
      AND d.user_id = (select auth.uid())
    )
  );

-- Fix project_versions policies
DROP POLICY IF EXISTS "Users can view versions for their projects" ON project_versions;
CREATE POLICY "Users can view versions for their projects"
  ON project_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers 
      WHERE customers.id = project_versions.project_id 
      AND customers.user_id = (select auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM customers c
      JOIN designers d ON d.id = c.assigned_designer_id
      WHERE c.id = project_versions.project_id 
      AND d.user_id = (select auth.uid())
    )
  );

-- Fix design_furniture policies (correct column name: design_project_id)
DROP POLICY IF EXISTS "Users can manage furniture in own design projects" ON design_furniture;
CREATE POLICY "Users can manage furniture in own design projects"
  ON design_furniture
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM design_projects 
      WHERE design_projects.id = design_furniture.design_project_id 
      AND design_projects.user_id = (select auth.uid())
    )
  );

-- Fix chat_messages policies
DROP POLICY IF EXISTS "Users can manage messages in own conversations" ON chat_messages;
CREATE POLICY "Users can manage messages in own conversations"
  ON chat_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = (select auth.uid())
    )
  );

-- Fix chat_conversations policies  
DROP POLICY IF EXISTS "Users can manage own conversations" ON chat_conversations;
CREATE POLICY "Users can manage own conversations"
  ON chat_conversations
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Fix design_projects policies
DROP POLICY IF EXISTS "Users can manage own design projects" ON design_projects;
CREATE POLICY "Users can manage own design projects"
  ON design_projects
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Fix design_rooms policies (correct column name: design_project_id)
DROP POLICY IF EXISTS "Users can manage rooms in own design projects" ON design_rooms;
CREATE POLICY "Users can manage rooms in own design projects"
  ON design_rooms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM design_projects 
      WHERE design_projects.id = design_rooms.design_project_id 
      AND design_projects.user_id = (select auth.uid())
    )
  );

-- Fix design_walls policies (correct column name: design_project_id)
DROP POLICY IF EXISTS "Users can manage walls in own design projects" ON design_walls;
CREATE POLICY "Users can manage walls in own design projects"
  ON design_walls
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM design_projects 
      WHERE design_projects.id = design_walls.design_project_id 
      AND design_projects.user_id = (select auth.uid())
    )
  );