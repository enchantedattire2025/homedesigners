# Admin 3D Wallpaper - Debugging Guide

The Admin 3D Wallpaper page now has enhanced debugging. Follow these steps to identify and fix any issues.

## Step 1: Check Browser Console

1. Open the Admin 3D Wallpaper page (`/admin/3d-wallpapers`)
2. Open browser Developer Tools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Look for these debug messages:

### Expected Console Messages

**On page load:**
```
Admin3DWallpapers - Auth check: { hasUser: true, isAdmin: true, userId: "..." }
Admin authorized, fetching wallpapers
Fetching wallpapers...
Wallpapers fetched: [...]
```

**When adding a wallpaper:**
```
Uploading image: { fileName: "...", fileSize: ... }
Image uploaded successfully: https://...
Submitting wallpaper...
Saving wallpaper data: { title: "...", ... }
Wallpaper added successfully!
```

## Step 2: Common Issues and Solutions

### Issue 1: "Not authorized, redirecting to admin login"

**Problem:** You're not logged in as an admin

**Solution:**
1. Go to `/admin-login`
2. Sign in with your admin credentials
3. Verify your email exists in the `admin_users` table:
   ```sql
   SELECT * FROM admin_users WHERE email = 'your-email@example.com';
   ```

### Issue 2: "Failed to load wallpapers: [error message]"

**Problem:** RLS policy or table access issue

**Check these:**
1. Verify RLS policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'wallpapers_3d';
   ```

2. Verify you're in admin_users table:
   ```sql
   SELECT au.*, u.email
   FROM admin_users au
   JOIN auth.users u ON u.id = au.user_id
   WHERE u.email = 'your-email@example.com';
   ```

3. Test direct access:
   ```sql
   SELECT * FROM wallpapers_3d LIMIT 1;
   ```

### Issue 3: "Upload error: [error message]"

**Problem:** Storage bucket not configured or permissions issue

**Check these:**

1. **Verify bucket exists:**
   - Go to Supabase Dashboard → Storage
   - Look for `wallpaper-images` bucket
   - If missing, create it with these settings:
     - Name: `wallpaper-images`
     - Public: ✓ Enabled
     - File size limit: 50MB
     - Allowed MIME types: Leave empty or add image types

2. **Test upload manually:**
   - In Supabase Dashboard → Storage → wallpaper-images
   - Try uploading an image manually
   - If it fails, check storage policies

3. **Verify storage policies:**
   Storage policies are managed in Supabase Dashboard → Storage → Policies

   You should have policies that allow:
   - Public SELECT (anyone can view)
   - Admin INSERT (admins can upload)
   - Admin UPDATE (admins can update)
   - Admin DELETE (admins can delete)

### Issue 4: "Insert error: new row violates row-level security policy"

**Problem:** RLS policy blocking insert

**Solution:**
Run this to check and fix RLS policies:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'wallpapers_3d';

-- If policies are missing, they should have been created by the migration
-- Verify the migration ran successfully:
SELECT * FROM supabase_migrations.schema_migrations
WHERE name LIKE '%wallpaper%'
ORDER BY created_at DESC;
```

### Issue 5: Page loads but is blank/empty

**Problem:** React render issue or infinite redirect

**Check console for:**
- Any React errors
- Repeated "Not authorized, redirecting" messages (infinite loop)
- Network errors

**Solution:**
1. Clear browser cache and localStorage
2. Log out and log back in as admin
3. Check that `/admin-login` route works

## Step 3: Manual Testing Checklist

Test each function:

- [ ] Page loads without errors
- [ ] Can see "Add Wallpaper" button
- [ ] Clicking "Add Wallpaper" opens modal
- [ ] Can select an image file
- [ ] Image preview appears
- [ ] Can fill in title, description, category
- [ ] Can submit form
- [ ] Wallpaper appears in list after submission
- [ ] Can toggle active/inactive status
- [ ] Can edit existing wallpaper
- [ ] Can delete wallpaper

## Step 4: Database Verification

Run these queries to verify everything is set up correctly:

```sql
-- 1. Check if wallpapers_3d table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'wallpapers_3d'
);

-- 2. Check table structure
\d wallpapers_3d

-- 3. Check if you have admin access
SELECT EXISTS (
  SELECT 1 FROM admin_users
  WHERE user_id = auth.uid()
);

-- 4. Try to insert a test record
INSERT INTO wallpapers_3d (
  title,
  description,
  image_url,
  category,
  is_active,
  created_by
) VALUES (
  'Test Wallpaper',
  'Test Description',
  'https://via.placeholder.com/800x600',
  'Geometric',
  true,
  auth.uid()
);

-- 5. Try to select it back
SELECT * FROM wallpapers_3d ORDER BY created_at DESC LIMIT 1;

-- 6. Clean up test record
DELETE FROM wallpapers_3d WHERE title = 'Test Wallpaper';
```

## Step 5: Network Tab Debugging

1. Open Developer Tools → Network tab
2. Try to add a wallpaper
3. Look for these requests:
   - POST to `/rest/v1/wallpapers_3d` (database insert)
   - POST to `/storage/v1/object/wallpaper-images/...` (image upload)

4. Check request details:
   - Status code (should be 200 or 201)
   - Response body (look for error messages)
   - Request headers (verify auth token is included)

## Step 6: Contact Information

If none of the above works, provide this information:

1. **Console logs** when loading the page
2. **Error message** from any alert
3. **Network request** that's failing (from Network tab)
4. **Browser and version** you're using
5. Screenshot of the browser console with errors

## Quick Fix Script

Run this in Supabase SQL Editor to reset everything:

```sql
-- Verify admin user exists
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO v_user_id;

  -- Insert admin if not exists
  INSERT INTO admin_users (user_id, email, role, permissions)
  SELECT
    v_user_id,
    u.email,
    'admin',
    '{"manage_deals": true, "manage_users": true, "view_earnings": true, "manage_designers": true}'::jsonb
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin user verified/created';
END $$;

-- Verify RLS is enabled
ALTER TABLE wallpapers_3d ENABLE ROW LEVEL SECURITY;

-- Test access
SELECT
  (SELECT COUNT(*) FROM wallpapers_3d) as wallpaper_count,
  (SELECT COUNT(*) FROM admin_users WHERE user_id = auth.uid()) as is_admin;
```
