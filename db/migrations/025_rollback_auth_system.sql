BEGIN;

-- ============================================
-- ROLLBACK: AUTHENTICATION SYSTEM IMPROVEMENTS
-- Migration: 025_rollback_auth_system.sql
-- Purpose: Rollback changes from 025_auth_system_improvements.sql
-- ============================================

-- WARNING: This rollback will remove all the new columns and constraints
-- Make sure you want to do this before running!

-- 1. Drop indexes first
DROP INDEX IF EXISTS idx_users_email_verification_token;
DROP INDEX IF EXISTS idx_users_password_reset_token;
DROP INDEX IF EXISTS idx_users_user_type;
DROP INDEX IF EXISTS idx_users_is_active;
DROP INDEX IF EXISTS idx_users_email;

-- 2. Drop trigger and function
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Remove new columns (in reverse order)
ALTER TABLE public.users DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.users DROP COLUMN IF EXISTS locked_until;
ALTER TABLE public.users DROP COLUMN IF EXISTS login_attempts;
ALTER TABLE public.users DROP COLUMN IF EXISTS last_login;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_reset_expires;
ALTER TABLE public.users DROP COLUMN IF EXISTS password_reset_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS email_verification_expires;
ALTER TABLE public.users DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE public.users DROP COLUMN IF EXISTS email_verified;

-- 4. Restore original user_type constraint (only farmer and buyer)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_user_type_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_user_type_check;
  END IF;
END$$;

-- Restore original constraint (farmer and buyer only)
ALTER TABLE public.users
  ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('farmer', 'buyer'));

-- 5. Remove unique constraint on email (if you want to allow duplicates again)
-- WARNING: Only do this if you're sure you want duplicate emails
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1
--     FROM pg_constraint
--     WHERE conname = 'users_email_unique'
--       AND conrelid = 'public.users'::regclass
--   ) THEN
--     ALTER TABLE public.users DROP CONSTRAINT users_email_unique;
--   END IF;
-- END$$;

COMMIT;

