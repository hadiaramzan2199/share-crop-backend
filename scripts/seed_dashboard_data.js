require('dotenv').config();
const pool = require('../db');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function getUserIds() {
  const r = await pool.query("SELECT id, user_type, name, email FROM users");
  const farmers = r.rows.filter(u => String(u.user_type).toLowerCase() === 'farmer').map(u => u.id);
  const buyers = r.rows.filter(u => String(u.user_type).toLowerCase() === 'buyer').map(u => u.id);
  return { farmers, buyers, any: r.rows.map(u => u.id) };
}

async function ensureUsers() {
  const existing = await pool.query("SELECT COUNT(*)::int AS c FROM users");
  const count = existing.rows[0].c || 0;
  if (count >= 20) return;

  const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Jamie', 'Riley', 'Quinn', 'Avery', 'Cameron', 'Drew', 'Emerson', 'Hayden', 'Parker', 'Rowan', 'Sawyer', 'Skyler', 'Sydney', 'Terry', 'Zoe', 'Kai', 'Milo', 'Noah', 'Liam', 'Emma', 'Olivia', 'Ava', 'Mia', 'Isla'];
  const statuses = ['pending', 'approved', 'rejected'];

  const targetFarmers = 20;
  const targetBuyers = 15;
  for (let i = 0; i < targetFarmers; i++) {
    const name = `${pick(names)} Farmer ${i + 1}`;
    const email = `farmer${i + 1}@example.com`;
    const approval = pick(statuses);
    const isActive = approval === 'approved';
    await pool.query(
      "INSERT INTO users (id, name, email, password, user_type, is_active, approval_status, created_at) VALUES (gen_random_uuid(), $1, $2, $3, 'farmer', $4, $5, $6) ON CONFLICT (email) DO NOTHING",
      [name, email, 'seed_password', isActive, approval, daysAgo(randInt(1, 45))]
    );
  }
  for (let i = 0; i < targetBuyers; i++) {
    const name = `${pick(names)} Buyer ${i + 1}`;
    const email = `buyer${i + 1}@example.com`;
    await pool.query(
      "INSERT INTO users (id, name, email, password, user_type, is_active, created_at) VALUES (gen_random_uuid(), $1, $2, $3, 'buyer', TRUE, $4) ON CONFLICT (email) DO NOTHING",
      [name, email, 'seed_password', daysAgo(randInt(1, 45))]
    );
  }
}

async function ensureFields() {
  const existing = await pool.query("SELECT COUNT(*)::int AS c FROM fields");
  const count = existing.rows[0].c || 0;
  if (count >= 12) return;

  const { farmers } = await getUserIds();
  if (farmers.length === 0) return;

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Legumes'];
  const subcats = {
    Vegetables: ['Tomato', 'Potato', 'Carrot', 'Onion'],
    Fruits: ['Apple', 'Banana', 'Orange', 'Strawberry'],
    Grains: ['Wheat', 'Rice', 'Corn', 'Barley'],
    Legumes: ['Peas', 'Beans', 'Lentils', 'Chickpeas'],
  };
  const locations = ['Punjab, PK', 'Sindh, PK', 'Khyber Pakhtunkhwa, PK', 'Balochistan, PK'];

  for (let i = 0; i < 12; i++) {
    const cat = pick(categories);
    const sub = pick(subcats[cat]);
    const owner = pick(farmers);
    const lng = 72 + Math.random();
    const lat = 31 + Math.random();
    const area = randInt(500, 5000);
    const pricePerM2 = randInt(1, 15);
    const coordsJson = JSON.stringify([lng, lat]);
    const harvestJson = JSON.stringify([daysAgo(randInt(10, 90)), daysAgo(randInt(1, 9))]);

    await pool.query(
      `INSERT INTO fields (
         id, name, description, coordinates, location, owner_id,
         field_size, field_size_unit, area_m2, available_area, total_area,
         category, subcategory, price, price_per_m2, unit, quantity,
         farmer_name, available, rating, production_rate, production_rate_unit,
         harvest_dates, shipping_option, delivery_charges, created_at
       )
       VALUES (
         gen_random_uuid(), $1, $2, $3, $4, $5,
         $6, 'm2', $7, $8, $9,
         $10, $11, $12, $13, 'kg', $14,
         $15, TRUE, $16, $17, 'kg/day',
         $18, 'standard', $19, $20
       )`,
      [
        `${sub} Field ${i + 1}`,
        `${sub} cultivation`,
        coordsJson,
        pick(locations),
        owner,
        area,
        area,
        Math.round(area * 0.7),
        area,
        cat,
        sub,
        area * pricePerM2,
        pricePerM2,
        randInt(100, 10000),
        `Farmer ${i + 1}`,
        (Math.random() * 5).toFixed(1),
        randInt(10, 80),
        harvestJson,
        randInt(50, 400),
        daysAgo(randInt(1, 60)),
      ]
    );
  }
}

async function ensureComplaints() {
  const existing = await pool.query("SELECT COUNT(*)::int AS c FROM complaints");
  const count = existing.rows[0].c || 0;
  if (count >= 15) return;

  const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='complaints'");
  const cols = colsRes.rows.map(r => r.column_name);
  const { any } = await getUserIds();
  const fieldIdsRes = await pool.query("SELECT id FROM fields");
  const fieldIds = fieldIdsRes.rows.map(r => r.id);
  if (any.length === 0 || fieldIds.length === 0) return;

  const statuses = ['open', 'in_review', 'resolved'];
  const targets = ['field', 'order', 'user'];
  const categories = ['Service', 'Quality', 'Delivery', 'Payment', 'Refund', 'Field', 'Order', 'User'];

  for (let i = 0; i < 20; i++) {
    const creator = pick(any);
    const targetType = pick(targets);
    const targetId = targetType === 'field' ? pick(fieldIds) : null;
    const status = pick(statuses);
    const category = pick(categories);
    const createdAt = daysAgo(randInt(1, 30));
    const updatedAt = daysAgo(randInt(0, 29));
    const insertCols = ['id', 'created_by', 'target_type', 'target_id', 'status', 'admin_remarks', 'created_at', 'updated_at'];
    const params = [creator, targetType, targetId, status, status === 'resolved' ? 'Resolved' : null, createdAt, updatedAt];
    const placeholders = params.map((_, idx) => `$${idx + 1}`);
    if (cols.includes('category')) {
      insertCols.splice(6, 0, 'category');
      params.splice(5, 0, category);
    }
    const sql = `INSERT INTO complaints (${insertCols.join(', ')}) VALUES (gen_random_uuid(), ${placeholders.join(', ')})`;
    await pool.query(sql, params);
  }
}

async function ensurePayments() {
  const existing = await pool.query("SELECT COUNT(*)::int AS c FROM payments");
  const count = existing.rows[0].c || 0;
  if (count >= 20) return;

  const { farmers, buyers } = await getUserIds();
  if (farmers.length === 0 || buyers.length === 0) return;

  const statuses = ['completed', 'pending', 'failed'];
  const colsRes = await pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='payments'");
  const cols = colsRes.rows.map(r => r.column_name);
  const types = Object.fromEntries(colsRes.rows.map(r => [r.column_name, r.data_type]));
  const defaults = Object.fromEntries(colsRes.rows.map(r => [r.column_name, r.column_default]));
  if (cols.includes('id') && !defaults['id']) return;

  for (let i = 0; i < 25; i++) {
    const payer = pick(buyers);
    const payee = pick(farmers);
    const amount = randInt(50, 1500);
    const status = pick(statuses);
    const createdAt = daysAgo(randInt(1, 30));
    const insertCols = [];
    const insertVals = [];
    const params = [];
    const push = (name, val) => { if (cols.includes(name)) { params.push(val); insertCols.push(name); insertVals.push(`$${params.length}`); } };
    if (cols.includes('payer_id') && (!types['payer_id'] || types['payer_id'] === 'uuid')) push('payer_id', payer);
    if (cols.includes('payee_id') && (!types['payee_id'] || types['payee_id'] === 'uuid')) push('payee_id', payee);
    push('amount', amount);
    push('currency', 'USD');
    push('status', status);
    push('created_at', createdAt);
    const sql = `INSERT INTO payments (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`;
    await pool.query(sql, params);
  }
}

async function ensureCoinTransactions() {
  const existing = await pool.query("SELECT COUNT(*)::int AS c FROM coin_transactions");
  const count = existing.rows[0].c || 0;
  if (count >= 30) return;

  const { any } = await getUserIds();
  if (any.length === 0) return;
  const colsRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='coin_transactions'");
  const cols = colsRes.rows.map(r => r.column_name);
  const types = Object.fromEntries(colsRes.rows.map(r => [r.column_name, r.data_type]));
  if (cols.includes('user_id') && types['user_id'] && types['user_id'] !== 'uuid') return;

  const txTypes = ['credit', 'debit'];

  for (let i = 0; i < 30; i++) {
    const user = pick(any);
    const type = pick(txTypes);
    const amount = randInt(10, 500);
    const balanceAfter = randInt(100, 5000);
    const createdAt = daysAgo(randInt(1, 30));
    const insertCols = [];
    const insertVals = [];
    const params = [];
    const push = (name, val) => { if (cols.includes(name)) { params.push(val); insertCols.push(name); insertVals.push(`$${params.length}`); } };
    // id may be default uuid; do not set
    push('user_id', user);
    if (cols.includes('type')) push('type', type);
    if (cols.includes('transaction_type')) push('transaction_type', type);
    if (cols.includes('amount')) push('amount', amount);
    if (cols.includes('coins')) push('coins', amount);
    if (cols.includes('reason')) push('reason', type === 'credit' ? 'seed_credit' : 'seed_debit');
    if (cols.includes('balance_after')) push('balance_after', balanceAfter);
    if (cols.includes('ref_type')) push('ref_type', 'seed');
    if (cols.includes('ref_id')) push('ref_id', '00000000-0000-0000-0000-000000000000');
    if (cols.includes('created_at')) push('created_at', createdAt);
    const sql = `INSERT INTO coin_transactions (${insertCols.join(',')}) VALUES (${insertVals.join(',')})`;
    await pool.query(sql, params);
  }
}

async function main() {
  try {
    await ensureUsers();
    await ensureFields();
    await ensureComplaints();
    await ensurePayments();
    await ensureCoinTransactions();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
