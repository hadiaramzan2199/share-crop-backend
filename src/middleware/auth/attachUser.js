const pool = require("../../../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
let jwt = null;
try {
  jwt = require("jsonwebtoken");
} catch (_) {
  jwt = null;
}

module.exports = async function attachUser(req, res, next) {
  try {
    if (!jwt) {
      req.user = null;
      return next();
    }

    const auth = req.headers["authorization"] || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      req.user = null;
      return next();
    }
    const token = m[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      req.user = null;
      return next();
    }
    // payload carries minimal fields; re-fetch full user to ensure current role/flags
    const { id, email } = payload || {};
    if (!id && !email) {
      req.user = null;
      return next();
    }
    const params = [];
    let where = "";
    if (id) { params.push(id); where = `id = $${params.length}`; }
    else { params.push(email); where = `email = $${params.length}`; }
    const result = await pool.query(`SELECT * FROM users WHERE ${where} LIMIT 1`, params);
    req.user = result.rows[0] || null;
    return next();
  } catch (err) {
    // Do not fail the entire request; leave unauthenticated
    req.user = null;
    return next();
  }
};
