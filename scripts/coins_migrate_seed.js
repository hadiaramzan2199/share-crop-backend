require('dotenv').config();
const pool = require('../db');

async function ensureSchema() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS public.coin_purchases (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      farmer_id uuid NOT NULL,
      amount numeric(12,2) NOT NULL,
      currency text NOT NULL DEFAULT 'USD',
      coins_purchased bigint NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      payment_ref text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT coin_purchases_status_check CHECK (status IN ('pending','completed','failed'))
    );`,
    `CREATE INDEX IF NOT EXISTS coin_purchases_farmer_idx ON public.coin_purchases (farmer_id);`,
    `CREATE INDEX IF NOT EXISTS coin_purchases_created_at_idx ON public.coin_purchases (created_at);`,
    `ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS type text;`,
    `ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS reason text;`,
    `ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS balance_after bigint;`,
    `ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS ref_type text;`,
    `ALTER TABLE public.coin_transactions ADD COLUMN IF NOT EXISTS ref_id uuid;`,
  ];
  for (const s of stmts) {
    await pool.query(s);
  }
}

async function seedData() {
  const farmersRes = await pool.query(
    "SELECT id, name FROM public.users WHERE user_type = 'farmer' ORDER BY created_at ASC LIMIT 2"
  );
  const farmers = farmersRes.rows;
  if (farmers.length === 0) {
    console.log('No farmers found. Skipping seed.');
    return;
  }
  const now = Date.now();

  // Seed purchases and corresponding coin credits
  const p1 = await pool.query(
    `INSERT INTO public.coin_purchases (farmer_id, amount, currency, coins_purchased, status, payment_ref, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [farmers[0].id, 49.99, 'USD', 5000, 'completed', 'PAY-1001', new Date(now - 24 * 60 * 60 * 1000)]
  );
  await pool.query(
    `INSERT INTO public.coin_transactions (user_id, type, amount, reason, balance_after, ref_type, ref_id, created_at)
     VALUES ($1,'credit',$2,'coin_purchase',$3,'coin_purchase',$4,$5)`,
    [farmers[0].id, 5000, 17500, p1.rows[0].id, new Date(now - 24 * 60 * 60 * 1000 + 10000)]
  );

  const farmer2 = farmers[1] || farmers[0];
  const p2 = await pool.query(
    `INSERT INTO public.coin_purchases (farmer_id, amount, currency, coins_purchased, status, payment_ref, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [farmer2.id, 19.99, 'USD', 2000, 'completed', 'PAY-1002', new Date(now - 12 * 60 * 60 * 1000)]
  );
  await pool.query(
    `INSERT INTO public.coin_transactions (user_id, type, amount, reason, balance_after, ref_type, ref_id, created_at)
     VALUES ($1,'credit',$2,'coin_purchase',$3,'coin_purchase',$4,$5)`,
    [farmer2.id, 2000, 8200, p2.rows[0].id, new Date(now - 12 * 60 * 60 * 1000 + 10000)]
  );
}

async function main() {
  try {
    await ensureSchema();
    await seedData();
    console.log('Coins schema ensured and seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('Coins migrate/seed failed:', err);
    process.exit(1);
  }
}

main();
