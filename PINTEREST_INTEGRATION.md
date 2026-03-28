# Pinterest Integration for 3D Wallpapers

This guide explains how to add Pinterest images (or images from any source) to your 3D wallpaper gallery.

## Features

The admin panel now supports two methods for adding wallpaper images:

1. **Upload Image** - Upload images directly from your computer
2. **Use Image URL** - Import images from Pinterest, Unsplash, Pexels, or any image URL

## How to Add Pinterest Images

### Step 1: Find Images on Pinterest

1. Go to [Pinterest.com](https://pinterest.com)
2. Search for "3D home interior wallpaper" or specific categories like:
   - "3D geometric wallpaper interior"
   - "3D nature wallpaper home"
   - "3D luxury wallpaper bedroom"
   - "3D modern wallpaper living room"
   - "3D floral wallpaper designs"

### Step 2: Get the Image URL

1. Click on the Pinterest image to open it
2. Right-click on the image
3. Select **"Open image in new tab"**
4. Copy the full URL from the browser address bar (should look like `https://i.pinimg.com/...`)

### Step 3: Add to Your Gallery

1. Go to Admin Dashboard > 3D Wallpaper Management
2. Click **"Add Wallpaper"**
3. Select the **"Use Image URL"** tab
4. Paste the Pinterest image URL
5. Click **"Preview Image"** to verify it loads correctly
6. Fill in:
   - **Title**: Descriptive name (e.g., "Elegant Gold 3D Geometric Pattern")
   - **Description**: Brief details about the design
   - **Category**: Choose from available categories
   - **Active**: Check to make it visible in the gallery
7. Click **"Add Wallpaper"**

## Supported Image Sources

- **Pinterest** (i.pinimg.com)
- **Unsplash** (images.unsplash.com)
- **Pexels** (images.pexels.com)
- Any direct image URL (must end in .jpg, .png, .webp, etc.)

## Categories Available

- Geometric
- Nature
- Luxury
- Modern
- Floral
- Industrial
- Texture
- Abstract
- Wood
- Zen
- Space
- Urban

## Search Keywords for Pinterest

Use these keywords to find high-quality 3D interior wallpaper images:

- "3D wallpaper home interior"
- "3D geometric pattern wallpaper"
- "luxury 3D wall design"
- "modern 3D wallpaper living room"
- "3D nature wallpaper bedroom"
- "textured 3D wall panels"
- "3D floral wallpaper design"
- "contemporary 3D wall art"

## Best Practices

1. **High Resolution**: Choose images with good resolution (at least 1000px wide)
2. **Clear View**: Select images that clearly show the wallpaper pattern
3. **Relevant Categories**: Match the image style to the appropriate category
4. **Descriptive Titles**: Use clear, descriptive titles for easy searching
5. **Active Status**: Only mark as active when ready to show to customers

## Customer Experience

When customers browse the 3D Wallpaper Gallery:
- They see all active wallpapers organized by category
- They can filter by category
- Clicking "Order Now" prefills the order form with the selected wallpaper details
- The wallpaper image is automatically added as a reference image

## Notes

- Images are stored by URL reference (no storage used for URL-based images)
- Images uploaded directly are stored in Supabase storage
- You can edit or delete wallpapers anytime from the admin panel
- Toggle active/inactive status without deleting
