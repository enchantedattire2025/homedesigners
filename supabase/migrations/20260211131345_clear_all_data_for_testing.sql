/*
  # Clear All Data for Fresh Testing
  
  1. Purpose
    - Remove all projects, quotations, and gallery data for fresh testing
    - Preserves user accounts (designers, customers, admins)
    - Preserves system configuration (subscription plans, site settings)
    - Preserves chatbot knowledge and conversations
    
  2. Tables Cleared (in order respecting foreign key constraints)
    
    **Vastu Analysis Data:**
    - vastu_recommendations (child of vastu_analyses)
    - vastu_analyses
    
    **Quotation Data:**
    - quote_items (child of designer_quotes)
    - quote_acceptance_history (child of designer_quotes)
    - designer_quotes
    
    **Project-Related Data:**
    - project_designs
    - project_activities
    - project_versions
    - project_updates
    - project_team_members
    - project_assignments
    - project_shares
    
    **Review Data:**
    - review_responses (child of reviews)
    - review_votes (child of reviews)
    - reviews
    
    **Earnings Data:**
    - designer_projects_earnings
    
    **Design Tool Data:**
    - design_furniture (child of design_projects)
    - design_walls (child of design_projects)
    - design_rooms (child of design_projects)
    - design_projects
    
    **Gallery Data:**
    - shared_gallery_items
    
    **Projects (Main Table):**
    - customers (all project records)
    
  3. Preserved Data
    - User accounts (auth.users, designers, admin_users)
    - Subscription plans and designer subscriptions
    - Subscription usage tracking
    - Material pricing (designer_material_prices)
    - Designer deals
    - Chatbot knowledge and chat conversations
    - Site settings
    
  4. Security
    - No RLS changes, all security policies remain intact
    - Only data deletion, no schema changes
*/

-- Step 1: Delete Vastu Analysis Data
DELETE FROM vastu_recommendations;
DELETE FROM vastu_analyses;

-- Step 2: Delete Quotation Data
DELETE FROM quote_items;
DELETE FROM quote_acceptance_history;
DELETE FROM designer_quotes;

-- Step 3: Delete Project Design Data
DELETE FROM project_designs;

-- Step 4: Delete Project Activity and Version Tracking
DELETE FROM project_activities;
DELETE FROM project_versions;
DELETE FROM project_updates;

-- Step 5: Delete Project Team and Assignment Data
DELETE FROM project_team_members;
DELETE FROM project_assignments;
DELETE FROM project_shares;

-- Step 6: Delete Review Data
DELETE FROM review_responses;
DELETE FROM review_votes;
DELETE FROM reviews;

-- Step 7: Delete Earnings Data
DELETE FROM designer_projects_earnings;

-- Step 8: Delete Design Tool Data
DELETE FROM design_furniture;
DELETE FROM design_walls;
DELETE FROM design_rooms;
DELETE FROM design_projects;

-- Step 9: Delete Gallery Data
DELETE FROM shared_gallery_items;

-- Step 10: Delete All Projects (Main Table)
DELETE FROM customers;
