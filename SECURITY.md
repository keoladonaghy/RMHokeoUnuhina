# Security Policy

## 🔒 Security Overview

This project handles translation data for educational applications. While the data is not highly sensitive, proper security practices protect your infrastructure and maintain data integrity.

## ⚠️ Known Security Issues (Fixed)

### Previous Vulnerabilities

The following security issues existed in earlier versions and have been addressed:

1. **Exposed Supabase Credentials** (CRITICAL - FIXED)
   - **Issue**: Supabase URL and anon key were committed to version control
   - **Fix**: Credentials moved to `.env` and `config.js` (both in `.gitignore`)
   - **Action Required**: Rotate your Supabase anon key if you cloned before this fix

2. **Overly Permissive RLS Policies** (HIGH - FIXED)
   - **Issue**: Database policies allowed all operations with `USING (true)`
   - **Fix**: Implemented proper read-only access for public, write access requires auth
   - **File**: `admin/supabase/03-security-improvements.sql`

3. **Insecure Credential Storage** (HIGH - FIXED)
   - **Issue**: Credentials stored in plain text in localStorage
   - **Fix**: Configuration now uses template files, credentials kept out of VCS
   - **Recommendation**: Implement proper authentication for production

## 🚨 If You Cloned This Repository

**IMMEDIATE ACTION REQUIRED** if you cloned before Nov 15, 2025:

### Step 1: Rotate Your Supabase Credentials

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   ```

2. **Reset the anon/public key**
   - Click "Reset API Key"
   - Confirm the reset
   - Copy the new key immediately

3. **Do NOT reset the service_role key** (unless you're certain you need to)
   - Service role key is for backend operations only
   - Resetting it may break existing backend services

### Step 2: Update Your Local Configuration

1. **Update `.env` file** (create from template if needed):
   ```bash
   cd admin/supabase
   cp .env.example .env
   # Edit .env with your NEW credentials
   ```

2. **Update `config.js`** (create from template if needed):
   ```bash
   cd admin/web-interface
   cp config.example.js config.js
   # Edit config.js with your NEW credentials
   ```

### Step 3: Apply Security Improvements

Run the security improvements SQL script:

```sql
-- In Supabase SQL Editor, run:
-- admin/supabase/03-security-improvements.sql
```

This script:
- Removes overly permissive policies
- Implements read-only access for public
- Requires authentication for write operations
- Adds database constraints
- Creates audit logging

### Step 4: Verify Security

1. **Test with anon key** (should work for reading approved translations):
   ```javascript
   // This should work:
   const { data } = await supabase
     .from('translations')
     .select('*')
     .eq('is_approved', true);
   ```

2. **Test write operations** (should fail with anon key):
   ```javascript
   // This should fail (requires authentication):
   const { error } = await supabase
     .from('translations')
     .insert({ value: 'test' });
   // Expected: RLS policy violation
   ```

## 🛡️ Security Best Practices

### For Development

1. **Never commit credentials**
   - Always use `.env` and `config.js` (in `.gitignore`)
   - Use `.example` files with placeholders for templates

2. **Use environment-specific credentials**
   - Development database for testing
   - Production database for live applications
   - Never mix the two

3. **Rotate credentials regularly**
   - Every 90 days minimum
   - Immediately if exposed
   - After team member changes

### For Production

1. **Implement Authentication**
   ```javascript
   // Use Supabase Auth for admin interface
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
       // Redirect to login
   }
   ```

2. **Use Row Level Security**
   - Already implemented in `03-security-improvements.sql`
   - Review policies regularly
   - Test with different user roles

3. **Enable Audit Logging**
   - Already included in security improvements
   - Monitor `translation_audit` table
   - Set up alerts for suspicious activity

4. **Implement Rate Limiting**
   - Use Supabase's built-in rate limiting
   - Configure in Dashboard > Settings > API

5. **Use HTTPS Only**
   - Ensure all API calls use HTTPS
   - Configure CORS appropriately

### For Client Applications

1. **Never expose service_role key**
   - Use anon key for client-side code only
   - Service role key is for backend/server-side only

2. **Implement caching**
   - Reduces API calls
   - Improves performance
   - Already implemented in `client-libraries/polynesian-translations.js`

3. **Validate user input**
   - Already implemented in web interface
   - Add additional validation in your applications

## 🔍 Security Checklist

Use this checklist when setting up or auditing the system:

### Initial Setup
- [ ] Created Supabase project
- [ ] Copied `.env.example` to `.env` with real credentials
- [ ] Copied `config.example.js` to `config.js` with real credentials
- [ ] Added `.env` and `config.js` to `.gitignore`
- [ ] Ran `01-create-tables.sql` to create database schema
- [ ] Ran `03-security-improvements.sql` to apply security policies
- [ ] Verified anon key cannot write data
- [ ] Tested read access works correctly

### Production Deployment
- [ ] Set up Supabase Auth
- [ ] Implemented authentication in web interface
- [ ] Configured CORS in Supabase dashboard
- [ ] Enabled rate limiting
- [ ] Set up monitoring and alerts
- [ ] Documented admin user management process
- [ ] Created backup and recovery plan

### Regular Maintenance
- [ ] Review audit logs monthly
- [ ] Rotate credentials every 90 days
- [ ] Update dependencies regularly
- [ ] Monitor Supabase dashboard for anomalies
- [ ] Review and update RLS policies as needed

## 🐛 Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. **Contact the maintainer directly** (private email/message)
3. **Provide detailed information**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## 📋 Security Incident Response

If credentials are exposed:

1. **Immediately rotate** the exposed credentials
2. **Review audit logs** for unauthorized access
3. **Update all deployments** with new credentials
4. **Notify affected users** if data was accessed
5. **Document the incident** and lessons learned

## 🔐 Authentication Implementation Guide

To add authentication to the web interface:

### 1. Enable Auth in Supabase
```
Dashboard > Authentication > Settings
Enable Email provider (or others)
```

### 2. Create Admin Users
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@example.com', crypt('your-password', gen_salt('bf')));
```

### 3. Update Web Interface

Add to `admin/web-interface/app.js`:

```javascript
class TranslationManager {
    async initialize() {
        // Check authentication
        const { data: { user } } = await this.supabase.auth.getUser();

        if (!user) {
            // Redirect to login page
            window.location.href = 'login.html';
            return;
        }

        // Continue with normal initialization
        await this.loadProjects();
        // ...
    }
}
```

### 4. Create Login Page

Create `admin/web-interface/login.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Translation Manager - Login</title>
</head>
<body>
    <form id="login-form">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="config.js"></script>
    <script>
        const supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert('Login failed: ' + error.message);
            } else {
                window.location.href = 'index.html';
            }
        });
    </script>
</body>
</html>
```

## 📖 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/auth-helpers/overview)
- [Row Level Security Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated**: November 15, 2025
**Security Version**: 1.0
