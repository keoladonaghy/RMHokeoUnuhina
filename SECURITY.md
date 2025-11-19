# Security Policy

## 🔒 Security Overview

This project handles translation data for educational applications. While the data is not highly sensitive, proper security practices protect your infrastructure and maintain data integrity.

## ⚠️ Known Security Issues (Fixed)

### Previous Vulnerabilities

The following security issues existed in earlier versions and have been addressed:

1. **Exposed Supabase Credentials** (CRITICAL - FIXED)
   - **Issue**: Supabase URL and anon key were committed to version control
   - **Fix**: Credentials moved to `.env` and `config.js` (both in `.gitignore`)
   - **Action Required**: Use template files to configure your credentials securely

2. **Overly Permissive RLS Policies** (HIGH - FIXED)
   - **Issue**: Database policies allowed all operations with `USING (true)`
   - **Fix**: Implemented proper read-only access for public, write access requires auth
   - **File**: `admin/supabase/03-security-improvements.sql`

3. **Insecure Credential Storage** (HIGH - FIXED)
   - **Issue**: Credentials stored in plain text in localStorage
   - **Fix**: Configuration now uses template files, credentials kept out of VCS
   - **Recommendation**: Implement proper authentication for production

## 🔧 Setting Up Your Configuration

### Configure Your Local Environment

1. **Update `.env` file**:
   ```bash
   cd admin/supabase
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Update `config.js`**:
   ```bash
   cd admin/web-interface
   cp config.example.js config.js
   # Edit config.js with your Supabase credentials
   ```

### Apply Security Improvements

Run the security improvements SQL script in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
-- admin/supabase/03-security-improvements.sql
```

This script:
- Removes overly permissive policies
- Implements read-only access for public users
- Requires authentication for write operations
- Adds database constraints and indexes
- Creates audit logging system

### Verify Security Setup

1. **Test public read access** (should work with anon key):
   ```javascript
   // This should work:
   const { data } = await supabase
     .from('translations')
     .select('*')
     .eq('is_approved', true);
   ```

2. **Test write protection** (should fail with anon key):
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

3. **Monitor credential usage**
   - Review access logs regularly
   - Monitor for unusual activity
   - Update credentials if compromised

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
- [ ] Monitor credential usage and access logs
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

If credentials are compromised:

1. **Immediately update** the exposed credentials in Supabase Dashboard
2. **Review audit logs** for unauthorized access
3. **Update all local configuration files** with new credentials
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
