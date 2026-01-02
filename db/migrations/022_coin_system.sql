BEGIN;
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  coins_purchased bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coin_purchases_status_check CHECK (status IN ('pending','completed','failed'))
);
CREATE INDEX IF NOT EXISTS coin_purchases_farmer_idx ON public.coin_purchases (farmer_id);
CREATE INDEX IF NOT EXISTS coin_purchases_created_at_idx ON public.coin_purchases (created_at);
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL,
  amount bigint NOT NULL,
  reason text,
  balance_after bigint NOT NULL,
  ref_type text,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coin_transactions_type_check CHECK (type IN ('credit','debit'))
);
CREATE INDEX IF NOT EXISTS coin_transactions_user_idx ON public.coin_transactions (user_id, created_at);
CREATE OR REPLACE FUNCTION public.log_user_coin_change()
RETURNS trigger AS $$
DECLARE delta BIGINT; t TEXT; BEGIN
  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    delta := COALESCE(NEW.coins,0) - COALESCE(OLD.coins,0);
    IF delta > 0 THEN t := 'credit'; ELSE t := 'debit'; END IF;
    INSERT INTO public.coin_transactions(user_id, type, amount, reason, balance_after, ref_type, ref_id)
    VALUES(NEW.id, t, ABS(delta), 'balance_update', NEW.coins, 'users', NEW.id);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_coin_change_trg') THEN
    CREATE TRIGGER users_coin_change_trg AFTER UPDATE OF coins ON public.users FOR EACH ROW EXECUTE FUNCTION public.log_user_coin_change();
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.complete_coin_purchase(purchase_id uuid)
RETURNS void AS $$
DECLARE p RECORD; current_balance BIGINT; BEGIN
  PERFORM 1;
  SELECT * INTO p FROM public.coin_purchases WHERE id = purchase_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'coin_purchase not found'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'coin_purchase not pending'; END IF;
  SELECT coins INTO current_balance FROM public.users WHERE id = p.farmer_id FOR UPDATE;
  UPDATE public.users SET coins = COALESCE(current_balance,0) + p.coins_purchased WHERE id = p.farmer_id;
  UPDATE public.coin_purchases SET status = 'completed' WHERE id = purchase_id;
  INSERT INTO public.coin_transactions(user_id, type, amount, reason, balance_after, ref_type, ref_id)
  SELECT p.farmer_id, 'credit', p.coins_purchased, 'coin_purchase', u.coins, 'coin_purchase', p.id FROM public.users u WHERE u.id = p.farmer_id;
END; $$ LANGUAGE plpgsql;
COMMIT;
