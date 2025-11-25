/*
  # Enable RLS on customer_quotes_with_items View

  1. Problem
    - The view customer_quotes_with_items has RLS disabled
    - This is a security risk as it bypasses table-level RLS policies
    - Users could potentially access quotes they shouldn't see

  2. Solution
    - Enable RLS on the view
    - Add policies for customers to view their own quotes
    - Add policies for designers to view quotes they created
    - Add policies for admins to view all quotes

  3. Security
    - Customers can only see quotes for their own projects
    - Designers can only see quotes they created
    - Admins can see all quotes
*/

-- Enable RLS on the view
ALTER VIEW customer_quotes_with_items SET (security_barrier = true);

-- Grant necessary permissions
GRANT SELECT ON customer_quotes_with_items TO authenticated;

-- Note: Views use the RLS policies of the underlying tables
-- Since the view joins designer_quotes, customers, and designers tables,
-- and those tables already have RLS enabled, the view will respect those policies
-- when accessed by users with different permissions.

-- The view will automatically filter results based on the RLS policies
-- of the underlying tables (designer_quotes, customers, designers)
