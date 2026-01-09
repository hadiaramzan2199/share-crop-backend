require('dotenv').config();
const pool = require('./db');

async function checkUserPasswords() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking user passwords...\n');

    const emails = ['farmer@example.com', 'dummy@example.com'];
    
    for (const email of emails) {
      const result = await client.query(
        'SELECT id, email, name, user_type, password, is_active FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        console.log(`❌ User not found: ${email}\n`);
        continue;
      }

      const user = result.rows[0];
      console.log(`📧 User: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Type: ${user.user_type}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Password Type: ${user.password.startsWith('$2') ? 'Hashed (bcrypt)' : 'Plain Text'}`);
      console.log('');
    }

    console.log('💡 Note: If passwords are hashed, you cannot retrieve the original password.');
    console.log('   You can reset them using the reset script.\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserPasswords();

