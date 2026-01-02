BEGIN;

ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS category text;

CREATE INDEX IF NOT EXISTS complaints_category_idx ON public.complaints (category);

COMMIT;
