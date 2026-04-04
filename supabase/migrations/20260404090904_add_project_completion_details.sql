/*
  # Add Project Completion Details Fields

  1. Changes
    - Add `challenges_solutions` (text) - Details about challenges faced and solutions implemented
    - Add `project_timeline_details` (text) - Detailed timeline of project execution
    - Add `materials_cost_breakdown` (text) - Breakdown of materials used and costs

  2. Notes
    - These fields are required when a project status is set to 'completed'
    - This information will be visible to all users once the project is completed
    - Helps provide transparency and educational value to potential customers
*/

-- Add new fields to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'challenges_solutions'
  ) THEN
    ALTER TABLE customers ADD COLUMN challenges_solutions text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'project_timeline_details'
  ) THEN
    ALTER TABLE customers ADD COLUMN project_timeline_details text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'materials_cost_breakdown'
  ) THEN
    ALTER TABLE customers ADD COLUMN materials_cost_breakdown text;
  END IF;
END $$;