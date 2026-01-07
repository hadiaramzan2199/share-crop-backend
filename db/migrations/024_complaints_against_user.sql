BEGIN;

-- Add complained_against_user_id column to complaints table
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS complained_against_user_id uuid;

-- Add foreign key constraint (optional, but recommended for data integrity)
-- ALTER TABLE public.complaints
--   ADD CONSTRAINT complaints_complained_against_user_fk 
--   FOREIGN KEY (complained_against_user_id) 
--   REFERENCES public.users(id) 
--   ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS complaints_complained_against_user_idx 
  ON public.complaints (complained_against_user_id);

COMMIT;

