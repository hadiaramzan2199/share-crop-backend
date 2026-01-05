# 🔐 Simple Authentication Explanation

## What is JWT? (Simple Explanation)

**JWT = JSON Web Token** - Think of it like a **temporary ID card** for your users.

### Why JWT?
- **Without JWT**: User logs in → Server remembers them (needs to store sessions)
- **With JWT**: User logs in → Server gives them a "token" (like a ticket) → User shows token on every request → Server knows who they are

### JWT Secret Key - Where to Get It?

**You create it yourself!** It's just a random string (like a password).

**How to create one:**
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use online generator
# Go to: https://randomkeygen.com/
# Copy any "CodeIgniter Encryption Keys" (64 characters)

# Option 3: Just make one up (but make it long and random)
# Example: "my-super-secret-key-for-sharecrop-2025-change-this-in-production-abc123xyz"
```

**That's it!** Just put it in your `.env` file:
```env
JWT_SECRET=your-random-string-here
```

---

## Email Integration - Do You Need It?

### **For Now: NO!** ✅

You can skip email verification for now. Here's what we'll do:

### **Phase 1 (Now) - Basic Auth:**
- ✅ Signup (no email verification needed)
- ✅ Login (with password hashing)
- ✅ JWT tokens
- ✅ Roles (admin, farmer, buyer)
- ❌ Email verification (skip for now)
- ❌ Password reset via email (skip for now)

### **Phase 2 (Later) - Add Email:**
- Email verification (when you're ready)
- Password reset (when you have email service)

---

## What We Actually Need (Simplified)

### **Backend Dependencies:**
```json
{
  "bcrypt": "^5.1.1",        // Hash passwords (REQUIRED for security)
  "jsonwebtoken": "^9.0.2"  // Create JWT tokens (REQUIRED)
}
```

**That's it!** No email libraries needed for now.

### **Environment Variables:**
```env
# Required
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRES_IN=24h

# Optional (for later)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-password
```

---

## How JWT Works (Simple Flow)

### **1. User Signs Up:**
```
User → POST /api/auth/signup
  → Server hashes password
  → Saves user to database
  → Returns success
```

### **2. User Logs In:**
```
User → POST /api/auth/login (email + password)
  → Server checks password
  → Server creates JWT token (like a ticket)
  → Returns token to user
```

### **3. User Makes Request:**
```
User → GET /api/fields (with token in header)
  → Server checks token
  → Server knows who user is
  → Returns data
```

---

## Database Fields We Need (Simplified)

### **Required Now:**
- ✅ `email` (unique)
- ✅ `password` (will be hashed)
- ✅ `user_type` ('farmer', 'buyer', 'admin')
- ✅ `email_verified` (set to FALSE for now, verify later)

### **Optional (Can Add Later):**
- `email_verification_token` (for email verification - later)
- `password_reset_token` (for password reset - later)
- `last_login` (nice to have)
- `login_attempts` (security - can add later)

---

## Simple Implementation Plan

### **Step 1: Database** ✅ (Already done)
- Run the migration we created

### **Step 2: Install Dependencies**
```bash
npm install bcrypt jsonwebtoken
```

### **Step 3: Create Simple Auth APIs**
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user (using JWT)

### **Step 4: Update Middleware**
- Use JWT to verify users
- Check roles (admin, farmer, buyer)

---

## What About Email?

### **For Now:**
- Users can signup without email verification
- Set `email_verified = false` for all new users
- Later, you can add email verification when ready

### **When You're Ready for Email:**
1. Choose email service (Gmail, SendGrid, Mailgun, etc.)
2. Install `nodemailer` package
3. Add email sending code
4. Update signup to send verification email
5. Add email verification endpoint

**But for now, we skip all email stuff!** ✅

---

## Summary

### **What You Need:**
1. ✅ JWT Secret (just a random string you create)
2. ✅ bcrypt (hash passwords)
3. ✅ jsonwebtoken (create tokens)
4. ❌ Email service (skip for now)

### **What We'll Build:**
1. Signup API (no email verification)
2. Login API (returns JWT token)
3. Protected routes (check JWT)
4. Role checking (admin, farmer, buyer)

**Simple and secure!** No complex email stuff. 🎯

