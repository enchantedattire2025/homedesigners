/*
  # Enable Realtime for Activity and Version Tracking
  
  1. Changes
    - Enable realtime for project_activities table
    - Enable realtime for project_versions table
    - Enable realtime for project_assignments table
    
  2. Purpose
    - Allows real-time updates in the UI when activities, versions, or assignments change
    - Improves user experience with instant feedback
*/

-- Enable realtime for activity tracking tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE project_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE project_assignments;
