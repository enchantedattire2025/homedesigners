/*
  # Add Admin Notifications for 3D Wallpaper Orders

  1. Changes
    - Create trigger function to notify all admins when a new wallpaper order is placed
    - Sends notification to all admin users with order details
    - Includes customer info, wall dimensions, wallpaper type, and total amount

  2. Security
    - Uses existing notification system
    - SECURITY DEFINER ensures proper permissions
    - Notifies all active admin users

  3. Important Notes
    - Notification sent immediately when order is inserted
    - Admins receive in-app notification with order reference
    - Can be viewed in admin dashboard notification bell
*/

-- Trigger function: Notify admins when new 3D wallpaper order is placed
CREATE OR REPLACE FUNCTION notify_admins_on_wallpaper_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_record RECORD;
  v_wallpaper_type_display text;
BEGIN
  -- Convert wallpaper type to display format
  IF NEW.wallpaper_type = 'golden_foil' THEN
    v_wallpaper_type_display := 'Golden Foil 3D Wallpaper';
  ELSE
    v_wallpaper_type_display := 'Normal 3D Wallpaper';
  END IF;

  -- Loop through all admin users and create notification for each
  FOR v_admin_record IN
    SELECT user_id FROM admin_users
  LOOP
    -- Create in-app notification for admin
    PERFORM create_notification(
      v_admin_record.user_id,
      'admin',
      'New 3D Wallpaper Order',
      'New order from ' || NEW.customer_name || ' - ' || v_wallpaper_type_display ||
      ' (' || NEW.total_area_sqft || ' sq ft, ₹' || NEW.total_amount || ')',
      'wallpaper_order_new',
      NEW.id,
      'wallpaper_order'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new wallpaper orders
DROP TRIGGER IF EXISTS trigger_notify_admins_on_wallpaper_order ON wallpaper_orders;

CREATE TRIGGER trigger_notify_admins_on_wallpaper_order
AFTER INSERT ON wallpaper_orders
FOR EACH ROW
EXECUTE FUNCTION notify_admins_on_wallpaper_order();