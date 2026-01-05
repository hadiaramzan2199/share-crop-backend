require('dotenv').config();
const pool = require('./db');

async function checkDetailed() {
  const client = await pool.connect();
  try {
    console.log('🔍 Detailed user_type analysis...\n');

    // Check current constraint
    const constraint = await client.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'users_user_type_check'
    `);

    if (constraint.rows.length > 0) {
      console.log('📋 Current constraint:');
      console.log(`   ${constraint.rows[0].check_clause}\n`);
    } else {
      console.log('⚠️  No constraint found\n');
    }

    // Get all unique user_type values
    const types = await client.query(`
      SELECT user_type, COUNT(*) as count
      FROM users
      GROUP BY user_type
      ORDER BY user_type
    `);

    console.log('📊 User types in database:');
    types.rows.forEach(row => {
      const type = row.user_type || 'NULL';
      const count = row.count;
      const isValid = ['farmer', 'buyer', 'admin'].includes(type.toLowerCase());
      const icon = isValid ? '✅' : '❌';
      console.log(`   ${icon} ${type}: ${count} users`);
    });

    // Check for admin users
    const adminUsers = await client.query(`
      SELECT id, email, name, user_type
      FROM users
      WHERE LOWER(user_type) = 'admin' OR user_type = 'ADMIN'
    `);

    if (adminUsers.rows.length > 0) {
      console.log(`\n⚠️  Found ${adminUsers.rows.length} users with 'admin' type:`);
      adminUsers.rows.forEach(user => {
        console.log(`   - ${user.email}: "${user.user_type}"`);
      });
      console.log('\nIf current constraint only allows farmer/buyer, these will cause the error!');
    }

    // Check for any invalid types
    const invalid = await client.query(`
      SELECT id, email, name, user_type
      FROM users
      WHERE user_type IS NULL 
         OR user_type = ''
         OR LOWER(user_type) NOT IN ('farmer', 'buyer', 'admin')
    `);

    if (invalid.rows.length > 0) {
      console.log(`\n❌ Found ${invalid.rows.length} users with invalid types:`);
      invalid.rows.forEach(user => {
        console.log(`   - ${user.email}: "${user.user_type || 'NULL'}"`);
      });
    } else {
      console.log('\n✅ No invalid user types found');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDetailed();

