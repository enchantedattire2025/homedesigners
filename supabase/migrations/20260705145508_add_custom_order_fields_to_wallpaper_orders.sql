ALTER TABLE wallpaper_orders
  ADD COLUMN IF NOT EXISTS is_custom_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_design_description text,
  ADD COLUMN IF NOT EXISTS custom_design_style text,
  ADD COLUMN IF NOT EXISTS custom_color_preferences text;
