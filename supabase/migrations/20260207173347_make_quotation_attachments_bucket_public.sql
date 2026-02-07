/*
  # Make Quotation Attachments Bucket Public

  ## Overview
  Makes the quotation-attachments bucket public so that design images can be
  viewed by customers when reviewing quotations without authentication issues.

  ## Changes
  
  1. Updates quotation-attachments bucket to be public
  
  ## Security
  - Files are still protected by folder structure
  - Only users with the URL can access files
  - RLS policies still control who can upload/delete
  
  ## Notes
  - Design images attached to quotations need to be publicly accessible
  - Customers viewing quotes need to see the design images
*/

-- Make the quotation-attachments bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'quotation-attachments';