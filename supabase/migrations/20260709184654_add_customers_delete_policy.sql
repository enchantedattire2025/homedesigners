/*
# Add DELETE policy on customers table

## Problem
Customers cannot delete their own projects because no DELETE RLS policy exists on the
`customers` table. Supabase RLS silently blocks the operation — the delete call returns
no error but no rows are removed, so the record reappears after a page refresh.

## Changes
- Adds a single DELETE policy "Customers can delete own projects" scoped to the
  `authenticated` role. The USING clause restricts deletion to rows where the
  `user_id` column matches the currently signed-in user (`auth.uid()`), ensuring a
  customer can only delete their own projects and cannot delete another customer's record.

## Security
- Policy is `TO authenticated` only — anonymous users cannot delete any rows.
- Ownership is enforced via `auth.uid() = user_id`.
- No change to INSERT / SELECT / UPDATE policies.
*/

DROP POLICY IF EXISTS "Customers can delete own projects" ON customers;
CREATE POLICY "Customers can delete own projects"
ON customers FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
