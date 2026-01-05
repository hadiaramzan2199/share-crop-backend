# 🔐 How to Login as Admin

## Option 1: Create Admin User via Script (Recommended)

I've created a script to easily create an admin user:

```bash
node createAdminUser.js
```

This will prompt you for:
- Admin name
- Admin email
- Admin password

Then you can login at `/login` with those credentials.

---

## Option 2: Create Admin via API

You can create an admin user directly via the signup API:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@sharecrop.com",
    "password": "your-secure-password",
    "user_type": "admin"
  }'
```

Then login at `/login` with those credentials.

---

## Option 3: Create Admin Directly in Database

If you have database access:

```sql
-- Hash a password first (use bcrypt, or use the script above)
-- For example, password "admin123" hashed:
INSERT INTO users (id, name, email, password, user_type, email_verified, is_active, created_at)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@sharecrop.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyY5Y5Y5Y5Y5', -- Replace with actual bcrypt hash
  'admin',
  true,
  true,
  NOW()
);
```

**Note:** You need to hash the password first. Use the script in Option 1 for this.

---

## Option 4: Update Existing User to Admin

If you already have a user and want to make them admin:

```sql
UPDATE users 
SET user_type = 'admin' 
WHERE email = 'your-existing-email@example.com';
```

Then login with that email and password.

---

## After Creating Admin

1. Go to `/login` page
2. Enter admin email and password
3. You'll be redirected to `/admin` dashboard

---

## Quick Test Admin

For quick testing, you can use the script:

```bash
node createAdminUser.js
```

Enter:
- Name: `Admin`
- Email: `admin@test.com`
- Password: `admin123`

Then login at `/login` with `admin@test.com` / `admin123`

---

## Important Notes

- Admin signup is disabled in the UI (for security)
- Use the script or API to create admin users
- Make sure to use a strong password
- Admin users have access to `/admin/*` routes

