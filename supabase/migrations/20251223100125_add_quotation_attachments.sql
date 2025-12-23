/*
  # Add File Attachments to Designer Quotes

  ## Overview
  This migration adds file attachment support to the designer_quotes table to allow:
  1. Designers to attach quotation PDF files
  2. Customers to attach payment transaction receipts when accepting quotes

  ## Changes
  
  1. New Columns
    - `quotation_file_url` (text) - URL to the quotation PDF file uploaded by designer
    - `payment_receipt_url` (text) - URL to the payment receipt uploaded by customer on acceptance
  
  2. Security
    - No RLS changes needed as existing policies cover these fields
    - Files will be stored in Supabase Storage with appropriate access controls
  
  ## Notes
  - Files will be stored in a new storage bucket called 'quotation-attachments'
  - File URLs will reference the Supabase Storage location
  - Both fields are nullable as attachments are optional
*/

-- Add quotation file attachment columns
ALTER TABLE designer_quotes 
ADD COLUMN IF NOT EXISTS quotation_file_url text,
ADD COLUMN IF NOT EXISTS payment_receipt_url text;

-- Add helpful comments
COMMENT ON COLUMN designer_quotes.quotation_file_url IS 'URL to the quotation PDF or document file uploaded by the designer';
COMMENT ON COLUMN designer_quotes.payment_receipt_url IS 'URL to the payment transaction receipt uploaded by customer when accepting the quote';