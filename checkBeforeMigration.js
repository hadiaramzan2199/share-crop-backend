require('dotenv').config();
const pool = require('./db');

async function checkBeforeMigration() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking database before migration...\n');

    // Check for duplicate emails
    const duplicateCheck = await client.query(`
      SELECT email, COUNT(*) as count
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log('❌ WARNING: Found duplicate emails!');
      console.log('You need to fix these before running the migration:\n');
      duplicateCheck.rows.forEach(row => {
        console.log(`  - ${row.email}: ${row.count} occurrences`);
      });
      console.log('\n⚠️  Migration will FAIL if you have duplicate emails.');
      console.log('Please fix duplicates first, then run the migration.\n');
      process.exit(1);
    } else {
      console.log('✅ No duplicate emails found - safe to proceed!\n');
    }

    // Check current user count
    const userCount = await client.query('SELECT COUNT(*)::int AS count FROM users');
    console.log(`📊 Current users in database: ${userCount.rows[0].count}\n`);

    // Check if columns already exist
    const existingColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('email_verified', 'last_login', 'password_reset_token')
    `);

    if (existingColumns.rows.length > 0) {
      console.log('⚠️  Some columns already exist:');
      existingColumns.rows.forEach(row => {
        console.log(`  - ${row.column_name}`);
      });
      console.log('\nMigration will skip existing columns (safe to run again).\n');
    }

    // Check current constraint
    const constraintCheck = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'users_user_type_check'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('📋 Current user_type constraint:');
      console.log(`  ${constraintCheck.rows[0].check_clause}\n`);
    }

    console.log('✅ All checks passed! Safe to run migration.\n');
    console.log('Run: npm run migrate:auth\n');

  } catch (err) {
    console.error('❌ Error checking database:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBeforeMigration();

