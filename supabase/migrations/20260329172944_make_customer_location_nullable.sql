/*
  # Make customers.location column nullable
  
  ## Summary
  The location field in customers table should be nullable since not all customer records 
  require location data (e.g., wallpaper orders only need delivery address).
  
  ## Changes
  - Alter customers table to make location column nullable
  - This allows customers to be created without project-related location data
  
  ## Notes
  - Location is required for project registrations but not for other customer interactions
  - Existing data is preserved
*/

-- Make location column nullable
ALTER TABLE customers 
  ALTER COLUMN location DROP NOT NULL;

-- Also make other project-related fields nullable since they're only needed for project registrations
ALTER TABLE customers 
  ALTER COLUMN project_name DROP NOT NULL,
  ALTER COLUMN property_type DROP NOT NULL,
  ALTER COLUMN budget_range DROP NOT NULL,
  ALTER COLUMN timeline DROP NOT NULL,
  ALTER COLUMN requirements DROP NOT NULL;