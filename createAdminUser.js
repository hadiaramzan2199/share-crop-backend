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

async function createAdmin() {
  try {
    console.log('🔐 Create Admin User\n');

    const name = await question('Enter admin name: ');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required!');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters!');
      rl.close();
      return;
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      console.log('❌ Email already exists!');
      rl.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password, user_type, email_verified, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'admin', $4, $5, NOW())
       RETURNING id, name, email, user_type`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        hashedPassword,
        true,  // email_verified
        true,  // is_active
      ]
    );

    const admin = result.rows[0];
    console.log('\n✅ Admin user created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Type: ${admin.user_type}`);
    console.log('\n📝 You can now login with this email and password.');

  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

createAdmin();

