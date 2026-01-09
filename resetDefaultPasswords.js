require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');

async function resetDefaultPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔐 Resetting default user passwords...\n');

    const users = [
      { email: 'farmer@example.com', password: 'farmer123', name: 'Farmer Mock' },
      { email: 'dummy@example.com', password: 'buyer123', name: 'Dummy User' },
    ];

    for (const userData of users) {
      // Check if user exists
      const userCheck = await client.query('SELECT id, email, name, user_type FROM users WHERE email = $1', [userData.email.toLowerCase()]);
      
      if (userCheck.rows.length === 0) {
        console.log(`⚠️  User not found: ${userData.email}`);
        continue;
      }

      const user = userCheck.rows[0];
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Update password
      await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, userData.email.toLowerCase()]);

      console.log(`✅ Reset password for: ${userData.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   New Password: ${userData.password}`);
      console.log('');
    }

    console.log('📝 Login credentials:');
    console.log('   farmer@example.com / farmer123');
    console.log('   dummy@example.com / buyer123');
    console.log('\n✅ All passwords reset successfully!');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDefaultPasswords();

