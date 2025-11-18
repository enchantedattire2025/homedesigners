/*
  # Fix Security Issues - Part 2: Enable RLS on Tables

  1. Changes
    - Enable RLS on tables that have policies but RLS is not enabled
    - Critical security fix to ensure policies are enforced
  
  2. Security
    - Enables row level security on admin_users, customers, designers, shared_gallery_items
    - Ensures existing policies are enforced
*/

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on designers table
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shared_gallery_items table
ALTER TABLE shared_gallery_items ENABLE ROW LEVEL SECURITY;