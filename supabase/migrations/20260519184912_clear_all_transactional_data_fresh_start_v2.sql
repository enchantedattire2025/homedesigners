/*
  # Clear All Transactional Data - Fresh Start v2

  Deletes all project, quotation, and related transactional data.
  Skips views (accepted_quotes, customer_quotes_with_items, designer_assigned_projects).

  Preserved:
  - designers, admin_users, customers (user accounts)
  - site_settings, subscription_plans, material_pricing_master, wallpapers_3d
  - whatsapp_settings, designer_subscriptions, designer_material_prices
*/

-- Bill details
DELETE FROM bill_items;
DELETE FROM bill_versions;
DELETE FROM project_bills;

-- Project tracking
DELETE FROM project_activities;
DELETE FROM project_updates;
DELETE FROM project_versions;
DELETE FROM project_images;
DELETE FROM project_designs;
DELETE FROM project_shares;
DELETE FROM project_team_members;

-- Quotes (quote_acceptance_history and accepted_quotes are views, skip them)
DELETE FROM quote_items;
DELETE FROM quote_acceptance_history;
DELETE FROM designer_quotes;

-- Project assignments & earnings
DELETE FROM designer_projects_earnings;
DELETE FROM project_assignments;

-- Reviews
DELETE FROM review_votes;
DELETE FROM review_responses;
DELETE FROM reviews;

-- Notifications & logs
DELETE FROM notifications;
DELETE FROM email_notifications;
DELETE FROM whatsapp_notification_logs;

-- Vastu
DELETE FROM vastu_recommendations;
DELETE FROM vastu_analyses;

-- Chat
DELETE FROM chat_messages;
DELETE FROM chat_conversations;

-- Deals
DELETE FROM deal_redemptions;

-- Gallery
DELETE FROM shared_gallery_items;

-- Subscriptions transactional data
DELETE FROM subscription_payments;
DELETE FROM subscription_usage_tracking;

-- Wallpaper orders
DELETE FROM wallpaper_orders;

-- Design tool projects
DELETE FROM design_furniture;
DELETE FROM design_walls;
DELETE FROM design_rooms;
DELETE FROM design_projects;

-- Customer notification preferences
DELETE FROM customer_notification_preferences;
