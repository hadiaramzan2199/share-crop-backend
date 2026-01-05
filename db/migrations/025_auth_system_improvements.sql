BEGIN;

-- ============================================
-- AUTHENTICATION SYSTEM IMPROVEMENTS
-- Migration: 025_auth_system_improvements.sql
-- Purpose: Fix security issues and add auth features
-- ============================================

-- 1. Fix user_type constraint to include 'admin' role
-- STEP 1: Drop existing constraint FIRST (before validating data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_user_type_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_user_type_check;
    RAISE NOTICE 'Dropped existing users_user_type_check constraint';
  END IF;
END$$;

-- STEP 2: Convert ALL user_type values to lowercase (fix case issues)
-- This ensures consistency regardless of current case
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Convert all user_type to lowercase (handles ADMIN, FARMER, BUYER, etc.)
  UPDATE users 
  SET user_type = LOWER(user_type)
  WHERE user_type IS NOT NULL 
    AND user_type != LOWER(user_type);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  IF updated_count > 0 THEN
    RAISE NOTICE 'Converted % user_type values to lowercase', updated_count;
  END IF;
  
  -- Fix NULL or empty values (default to 'buyer')
  UPDATE users 
  SET user_type = 'buyer' 
  WHERE user_type IS NULL OR user_type = '';
  
  -- Fix any other invalid values (default to 'buyer')
  UPDATE users 
  SET user_type = 'buyer'
  WHERE LOWER(user_type) NOT IN ('farmer', 'buyer', 'admin');
  
  RAISE NOTICE 'All user_type values normalized to lowercase';
END$$;

-- STEP 3: Add new constraint with 'admin' role included (after data is fixed)
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('farmer', 'buyer', 'admin'));

-- 2. Add UNIQUE constraint on email (critical for security)
-- First, handle any duplicate emails if they exist
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as cnt
    FROM users
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Warning: Found duplicate emails. Please clean them up before adding unique constraint.';
  END IF;
END$$;

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_unique'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_email_unique UNIQUE (email);
  END IF;
END$$;

-- 3. Add index on email for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4. Add email_verified field for email verification system (optional for now)
-- Set to FALSE by default - can verify emails later when email service is added
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 5. Add email_verification_token for email verification (optional for now)
-- Will be used later when email verification is implemented
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT;

-- 6. Add email_verification_expires for token expiration (optional for now)
-- Will be used later when email verification is implemented
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;

-- 7. Add password_reset_token for password reset functionality (optional for now)
-- Will be used later when password reset via email is implemented
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT;

-- 8. Add password_reset_expires for password reset token expiration (optional for now)
-- Will be used later when password reset via email is implemented
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- 9. Add last_login to track user activity
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 10. Add login_attempts for brute force protection
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;

-- 11. Add locked_until for account lockout after failed attempts
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- 12. Add updated_at field if it doesn't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 13. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 15. Add index on email_verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
  ON public.users(email_verification_token) 
  WHERE email_verification_token IS NOT NULL;

-- 16. Add index on password_reset_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
  ON public.users(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;

-- 17. Add index on user_type for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_users_user_type ON public.users(user_type);

-- 18. Add index on is_active for faster active user queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active) 
  WHERE is_active = TRUE;

-- 19. Add comments for documentation
COMMENT ON COLUMN public.users.email_verified IS 'Whether the user has verified their email address (optional - set to FALSE for now)';
COMMENT ON COLUMN public.users.email_verification_token IS 'Token used for email verification (optional - for future email integration)';
COMMENT ON COLUMN public.users.email_verification_expires IS 'Expiration time for email verification token (optional - for future email integration)';
COMMENT ON COLUMN public.users.password_reset_token IS 'Token used for password reset (optional - for future email integration)';
COMMENT ON COLUMN public.users.password_reset_expires IS 'Expiration time for password reset token (optional - for future email integration)';
COMMENT ON COLUMN public.users.last_login IS 'Timestamp of last successful login (optional - nice to have)';
COMMENT ON COLUMN public.users.login_attempts IS 'Number of failed login attempts (optional - for security, can implement later)';
COMMENT ON COLUMN public.users.locked_until IS 'Account lockout expiration time (optional - for security, can implement later)';
COMMENT ON COLUMN public.users.user_type IS 'User role: farmer, buyer, or admin';

COMMIT;

