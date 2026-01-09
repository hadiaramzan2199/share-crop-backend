require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    console.log('🔐 Reset User Password\n');

    const email = await question('Enter user email: ');
    const newPassword = await question('Enter new password: ');

    if (!email || !newPassword) {
      console.log('❌ Email and password are required!');
      rl.close();
      return;
    }

    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters!');
      rl.close();
      return;
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, email, name, user_type FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length === 0) {
      console.log('❌ User not found!');
      rl.close();
      return;
    }

    const user = userCheck.rows[0];
    console.log(`\n📧 User found: ${user.name} (${user.user_type})`);

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email.toLowerCase().trim()]);

    console.log('\n✅ Password reset successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('\n📝 You can now login with these credentials.');

  } catch (err) {
    console.error('❌ Error resetting password:', err.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

resetPassword();

