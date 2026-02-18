/*
  # Insert Default Master Material Pricing Data
  
  ## Summary
  This migration populates the material_pricing_master table with comprehensive
  default materials covering all essential categories for interior design work.
  These materials will be automatically assigned to all new designers upon registration.

  ## Material Categories Covered
  1. **Plywood & Boards** - Marine plywood, commercial ply, MDF, particle board
  2. **Hardware** - Hinges, drawer channels, handles, locks, accessories
  3. **Channels & Profiles** - Aluminum profiles, edge banding, trims
  4. **Laminates & Veneers** - HPL, acrylic laminates, wood veneers
  5. **Countertops** - Granite, quartz, marble, solid surfaces
  6. **Flooring** - Tiles, wooden flooring, vinyl, carpet
  7. **Lighting** - LED panels, strip lights, spotlights, decorative fixtures
  8. **Paints & Finishes** - Emulsion, enamel, PU polish, wood stains
  9. **Fabrics & Upholstery** - Curtains, blinds, upholstery materials
  10. **Accessories** - Mirrors, glass, decorative items

  ## Pricing Philosophy
  - Prices are realistic base rates for Indian market (INR)
  - Include mix of Budget, Standard, Premium, and Luxury options
  - Designers can customize prices based on their vendor relationships
  - All materials set to active status for auto-assignment

  ## Important Notes
  - These are TEMPLATE materials that get copied to each new designer
  - Designers can modify their personal copies without affecting master data
  - Use idempotent INSERT with ON CONFLICT to prevent duplicates
*/

-- Insert default material pricing data
INSERT INTO material_pricing_master (category, name, description, unit, base_price, brand, quality_grade, is_active)
VALUES
  -- Plywood & Boards (8 items)
  ('Plywood & Boards', 'Marine Plywood - 18mm', 'Boiling Water Proof (BWP) grade plywood with phenolic resin, ideal for moisture-prone areas like kitchens and bathrooms', 'sq.ft', 115.00, 'Century Ply', 'Premium', true),
  ('Plywood & Boards', 'Commercial Plywood - 18mm', 'MR grade (Moisture Resistant) plywood suitable for general furniture and interiors', 'sq.ft', 85.00, 'Greenply', 'Standard', true),
  ('Plywood & Boards', 'BWR Plywood - 18mm', 'Boiling Water Resistant grade, good balance between marine and commercial ply', 'sq.ft', 95.00, 'Century Ply', 'Standard', true),
  ('Plywood & Boards', 'MDF Board - 18mm', 'Medium Density Fiberboard, smooth surface ideal for painted finishes', 'sq.ft', 52.00, 'Greenpanel', 'Budget', true),
  ('Plywood & Boards', 'Particle Board - 18mm', 'Pre-laminated particle board for economical furniture solutions', 'sq.ft', 38.00, 'Greenpanel', 'Budget', true),
  ('Plywood & Boards', 'HDHMR Board - 18mm', 'High Density High Moisture Resistant board, termite and borer proof', 'sq.ft', 68.00, 'Greenpanel', 'Standard', true),
  ('Plywood & Boards', 'Premium Hardwood Ply - 18mm', 'Imported hardwood plywood with superior finish and durability', 'sq.ft', 145.00, 'Nudo', 'Luxury', true),
  ('Plywood & Boards', 'Block Board - 18mm', 'Strong core board made of wooden strips, ideal for long spans', 'sq.ft', 72.00, 'Century Ply', 'Standard', true),

  -- Hardware (10 items)
  ('Hardware', 'Soft Close Cabinet Hinges', 'Hydraulic hinges with soft-close mechanism, 110-degree opening', 'per piece', 320.00, 'Hettich', 'Premium', true),
  ('Hardware', 'Standard Cabinet Hinges', 'Regular cup hinges for cabinet doors', 'per piece', 45.00, 'Ebco', 'Budget', true),
  ('Hardware', 'Soft Close Drawer Channel - 18 inch', 'Telescopic drawer channel with soft-close feature, 35kg capacity', 'per piece', 580.00, 'Hettich', 'Premium', true),
  ('Hardware', 'Ball Bearing Drawer Channel - 18 inch', 'Heavy duty drawer slides with ball bearings', 'per piece', 220.00, 'Ebco', 'Standard', true),
  ('Hardware', 'Kitchen Cabinet Handles', 'Aluminum profile handles for modern kitchens', 'per piece', 180.00, 'Hafele', 'Standard', true),
  ('Hardware', 'Designer Cabinet Handles', 'Premium brass or steel designer handles', 'per piece', 450.00, 'Hafele', 'Premium', true),
  ('Hardware', 'Door Locks - Mortise', 'Heavy duty mortise lock for main doors', 'per piece', 850.00, 'Godrej', 'Standard', true),
  ('Hardware', 'Concealed Door Closer', 'Hydraulic concealed door closer mechanism', 'per piece', 1250.00, 'Dorma', 'Premium', true),
  ('Hardware', 'Tower Bolt', 'Stainless steel tower bolt for doors and windows', 'per piece', 85.00, 'Godrej', 'Budget', true),
  ('Hardware', 'Gas Lift Support', 'Hydraulic lift support for overhead cabinets', 'per piece', 650.00, 'Hafele', 'Premium', true),

  -- Channels & Profiles (4 items)
  ('Channels & Profiles', 'Aluminum Profile - J Channel', 'Anodized aluminum J-profile for panel edging', 'per meter', 180.00, 'Alstone', 'Standard', true),
  ('Channels & Profiles', 'Aluminum Profile - C Channel', 'C-channel for glass partitions and cabinet frames', 'per meter', 220.00, 'Alstone', 'Standard', true),
  ('Channels & Profiles', 'PVC Edge Band - 1mm', 'PVC edge banding tape for laminated boards', 'per meter', 12.00, 'Rehau', 'Standard', true),
  ('Channels & Profiles', 'Aluminum Skirting Profile', 'Decorative aluminum skirting for wall-floor junction', 'per meter', 285.00, 'Alstone', 'Premium', true),

  -- Laminates & Veneers (5 items)
  ('Laminates & Veneers', 'High Pressure Laminate (HPL) - 1mm', 'Durable decorative laminate for surfaces, wide range of designs', 'sq.ft', 72.00, 'Merino', 'Standard', true),
  ('Laminates & Veneers', 'Premium HPL - 1mm', 'Designer collection laminates with special textures', 'sq.ft', 95.00, 'Greenlam', 'Premium', true),
  ('Laminates & Veneers', 'Acrylic Laminate - High Gloss', 'High gloss acrylic finish laminate for premium look', 'sq.ft', 145.00, 'Merino', 'Luxury', true),
  ('Laminates & Veneers', 'Natural Wood Veneer', 'Real wood veneer sheets for natural wood finish', 'sq.ft', 185.00, 'Century Veneers', 'Premium', true),
  ('Laminates & Veneers', 'Exterior Grade Laminate - 1mm', 'Weather resistant laminate for outdoor applications', 'sq.ft', 115.00, 'Greenlam', 'Premium', true),

  -- Countertops (5 items)
  ('Countertops', 'Granite Countertop - 20mm', 'Natural granite stone for kitchen countertops, includes polishing', 'sq.ft', 180.00, 'Indian Granite', 'Standard', true),
  ('Countertops', 'Imported Granite - 20mm', 'Premium imported granite with unique patterns', 'sq.ft', 320.00, 'Imported', 'Premium', true),
  ('Countertops', 'Quartz Countertop - 20mm', 'Engineered quartz surface, non-porous and stain resistant', 'sq.ft', 420.00, 'Caesarstone', 'Luxury', true),
  ('Countertops', 'Marble Countertop - 20mm', 'Natural marble surface, classic elegance', 'sq.ft', 280.00, 'Indian Marble', 'Premium', true),
  ('Countertops', 'Solid Surface - Corian', 'Seamless acrylic solid surface material', 'sq.ft', 550.00, 'Corian', 'Luxury', true),

  -- Flooring (6 items)
  ('Flooring', 'Vitrified Tiles - 2x2 feet', 'Polished vitrified tiles for floors', 'sq.ft', 58.00, 'Kajaria', 'Standard', true),
  ('Flooring', 'Wooden Flooring - Laminate', 'AC3 rated laminate wooden flooring', 'sq.ft', 95.00, 'Pergo', 'Standard', true),
  ('Flooring', 'Engineered Wood Flooring', 'Real wood top layer on engineered base', 'sq.ft', 185.00, 'QuickStep', 'Premium', true),
  ('Flooring', 'Italian Marble - 2x2 feet', 'Premium imported marble tiles', 'sq.ft', 280.00, 'Imported', 'Luxury', true),
  ('Flooring', 'Vinyl Flooring - SPC', 'Stone Plastic Composite vinyl flooring, waterproof', 'sq.ft', 72.00, 'Armstrong', 'Standard', true),
  ('Flooring', 'Carpet Tiles', 'Modular carpet tiles for offices and bedrooms', 'sq.ft', 45.00, 'Interface', 'Budget', true),

  -- Lighting (5 items)
  ('Lighting', 'LED Panel Light - 2x2 feet', 'Surface mounted LED panel, 36W, 6500K cool white', 'per piece', 850.00, 'Philips', 'Standard', true),
  ('Lighting', 'LED Strip Light - 5 meter', 'Flexible LED strip, 12V, warm white, with driver', 'per roll', 1200.00, 'Philips', 'Standard', true),
  ('Lighting', 'COB Spotlight - 7W', 'Recessed COB LED spotlight, adjustable', 'per piece', 420.00, 'Philips', 'Standard', true),
  ('Lighting', 'Designer Pendant Light', 'Decorative hanging pendant light', 'per piece', 2500.00, 'Havells', 'Premium', true),
  ('Lighting', 'Under Cabinet LED Light', 'Slim profile LED bar for under cabinet lighting', 'per piece', 650.00, 'Philips', 'Standard', true),

  -- Paints & Finishes (5 items)
  ('Paints & Finishes', 'Premium Emulsion Paint', 'Interior wall paint with smooth finish', 'per liter', 380.00, 'Asian Paints', 'Standard', true),
  ('Paints & Finishes', 'Luxury Emulsion Paint', 'Premium silk finish wall paint with washability', 'per liter', 620.00, 'Asian Paints', 'Premium', true),
  ('Paints & Finishes', 'Enamel Paint', 'High gloss enamel for wood and metal surfaces', 'per liter', 420.00, 'Berger', 'Standard', true),
  ('Paints & Finishes', 'PU Wood Polish', 'Polyurethane wood polish for furniture', 'per liter', 850.00, 'ICA', 'Premium', true),
  ('Paints & Finishes', 'Wood Stain', 'Oil-based wood stain for natural wood enhancement', 'per liter', 380.00, 'ICA', 'Standard', true),

  -- Fabrics & Upholstery (3 items)
  ('Fabrics & Upholstery', 'Blackout Curtain Fabric', 'Light blocking fabric for curtains', 'per meter', 280.00, 'D''Decor', 'Standard', true),
  ('Fabrics & Upholstery', 'Roller Blinds - Sunscreen', 'Sunscreen roller blinds fabric', 'sq.ft', 45.00, 'Louvolite', 'Standard', true),
  ('Fabrics & Upholstery', 'Premium Upholstery Fabric', 'Durable fabric for sofa and chair upholstery', 'per meter', 550.00, 'Warwick', 'Premium', true),

  -- Accessories (4 items)
  ('Accessories', 'Clear Glass - 5mm', 'Clear float glass for windows and partitions', 'sq.ft', 65.00, 'Saint Gobain', 'Standard', true),
  ('Accessories', 'Tinted Glass - 5mm', 'Bronze or grey tinted glass', 'sq.ft', 85.00, 'Saint Gobain', 'Standard', true),
  ('Accessories', 'Designer Mirror - 5mm', 'Silver mirror with safety backing', 'sq.ft', 72.00, 'Saint Gobain', 'Standard', true),
  ('Accessories', 'Wall Panels - 3D Decorative', 'MDF/WPC based decorative wall panels', 'per piece', 1200.00, 'Various', 'Premium', true)

ON CONFLICT (category, name) DO NOTHING;
