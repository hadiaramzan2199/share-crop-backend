require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const client = await pool.connect();
  try {
    const email = 'admin@sharecrop.farm';
    const password = '31Maggiorana+';
    const name = 'Admin User';

    console.log('🔐 Creating admin user...\n');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}\n`);

    // Check if email already exists
    const existing = await client.query('SELECT id, name, user_type FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      console.log('⚠️  Email already exists!');
      console.log(`   Current user: ${existingUser.name} (${existingUser.user_type})`);
      
      // Check if it's already admin
      if (existingUser.user_type === 'admin') {
        console.log('\n✅ User is already an admin!');
        console.log('   You can login with these credentials.');
        
        // Update password if needed
        const updatePassword = await client.query('SELECT password FROM users WHERE email = $1', [email]);
        const currentPassword = updatePassword.rows[0].password;
        
        // Check if password is already hashed
        if (!currentPassword.startsWith('$2')) {
          console.log('\n🔧 Updating password to hashed version...');
          const hashedPassword = await bcrypt.hash(password, 12);
          await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
          console.log('✅ Password updated!');
        }
        
        return;
      } else {
        // Update to admin
        console.log('\n🔧 Updating user to admin...');
        const hashedPassword = await bcrypt.hash(password, 12);
        await client.query(
          'UPDATE users SET user_type = $1, password = $2, email_verified = $3, is_active = $4 WHERE email = $5',
          ['admin', hashedPassword, true, true, email]
        );
        console.log('✅ User updated to admin!');
        console.log('\n📝 You can now login with these credentials.');
        return;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const result = await client.query(
      `INSERT INTO users (id, name, email, password, user_type, email_verified, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'admin', $4, $5, NOW())
       RETURNING id, name, email, user_type, created_at`,
      [
        name,
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
    console.log(`   Created: ${admin.created_at}`);
    console.log('\n📝 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 You can now login at: http://localhost:3000/login');

  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    if (err.code === '23505') {
      console.error('   Email already exists in database');
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();

