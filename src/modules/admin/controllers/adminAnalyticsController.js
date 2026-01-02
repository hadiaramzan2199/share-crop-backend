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
      SELECT 
        COALESCE(f.subcategory, f.category, 'Uncategorized') AS category,
        COUNT(o.id)::int AS orders,
        COALESCE(SUM(o.total_price), 0)::float AS revenue
      FROM orders o
      JOIN fields f ON f.id = o.field_id
      ${where}
      GROUP BY COALESCE(f.subcategory, f.category, 'Uncategorized')
      ORDER BY category ASC
    `;
    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      category: r.category,
      orders: r.orders,
      revenue: r.revenue,
      profit: r.revenue, // no cost table exists yet
    }));
    res.json(rows);
  } catch (err) {
    ensure(err, 'Schema requires orders and fields with category/subcategory and total_price');
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

async function farmersPerformance(req, res) {
  try {
    const { from, to } = req.query;
    const params = [];
    let where = "WHERE u.user_type = 'farmer'";
    if (from) { params.push(new Date(from)); where += ` AND o.created_at >= $${params.length}`; }
    if (to) { params.push(new Date(to)); where += ` AND o.created_at <= $${params.length}`; }
    const sql = `
      SELECT 
        u.id AS farmer_id,
        u.name AS farmer_name,
        COUNT(o.id)::int AS orders,
        COALESCE(SUM(o.total_price), 0)::float AS revenue,
        AVG(f.rating)::float AS rating
      FROM users u
      LEFT JOIN fields f ON f.owner_id = u.id
      LEFT JOIN orders o ON o.field_id = f.id
      ${where}
      GROUP BY u.id, u.name
      ORDER BY revenue DESC, orders DESC
    `;
    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      farmer_name: r.farmer_name,
      orders: r.orders,
      revenue: r.revenue,
      rating: r.rating || 0,
      score: (Number(r.revenue || 0) + (Number(r.rating || 0) * 100)),
    }));
    res.json(rows);
  } catch (err) {
    ensure(err, 'Schema requires users (farmers), fields, orders with total_price');
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Server Error' });
  }
}

async function farmersExport(req, res) {
  return farmersSummary(req, res);
}

async function reviewsSummary(req, res) {
  try {
    const params = [];
    const sql = `
      SELECT 
        f.id AS field_id,
        f.name AS item,
        COALESCE(f.reviews, 0)::int AS reviews_count,
        COALESCE(f.rating, 0)::float AS avg_rating
      FROM fields f
      ORDER BY item ASC
    `;
    const result = await pool.query(sql, params);
    const rows = result.rows.map(r => ({
      item: r.item,
      reviews_count: r.reviews_count,
      avg_rating: r.avg_rating,
      positive_pct: r.avg_rating >= 4 ? 100 : 0,
      negative_pct: r.avg_rating <= 2 ? 100 : 0,
    }));
    res.json(rows);
  } catch (err) {
    ensure(err, 'Schema requires fields table with rating and reviews columns');
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
  farmersPerformance,
  farmersExport,
  reviewsSummary,
  reviewsExport,
  performanceSummary,
  performanceExport,
};
