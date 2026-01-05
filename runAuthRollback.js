require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function run() {
  console.log('⚠️  WARNING: This will rollback the authentication migration!');
  console.log('This will remove all new columns and constraints added by migration 025.\n');
  
  // Ask for confirmation (in a real scenario, you'd use readline)
  const file = path.join(__dirname, 'db/migrations/025_rollback_auth_system.sql');
  const sql = fs.readFileSync(file, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Rollback completed successfully');
    console.log('\n📋 Changes reverted:');
    console.log('  ✓ Removed new columns (email_verified, last_login, etc.)');
    console.log('  ✓ Removed new indexes');
    console.log('  ✓ Restored original user_type constraint (farmer/buyer only)');
    console.log('  ⚠️  Email unique constraint kept (commented out in rollback)');
    console.log('\nNote: Existing data is unchanged, only new columns removed.');
  } catch (err) {
    console.error('❌ Rollback failed:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

