BEGIN;

CREATE TABLE IF NOT EXISTS public.complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT complaints_status_check CHECK (status IN ('open','in_review','resolved'))
);

-- Basic indexes for lookup
CREATE INDEX IF NOT EXISTS complaints_target_idx ON public.complaints (target_type, target_id);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON public.complaints (status);

COMMIT;
