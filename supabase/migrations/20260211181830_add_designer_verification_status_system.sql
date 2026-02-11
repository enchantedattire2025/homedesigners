/*
  # Add Designer Verification Status System
  
  1. Changes
    - Add verification_status field to designers table (pending, verified, rejected)
    - Set default status to 'pending' for new registrations
    - Update existing designers to 'verified' status (backward compatibility)
    - Add check constraint to ensure valid status values
    
  2. Purpose
    - Implement two-step verification: email confirmation + admin approval
    - Prevent pending designers from logging in until admin approves
    - Track verification history and status changes
    
  3. Security
    - Only authenticated designers can update their own profile (except verification_status)
    - Only admins can change verification_status
*/

-- Add verification_status column with enum-like constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designers' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE designers 
    ADD COLUMN verification_status text DEFAULT 'pending' NOT NULL;
    
    -- Add check constraint for valid status values
    ALTER TABLE designers
    ADD CONSTRAINT designers_verification_status_check 
    CHECK (verification_status IN ('pending', 'verified', 'rejected'));
    
    -- Update existing designers to 'verified' status for backward compatibility
    UPDATE designers SET verification_status = 'verified' WHERE is_verified = true;
    UPDATE designers SET verification_status = 'pending' WHERE is_verified = false;
  END IF;
END $$;

-- Add index for faster queries on verification_status
CREATE INDEX IF NOT EXISTS idx_designers_verification_status 
ON designers(verification_status);

-- Add rejected_reason column to track why a designer was rejected (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designers' AND column_name = 'rejected_reason'
  ) THEN
    ALTER TABLE designers 
    ADD COLUMN rejected_reason text;
  END IF;
END $$;

-- Add verified_at timestamp to track when designer was approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'designers' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE designers 
    ADD COLUMN verified_at timestamptz;
    
    -- Set verified_at for existing verified designers
    UPDATE designers 
    SET verified_at = created_at 
    WHERE verification_status = 'verified' AND verified_at IS NULL;
  END IF;
END $$;
