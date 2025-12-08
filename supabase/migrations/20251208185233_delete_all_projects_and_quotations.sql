/*
  # Delete All Projects and Quotations
  
  This migration removes all project-related data and quotation data from the database
  while preserving designers, admin users, subscriptions, materials, and system data.
  
  ## Deletion Order (respecting foreign key constraints)
  
  1. Quote-related data:
     - quote_acceptance_history
     - quote_items
     - designer_quotes
  
  2. Design tool data:
     - design_furniture
     - design_walls
     - design_rooms
     - design_projects
  
  3. Project-related data:
     - designer_projects_earnings
     - review_responses
     - review_votes
     - reviews
     - project_versions
     - project_updates
     - project_team_members
     - project_shares
     - project_assignments
     - project_activities
  
  4. Main project records:
     - customers (all project records)
  
  ## Preserved Data
  - Designers
  - Admin users
  - Subscription plans and subscriptions
  - Material pricing (designer_material_prices)
  - Gallery items (shared_gallery_items)
  - Chatbot knowledge
  - Chat conversations and messages
  - Deal redemptions
*/

-- Delete quote acceptance history
DELETE FROM quote_acceptance_history;

-- Delete quote items
DELETE FROM quote_items;

-- Delete designer quotes
DELETE FROM designer_quotes;

-- Delete design furniture
DELETE FROM design_furniture;

-- Delete design walls
DELETE FROM design_walls;

-- Delete design rooms
DELETE FROM design_rooms;

-- Delete design projects
DELETE FROM design_projects;

-- Delete designer projects earnings
DELETE FROM designer_projects_earnings;

-- Delete review responses
DELETE FROM review_responses;

-- Delete review votes
DELETE FROM review_votes;

-- Delete reviews
DELETE FROM reviews;

-- Delete project versions
DELETE FROM project_versions;

-- Delete project updates
DELETE FROM project_updates;

-- Delete project team members
DELETE FROM project_team_members;

-- Delete project shares
DELETE FROM project_shares;

-- Delete project assignments
DELETE FROM project_assignments;

-- Delete project activities
DELETE FROM project_activities;

-- Delete all customer project records
DELETE FROM customers;
