const pool = require('../../../../db');
let createClient = null;
try {
  ({ createClient } = require('@supabase/supabase-js'));
} catch (_) {
  createClient = null;
}

function getSupabase() {
  if (!createClient) return null;
  let url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url && key) {
    try {
      const parts = String(key).split('.');
      const payload = JSON.parse(Buffer.from(parts[1] || '', 'base64').toString('utf8'));
      const ref = payload && payload.ref;
      if (ref) url = `https://${ref}.supabase.co`;
    } catch (_) {}
  }
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseRange(query) {
  const { from, to, user, type, status } = query;
  const params = [];
  const where = [];
  if (user) { params.push(user); where.push(`user_id = $${params.length}`); }
  if (type) { params.push(type); where.push(`type = $${params.length}`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  if (from) { params.push(from); where.push(`DATE(created_at) >= $${params.length}::date`); }
  if (to) { params.push(to); where.push(`DATE(created_at) <= $${params.length}::date`); }
  return { params, where: where.join(' AND ') };
}

async function getCoinPurchases(req, res) {
  try {
    const { from, to, user, status } = req.query;
    const useDb = !!process.env.DATABASE_URL;
    if (useDb) {
      try {
        const params = [];
        const where = [];
        if (user) { params.push(user); where.push(`cp.farmer_id = $${params.length}`); }
        if (status) { params.push(status); where.push(`cp.status = $${params.length}`); }
        if (from) { params.push(from); where.push(`DATE(cp.created_at) >= $${params.length}::date`); }
        if (to) { params.push(to); where.push(`DATE(cp.created_at) <= $${params.length}::date`); }
        const sql = `
          SELECT 
            cp.id,
            cp.farmer_id AS user_id,
            u.name AS farmer_name,
            cp.coins_purchased,
            cp.amount,
            cp.currency,
            cp.status,
            cp.payment_ref,
            cp.created_at
          FROM coin_purchases cp
          LEFT JOIN users u ON u.id = cp.farmer_id
          ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY cp.created_at DESC
          LIMIT 500
        `;
        const result = await pool.query(sql, params);
        return res.json(result.rows);
      } catch (dbErr) {
        const supabase = getSupabase();
        if (!supabase) throw dbErr;
        let q = supabase.from('coin_purchases').select('id,farmer_id,user_id:farmer_id,coins_purchased,amount,currency,status,payment_ref,created_at').order('created_at', { ascending: false }).limit(500);
        if (user) q = q.eq('farmer_id', user);
        if (status) q = q.eq('status', status);
        if (from) q = q.gte('created_at', new Date(from).toISOString());
        if (to) q = q.lte('created_at', new Date(to).toISOString());
        const { data, error } = await q;
        if (error) throw dbErr;
        return res.json(Array.isArray(data) ? data : []);
      }
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.json([]);
    }
    let q = supabase.from('coin_purchases').select('id,farmer_id,user_id:farmer_id,coins_purchased,amount,currency,status,payment_ref,created_at').order('created_at', { ascending: false }).limit(500);
    if (user) q = q.eq('farmer_id', user);
    if (status) q = q.eq('status', status);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) q = q.lte('created_at', new Date(to).toISOString());
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'Server Error' });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    const authDisabled =
      process.env.AUTH_DISABLED === 'true' ||
      process.env.DISABLE_AUTH === 'true' ||
      process.env.APP_AUTH_DISABLED === 'true';
    if (authDisabled) return res.json([]);
    const code = err && err.code;
    if (code === '42P01') return res.status(500).json({ error: 'Schema requires coin_purchases table' });
    res.status(500).json({ error: 'Server Error' });
  }
}

async function getCoinTransactions(req, res) {
  try {
    const useDb = !!process.env.DATABASE_URL;
    if (useDb) {
      try {
        const { params, where } = parseRange(req.query);
        const sql = `
          SELECT 
            ct.id,
            ct.user_id,
            u.name AS user_name,
            ct.type,
            ct.amount,
            ct.reason,
            ct.balance_after,
            ct.ref_type,
            ct.ref_id,
            ct.created_at
          FROM coin_transactions ct
          LEFT JOIN users u ON u.id = ct.user_id
          ${where ? 'WHERE ' + where : ''}
          ORDER BY ct.created_at DESC
          LIMIT 1000
        `;
        const result = await pool.query(sql, params);
        return res.json(result.rows);
      } catch (dbErr) {
        const supabase = getSupabase();
        if (!supabase) throw dbErr;
        const { from, to, user, type } = req.query;
        let q = supabase.from('coin_transactions').select('id,user_id,type,amount,reason,balance_after,ref_type,ref_id,created_at').order('created_at', { ascending: false }).limit(1000);
        if (user) q = q.eq('user_id', user);
        if (type) q = q.eq('type', type);
        if (from) q = q.gte('created_at', new Date(from).toISOString());
        if (to) q = q.lte('created_at', new Date(to).toISOString());
        const { data, error } = await q;
        if (error) throw dbErr;
        return res.json(Array.isArray(data) ? data : []);
      }
    }
    const supabase = getSupabase();
    if (!supabase) {
      return res.json([]);
    }
    const { from, to, user, type } = req.query;
    let q = supabase.from('coin_transactions').select('id,user_id,type,amount,reason,balance_after,ref_type,ref_id,created_at').order('created_at', { ascending: false }).limit(1000);
    if (user) q = q.eq('user_id', user);
    if (type) q = q.eq('type', type);
    if (from) q = q.gte('created_at', new Date(from).toISOString());
    if (to) q = q.lte('created_at', new Date(to).toISOString());
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'Server Error' });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    const authDisabled =
      process.env.AUTH_DISABLED === 'true' ||
      process.env.DISABLE_AUTH === 'true' ||
      process.env.APP_AUTH_DISABLED === 'true';
    if (authDisabled) return res.json([]);
    const code = err && err.code;
    if (code === '42P01') return res.status(500).json({ error: 'Schema requires coin_transactions table' });
    res.status(500).json({ error: 'Server Error' });
  }
}

async function getFarmerBalances(req, res) {
  try {
    const result = await pool.query("SELECT id AS user_id, name, email, coins AS balance FROM users WHERE user_type = 'farmer' ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
}

async function getPayments(req, res) {
  try {
    const { from, to, user, status, method } = req.query;
    const params = [];
    const where = [];
    if (user) { params.push(user); where.push(`(payer_id = $${params.length} OR payee_id = $${params.length})`); }
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (method) { params.push(method); where.push(`method = $${params.length}`); }
    if (from) { params.push(from); where.push(`created_at >= $${params.length}`); }
    if (to) { params.push(to); where.push(`created_at <= $${params.length}`); }
    const sql = `SELECT id, payer_id, payee_id, order_id, amount, currency, method, status, created_at FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT 500`;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    const authDisabled =
      process.env.AUTH_DISABLED === 'true' ||
      process.env.DISABLE_AUTH === 'true' ||
      process.env.APP_AUTH_DISABLED === 'true';
    if (authDisabled) return res.json([]);
    const code = err && err.code;
    if (code === '42P01') return res.status(500).json({ error: 'Schema requires payments table' });
    res.status(500).json({ error: 'Server Error' });
  }
}

module.exports = { getCoinPurchases, getCoinTransactions, getFarmerBalances, getPayments };
