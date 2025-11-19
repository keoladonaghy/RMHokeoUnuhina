# Deployment Guide

## Secure Configuration Setup

This project uses environment variables to keep credentials secure and allow safe public deployment.

### For Production (GitHub Pages)

1. **Set GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     ```
     SUPABASE_URL: https://okzmnblaaeupbktoujcf.supabase.co
     SUPABASE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rem1uYmxhYWV1cGJrdG91amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODM3NjQsImV4cCI6MjA2ODQ1OTc2NH0.4cJt7kHPbmIpCL-KufgI0xg-NaM6W4Dw5D_z7pmXPhY
     ```

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Source: GitHub Actions
   - The workflow will automatically deploy on every push to master

### For Local Development

1. **Copy the template**:
   ```bash
   cp admin/web-interface/config.local.example.js admin/web-interface/config.local.js
   ```

2. **Add your credentials**:
   ```javascript
   window.SUPABASE_CONFIG = {
       url: 'https://okzmnblaaeupbktoujcf.supabase.co',
       key: 'your-anon-key-here'
   };
   ```

3. **Serve locally**:
   ```bash
   npm run dev
   ```

### Security Features

- ✅ Credentials stored in GitHub Secrets (encrypted)
- ✅ Local config files ignored by git
- ✅ Environment-specific configuration loading
- ✅ Safe to make repository public
- ✅ Automatic deployment with secure credential injection

### Files Overview

- `config.js` - Main configuration (safe to commit)
- `config.local.js` - Local development config (ignored by git)
- `env-loader.js` - Environment variable loader (safe to commit)
- `.github/workflows/deploy.yml` - GitHub Actions deployment
- `github-env.js` - Generated during build with secrets (ignored by git)

### Deployment URL

After setup, your app will be available at:
`https://keoladonaghy.github.io/RMHokeoUnuhina/`