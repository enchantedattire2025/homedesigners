# Storage Bucket Setup Guide

## 3D Wallpaper Images Storage Bucket

The Admin 3D Wallpapers management system requires a storage bucket to be created in Supabase.

### Setup Steps

1. **Go to Supabase Dashboard**
   - Navigate to your project in Supabase
   - Go to Storage section in the left sidebar

2. **Create New Bucket**
   - Click "New bucket"
   - Bucket name: `wallpaper-images`
   - Make it **Public** (check the "Public bucket" option)
   - Click "Create bucket"

3. **Configure Bucket Policies**

   The bucket should be set as **public** so images can be accessed without authentication.

   After creating the bucket, verify the following policies are in place:

   **For SELECT (Read):**
   - Public access enabled (anyone can view images)

   **For INSERT/UPDATE/DELETE:**
   - Only admins can upload, update, or delete images
   - This is handled by the application logic and admin authentication

4. **Verify Setup**
   - Go to the Storage section in Supabase Dashboard
   - Click on `wallpaper-images` bucket
   - Verify it shows as "Public"
   - Try uploading a test image through the admin panel

### Usage in Application

Once the bucket is created, admins can:
- Upload 3D wallpaper images
- Edit wallpaper details
- Delete wallpapers
- Toggle visibility (active/inactive)

The images will be publicly accessible at URLs like:
```
https://[your-project].supabase.co/storage/v1/object/public/wallpaper-images/[filename]
```

### Troubleshooting

**Issue: "Failed to save wallpaper" error**
- Check if the `wallpaper-images` bucket exists
- Verify the bucket is set to Public
- Ensure you're logged in as an admin

**Issue: Images not displaying**
- Verify the bucket is Public
- Check image URLs in the database
- Ensure images were uploaded successfully

**Issue: "Permission denied" when uploading**
- Verify you're logged in as an admin
- Check that your user exists in the `admin_users` table
- Refresh your browser session

### Database Table

The wallpapers are stored in the `wallpapers_3d` table with:
- `id` - Unique identifier
- `title` - Wallpaper title
- `description` - Optional description
- `image_url` - URL to the image in storage
- `category` - Category (Geometric, Nature, Luxury, etc.)
- `is_active` - Whether visible in gallery
- `created_by` - Admin user who created it
- `created_at` - Creation timestamp

### Security

- RLS policies ensure only admins can manage wallpapers
- Public users can view active wallpapers in the gallery
- Images are stored in a public bucket for fast access
- Admin authentication is verified before any modifications
