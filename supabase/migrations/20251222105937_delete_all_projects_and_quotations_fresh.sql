/*
  # Delete All Projects and Quotations Data

  1. Purpose
    - Clear all project and quotation data for fresh testing
    - Deletes data in correct order to avoid foreign key constraint issues

  2. Tables Affected
    - quote_acceptance_history (if exists)
    - quote_items
    - designer_quotes
    - project_versions
    - project_activities
    - project_assignments
    - customers (projects)

  3. Note
    - This does NOT delete user accounts, designers, or admin data
    - Only deletes project and quotation related data
*/

-- Delete quote acceptance history
DELETE FROM quote_acceptance_history;

-- Delete quote items
DELETE FROM quote_items;

-- Delete designer quotes
DELETE FROM designer_quotes;

-- Delete project versions
DELETE FROM project_versions;

-- Delete project activities
DELETE FROM project_activities;

-- Delete project assignments
DELETE FROM project_assignments;

-- Delete customer projects
DELETE FROM customers;
