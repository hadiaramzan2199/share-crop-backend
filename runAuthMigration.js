require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function run() {
  const file = path.join(__dirname, 'db/migrations/025_auth_system_improvements.sql');
  const sql = fs.readFileSync(file, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Migration 025_auth_system_improvements.sql completed successfully');
    console.log('\n📋 Changes applied:');
    console.log('  ✓ Added admin role to user_type constraint');
    console.log('  ✓ Added unique constraint on email');
    console.log('  ✓ Added email_verified field');
    console.log('  ✓ Added email_verification_token and expiration');
    console.log('  ✓ Added password_reset_token and expiration');
    console.log('  ✓ Added last_login tracking');
    console.log('  ✓ Added login_attempts and locked_until for security');
    console.log('  ✓ Added updated_at field with auto-update trigger');
    console.log('  ✓ Added performance indexes');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

