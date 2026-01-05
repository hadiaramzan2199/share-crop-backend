# 🔒 Authentication & Authorization System Analysis

## Executive Summary
**Status: ⚠️ CRITICAL SECURITY ISSUES - NOT PRODUCTION READY**

Your current authentication system has **serious security vulnerabilities** and is missing essential features for a production-ready application. This document outlines all issues and required improvements.

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **Plain Text Password Storage** ❌
- **Location**: `routes/auth.js`, `routes/users.js`
- **Issue**: Passwords are stored and compared in **plain text**
- **Risk**: If database is compromised, all passwords are exposed
- **Current Code**:
  ```javascript
  // routes/auth.js - Line 9
  const user = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
  
  // routes/users.js - Line 142
  'INSERT INTO users (id, name, email, password, user_type) VALUES ($1, $2, $3, $4, $5)'
  ```
- **Required Fix**: Use bcrypt or argon2 for password hashing

### 2. **No JWT Token Generation** ❌
- **Location**: `routes/auth.js`
- **Issue**: Login endpoint doesn't generate JWT tokens (comment says "in a real app, you'd generate a JWT token")
- **Current Code**:
  ```javascript
  // Line 15-17
  // For simplicity, we're returning the user object directly. In a real app,
  // you'd generate a JWT token here and send it back.
  res.json({ user: user.rows[0], message: 'Login successful' });
  ```
- **Risk**: No secure session management, tokens can't be revoked
- **Required Fix**: Generate JWT tokens on login, refresh tokens for long sessions

### 3. **No Input Validation** ❌
- **Location**: All auth routes
- **Issue**: No validation for email format, password strength, SQL injection protection
- **Risk**: Invalid data, weak passwords, potential SQL injection
- **Required Fix**: Use express-validator or joi for validation

### 4. **No Rate Limiting** ❌
- **Issue**: Login/signup endpoints can be brute-forced
- **Risk**: Account takeover attacks
- **Required Fix**: Implement rate limiting (express-rate-limit)

### 5. **Auth Can Be Disabled** ⚠️
- **Location**: `src/middleware/auth/authenticate.js`, `attachUser.js`
- **Issue**: Multiple environment variables can disable authentication
- **Current Code**:
  ```javascript
  const authDisabled = process.env.AUTH_DISABLED === 'true' || 
                       process.env.DISABLE_AUTH === 'true' || 
                       process.env.APP_AUTH_DISABLED === 'true';
  ```
- **Risk**: Accidental deployment with auth disabled
- **Required Fix**: Only allow in development, add warnings

---

## 🟡 MISSING FEATURES

### 1. **No Signup/Registration Endpoint** ❌
- **Current**: Only `POST /api/users` exists (generic user creation)
- **Missing**: 
  - Dedicated `/api/auth/signup` or `/api/auth/register` endpoint
  - Email verification
  - Password confirmation
  - Terms acceptance
  - User type selection (farmer/buyer)
- **Required**: Create proper registration endpoint with validation

### 2. **No Password Reset** ❌
- **Missing**: 
  - Forgot password endpoint
  - Password reset token generation
  - Reset password endpoint
  - Email sending for reset links
- **Required**: Full password reset flow

### 3. **No Email Verification** ❌
- **Missing**: 
  - Email verification on signup
  - Verification token generation
  - Email sending service
  - Verified status in database
- **Required**: Email verification system

### 4. **No Session Management** ❌
- **Missing**: 
  - Token refresh mechanism
  - Token blacklisting (logout)
  - Session timeout
  - Remember me functionality
- **Required**: Proper session/token management

### 5. **No Account Security Features** ❌
- **Missing**: 
  - Two-factor authentication (2FA)
  - Login history/audit log
  - Suspicious activity detection
  - Account lockout after failed attempts
- **Required**: Basic security features

---

## 🟠 ROLE SYSTEM ISSUES

### 1. **Inconsistent Role Naming** ⚠️
- **Issue**: Mixed case usage
  - Database: `'farmer'`, `'buyer'` (lowercase)
  - Middleware: `'ADMIN'` (uppercase)
  - Code: Sometimes `user_type`, sometimes `role`
- **Current Code**:
  ```javascript
  // requireRole.js - Line 16
  const role = typeof user.user_type === 'string' ? user.user_type.toUpperCase() : null;
  if (role !== String(requiredRole).toUpperCase()) {
  ```
- **Risk**: Role checks may fail due to case mismatches
- **Required Fix**: Standardize role names (use enum/constants)

### 2. **No Admin Role in Database** ⚠️
- **Issue**: Database constraint only allows `'farmer'` and `'buyer'`
- **Current Schema**:
  ```sql
  CONSTRAINT users_user_type_check CHECK ((user_type = ANY (ARRAY['farmer'::text, 'buyer'::text])))
  ```
- **Problem**: Admin users can't be stored properly
- **Required Fix**: Add 'admin' to allowed user types

### 3. **No Role Hierarchy** ⚠️
- **Issue**: No concept of role permissions or hierarchy
- **Required**: Role-based access control (RBAC) system

---

## 📋 CURRENT IMPLEMENTATION STATUS

### ✅ What EXISTS:
1. **Basic Login Endpoint** (`POST /api/auth/login`)
   - Compares email/password (but plain text)
   - Returns user object

2. **JWT Verification Middleware** (`attachUser.js`)
   - Can verify JWT tokens
   - Fetches user from database
   - BUT: Login doesn't generate tokens!

3. **Role-Based Middleware** (`requireRole.js`)
   - Checks user roles
   - Blocks unauthorized access
   - BUT: Inconsistent role handling

4. **User Creation** (`POST /api/users`)
   - Creates users in database
   - BUT: No validation, no password hashing

5. **User Type System**
   - Database supports `user_type` field
   - Types: `'farmer'`, `'buyer'`
   - BUT: No `'admin'` type in constraint

### ❌ What's MISSING:
1. Password hashing (bcrypt/argon2)
2. JWT token generation on login
3. Signup/registration endpoint
4. Password reset functionality
5. Email verification
6. Input validation
7. Rate limiting
8. Session management
8. Admin role support in database
9. Role constants/enum
10. Security headers
11. CORS configuration review
12. Error handling improvements

---

## 🗄️ DATABASE SCHEMA ISSUES

### Users Table:
```sql
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL,  -- ⚠️ Should be hashed
    user_type text NOT NULL,  -- ⚠️ Missing 'admin' in constraint
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    coins integer DEFAULT 12500,
    is_active BOOLEAN DEFAULT TRUE,
    approval_status TEXT DEFAULT 'pending',
    approval_reason TEXT,
    documents_json JSONB
);
```

### Issues:
1. ❌ No `email_verified` field
2. ❌ No `password_reset_token` field
3. ❌ No `password_reset_expires` field
4. ❌ No `last_login` field
5. ❌ No `login_attempts` field
6. ❌ No `locked_until` field
7. ❌ No unique constraint on email (should have)
8. ❌ No index on email (performance)
9. ⚠️ `user_type` constraint doesn't include 'admin'

---

## 🎯 REQUIRED IMPROVEMENTS (Priority Order)

### **PRIORITY 1 - CRITICAL (Do First):**
1. ✅ Add password hashing (bcrypt)
2. ✅ Generate JWT tokens on login
3. ✅ Add input validation
4. ✅ Add email uniqueness constraint
5. ✅ Fix admin role in database

### **PRIORITY 2 - HIGH (Do Next):**
6. ✅ Create proper signup endpoint
7. ✅ Add password reset functionality
8. ✅ Add rate limiting
9. ✅ Standardize role system
10. ✅ Add email verification

### **PRIORITY 3 - MEDIUM (Do Later):**
11. ✅ Session management (refresh tokens)
12. ✅ Login history/audit logs
13. ✅ Account lockout mechanism
14. ✅ Security headers
15. ✅ 2FA (optional)

---

## 📦 REQUIRED DEPENDENCIES

### Backend:
```json
{
  "bcrypt": "^5.1.1",           // Password hashing
  "jsonwebtoken": "^9.0.2",     // JWT tokens
  "express-validator": "^7.0.1", // Input validation
  "express-rate-limit": "^7.1.5", // Rate limiting
  "nodemailer": "^6.9.7",      // Email sending (for verification/reset)
  "uuid": "^9.0.1"             // Token generation
}
```

### Environment Variables Needed:
```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
EMAIL_SERVICE=gmail  # or smtp
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=5    # 5 attempts per window
```

---

## 🏗️ RECOMMENDED ARCHITECTURE

### Auth Flow:
```
1. Signup → Validate → Hash Password → Create User → Send Verification Email
2. Login → Validate → Check Password → Generate JWT → Return Token
3. Protected Routes → Verify JWT → Check Role → Allow/Deny
4. Password Reset → Generate Token → Send Email → Verify Token → Reset Password
```

### File Structure:
```
routes/
  auth.js              # Login, signup, password reset
  users.js             # User CRUD (protected)

src/middleware/auth/
  authenticate.js      # Verify JWT
  requireRole.js       # Check roles
  rateLimiter.js       # Rate limiting
  validateInput.js     # Input validation

src/services/
  authService.js       # Auth business logic
  emailService.js      # Email sending
  tokenService.js      # JWT generation/verification

src/utils/
  roles.js             # Role constants
  validators.js        # Validation schemas
```

---

## ⚠️ PRODUCTION READINESS CHECKLIST

Before deploying to production, you MUST:

- [ ] Implement password hashing
- [ ] Generate JWT tokens
- [ ] Add input validation
- [ ] Add rate limiting
- [ ] Create signup endpoint
- [ ] Add password reset
- [ ] Fix admin role in database
- [ ] Add email uniqueness constraint
- [ ] Standardize role system
- [ ] Add security headers
- [ ] Review CORS settings
- [ ] Set secure JWT_SECRET
- [ ] Add error logging
- [ ] Add request logging
- [ ] Test all auth flows
- [ ] Security audit

---

## 📝 NOTES

- Current system works for **development only**
- **DO NOT** deploy to production without fixes
- Consider using a library like Passport.js for more features
- Consider OAuth2 for social login (Google, Facebook)
- Consider using a service like Auth0 or Firebase Auth for faster implementation

---

**Generated**: 2025-01-05
**Status**: Needs Complete Overhaul

