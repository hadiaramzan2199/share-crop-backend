require('dotenv').config();
const pool = require('./db');

async function fixUserTypes() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking for invalid user_type values...\n');

    // Find all users with their user_type
    const allUsers = await client.query(`
      SELECT id, email, name, user_type, 
             CASE 
               WHEN user_type IS NULL THEN 'NULL'
               WHEN user_type = '' THEN 'EMPTY'
               WHEN LOWER(user_type) NOT IN ('farmer', 'buyer', 'admin') THEN 'INVALID'
               ELSE 'OK'
             END as status
      FROM users
      ORDER BY status, user_type
    `);

    console.log(`📊 Found ${allUsers.rows.length} users:\n`);

    const invalidUsers = [];
    const validUsers = [];

    allUsers.rows.forEach(user => {
      if (user.status !== 'OK') {
        invalidUsers.push(user);
        console.log(`❌ Invalid: ${user.email} - user_type: "${user.user_type}" (${user.status})`);
      } else {
        validUsers.push(user);
      }
    });

    if (invalidUsers.length === 0) {
      console.log('✅ All users have valid user_type values!');
      console.log('The migration should work now. Try running: npm run migrate:auth\n');
      return;
    }

    console.log(`\n⚠️  Found ${invalidUsers.length} users with invalid user_type values.\n`);

    // Show valid users count
    console.log(`✅ Valid users: ${validUsers.length}`);
    console.log(`❌ Invalid users: ${invalidUsers.length}\n`);

    // Try to fix them
    console.log('🔧 Attempting to fix invalid user types...\n');

    for (const user of invalidUsers) {
      let newType = null;
      
      // Try to infer from email or set default
      if (user.email && user.email.toLowerCase().includes('admin')) {
        newType = 'admin';
      } else if (user.email && user.email.toLowerCase().includes('farmer')) {
        newType = 'farmer';
      } else if (user.email && user.email.toLowerCase().includes('buyer')) {
        newType = 'buyer';
      } else {
        // Default to buyer if we can't determine
        newType = 'buyer';
      }

      // Handle NULL or empty
      if (!user.user_type || user.user_type === '') {
        await client.query(
          'UPDATE users SET user_type = $1 WHERE id = $2',
          [newType, user.id]
        );
        console.log(`  ✓ Fixed ${user.email}: NULL/EMPTY → ${newType}`);
      } 
      // Handle uppercase (ADMIN, FARMER, BUYER)
      else if (user.user_type && ['ADMIN', 'FARMER', 'BUYER'].includes(user.user_type.toUpperCase())) {
        newType = user.user_type.toLowerCase();
        await client.query(
          'UPDATE users SET user_type = $1 WHERE id = $2',
          [newType, user.id]
        );
        console.log(`  ✓ Fixed ${user.email}: ${user.user_type} → ${newType}`);
      }
      // Handle other invalid values
      else {
        await client.query(
          'UPDATE users SET user_type = $1 WHERE id = $2',
          [newType, user.id]
        );
        console.log(`  ✓ Fixed ${user.email}: "${user.user_type}" → ${newType} (inferred from email or defaulted to buyer)`);
      }
    }

    console.log('\n✅ All invalid user types have been fixed!');
    console.log('You can now run the migration: npm run migrate:auth\n');

  } catch (err) {
    console.error('❌ Error fixing user types:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserTypes();

