const pool = require('../../../../db');

function ensure(err, msg) {
  if (err && (err.code === '42P01' || err.code === '42703')) {
    const e = new Error(msg);
    e.status = 500;
    throw e;
  }
}

function parseRange(q) {
  const from = q.from ? new Date(q.from) : null;
  const to = q.to ? new Date(q.to) : null;
  return { from, to };
}

function currency() {
  return process.env.CURRENCY || 'USD';
}

async function profitByCategorySummary(req, res) {
  try {
    const { from, to } = parseRange(req.query);
    const params = [];
    let where = '';
    if (from) { params.push(from); where += (where ? ' AND' : ' WHERE') + ` o.created_at >= $${params.length}`; }
    if (to) { params.push(to); where += (where ? ' AND' : ' WHERE') + ` o.created_at <= $${params.length}`; }
    const sql = `
      SELECT c.id AS category_id,
             COALESCE(c.name, 'Uncategorized') AS category_name,
             SUM(oi.quantity * oi.unit_price) AS revenue,
             SUM(oi.quantity * COALESCE(oi.unit_cost, NULL)) AS cost
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      GROUP BY c.id, c.name
      ORDER BY category_name ASC
    `;
    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      category_id: r.category_id,
      category_name: r.category_name,
      revenue: Number(r.revenue || 0),
      cost: r.cost === null ? null : Number(r.cost || 0),
      profit: r.cost === null ? null : Number(r.revenue || 0) - Number(r.cost || 0),
      currency: currency(),
    }));
    res.json({ data: rows });
  } catch (err) {
    ensure(err, 'Schema requires orders, order_items, products, categories with quantity, unit_price');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function profitByCategoryExport(req, res) {
  try {
    const { from, to } = parseRange(req.query);
    const params = [];
    let where = '';
    if (from) { params.push(from); where += (where ? ' AND' : ' WHERE') + ` o.created_at >= $${params.length}`; }
    if (to) { params.push(to); where += (where ? ' AND' : ' WHERE') + ` o.created_at <= $${params.length}`; }
    const sql = `
      SELECT c.id AS category_id,
             COALESCE(c.name, 'Uncategorized') AS category_name,
             SUM(oi.quantity * oi.unit_price) AS revenue,
             SUM(oi.quantity * COALESCE(oi.unit_cost, NULL)) AS cost
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      GROUP BY c.id, c.name
      ORDER BY category_name ASC
    `;
    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      category_id: r.category_id,
      category_name: r.category_name,
      revenue: Number(r.revenue || 0),
      cost: r.cost === null ? null : Number(r.cost || 0),
      profit: r.cost === null ? null : Number(r.revenue || 0) - Number(r.cost || 0),
      currency: currency(),
    }));
    res.json({ data: rows });
  } catch (err) {
    ensure(err, 'Schema requires orders, order_items, products, categories with quantity, unit_price');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function farmersSummary(req, res) {
  try {
    const { from, to, sortBy, order, active } = req.query;
    const params = [];
    let activeFilter = '';
    if (active === 'true') activeFilter = " AND u.is_active = TRUE";
    if (active === 'false') activeFilter = " AND u.is_active = FALSE";
    const rangeWhere = [];
    if (from) { params.push(new Date(from)); rangeWhere.push(` fl.updated_at >= $${params.length}`); }
    if (to) { params.push(new Date(to)); rangeWhere.push(` fl.updated_at <= $${params.length}`); }
    const fieldRange = rangeWhere.length ? ' AND ' + rangeWhere.join(' AND ') : '';
    const sql = `
      WITH farms_cte AS (
        SELECT u.id AS farmer_id, COUNT(fm.id)::int AS farms_count
        FROM users u
        LEFT JOIN farms fm ON fm.owner_id = u.id
        WHERE u.user_type = 'farmer'
        ${activeFilter}
        GROUP BY u.id
      ),
      fields_cte AS (
        SELECT u.id AS farmer_id, COUNT(fl.id)::int AS fields_count,
               COALESCE(SUM(fl.quantity), 0)::float AS total_quantity,
               COALESCE(SUM(fl.production_rate), 0)::float AS total_production
        FROM users u
        LEFT JOIN farms fm ON fm.owner_id = u.id
        LEFT JOIN fields fl ON fl.farm_id = fm.id
        WHERE u.user_type = 'farmer'${activeFilter}${fieldRange}
        GROUP BY u.id
      )
      SELECT u.id AS farmer_id, u.name AS farmer_name, u.email AS farmer_email,
             COALESCE(fc.farms_count, 0) AS total_farms,
             COALESCE(ff.fields_count, 0) AS total_fields,
             COALESCE(ff.total_production, 0) AS total_production,
             COALESCE(ff.total_quantity, 0) AS total_quantity
      FROM users u
      LEFT JOIN farms_cte fc ON fc.farmer_id = u.id
      LEFT JOIN fields_cte ff ON ff.farmer_id = u.id
      WHERE u.user_type = 'farmer'${activeFilter}
    `;
    const result = await pool.query(sql, params);
    let rows = result.rows.map(r => ({
      farmer_id: r.farmer_id,
      farmer_name: r.farmer_name,
      farmer_email: r.farmer_email,
      total_farms: Number(r.total_farms || 0),
      total_fields: Number(r.total_fields || 0),
      total_production: Number(r.total_production || 0),
      total_quantity: Number(r.total_quantity || 0),
    }));
    const s = (sortBy || '').toLowerCase();
    const asc = (order || '').toLowerCase() !== 'desc';
    const key = ['total_production','total_quantity','total_fields','total_farms','farmer_name'].includes(s) ? s : 'farmer_name';
    rows.sort((a,b)=>{
      const va=a[key]; const vb=b[key];
      if (typeof va==='number' && typeof vb==='number') return asc?va-vb:vb-va;
      return asc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va));
    });
    res.json({ data: rows });
  } catch (err) {
    ensure(err, 'Schema requires users, farms, fields with quantity and production_rate');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function farmersExport(req, res) {
  return farmersSummary(req, res);
}

async function reviewsSummary(req, res) {
  try {
    const { from, to } = parseRange(req.query);
    const params = [];
    let where = '';
    if (from) { params.push(from); where += (where ? ' AND' : ' WHERE') + ` created_at >= $${params.length}`; }
    if (to) { params.push(to); where += (where ? ' AND' : ' WHERE') + ` created_at <= $${params.length}`; }
    const sql = `
      SELECT target_type,
             target_id,
             COUNT(*)::int AS reviews_count,
             AVG(rating)::float AS avg_rating
      FROM reviews
      ${where}
      GROUP BY target_type, target_id
      ORDER BY target_type ASC
    `;
    const result = await pool.query(sql, params);
    res.json({ data: result.rows.map(r=>({
      target_type: r.target_type,
      target_id: r.target_id,
      reviews_count: r.reviews_count,
      avg_rating: r.avg_rating,
    })) });
  } catch (err) {
    ensure(err, 'Schema requires reviews table with rating, target_type, target_id');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function reviewsExport(req, res) {
  return reviewsSummary(req, res);
}

async function performanceSummary(req, res) {
  try {
    const { from, to, groupBy } = req.query;
    const gb = (groupBy || 'day').toLowerCase();
    const unit = gb==='week'?'week':gb==='month'?'month':'day';
    const params = [];
    let where = '';
    if (from) { params.push(new Date(from)); where += (where ? ' AND' : ' WHERE') + ` o.created_at >= $${params.length}`; }
    if (to) { params.push(new Date(to)); where += (where ? ' AND' : ' WHERE') + ` o.created_at <= $${params.length}`; }
    const sql = `
      SELECT date_trunc('${unit}', o.created_at) AS period,
             SUM(oi.quantity * oi.unit_price)::float AS revenue,
             COUNT(DISTINCT o.id)::int AS orders_count
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY period
      ORDER BY period ASC
    `;
    const result = await pool.query(sql, params);
    res.json({ data: result.rows.map(r=>({
      period: r.period,
      revenue: r.revenue,
      orders_count: r.orders_count,
      currency: currency(),
    })) });
  } catch (err) {
    ensure(err, 'Schema requires orders and order_items with quantity, unit_price');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function performanceExport(req, res) {
  return performanceSummary(req, res);
}

module.exports = {
  profitByCategorySummary,
  profitByCategoryExport,
  farmersSummary,
  farmersExport,
  reviewsSummary,
  reviewsExport,
  performanceSummary,
  performanceExport,
};
