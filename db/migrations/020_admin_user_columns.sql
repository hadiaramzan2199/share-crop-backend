BEGIN;

-- Add is_active flag for all users (default TRUE)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add approval_status for farmers (pending/approved/rejected)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add optional approval_reason for rejected cases
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approval_reason TEXT;

-- Add documents_json for storing farmer documents/licenses
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS documents_json JSONB;

-- Add a CHECK constraint to restrict approval_status values (create only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_approval_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_approval_status_check
      CHECK (approval_status IN ('pending','approved','rejected'));
  END IF;
END$$;

COMMIT;
