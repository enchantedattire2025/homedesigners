/*
  # Add Project Dates and Discount Fields

  1. New Fields
    - `work_begin_date` (timestamptz) - Date when work begins on the project
    - `work_end_date` (timestamptz) - Date when work ends (set when status moves to 'finalized')
    - `per_day_discount` (numeric) - Per day discount amount, only editable by designer

  2. Changes
    - Add three new columns to customers table
    - Add default values where appropriate

  3. Notes
    - work_begin_date: Can be set by designer when work starts
    - work_end_date: Automatically set when project moves to 'finalized' status
    - per_day_discount: Only designer can set this value, customer can view
*/

-- Add work begin date field
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS work_begin_date timestamptz;

-- Add work end date field
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS work_end_date timestamptz;

-- Add per day discount field
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS per_day_discount numeric(10, 2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN customers.work_begin_date IS 'Date when work begins on the project, set by designer';
COMMENT ON COLUMN customers.work_end_date IS 'Date when work ends, automatically set when status moves to finalized';
COMMENT ON COLUMN customers.per_day_discount IS 'Per day discount amount in rupees, only editable by designer';
