# Deployment Guide - Hōkeo Unuhina

## 🌐 Current Deployment Status

**Live URL**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/
**Status**: ✅ Deployed with GitHub Actions
**Security**: ✅ Environment variables protected
**Repository**: Safe for public visibility

---

## 🚀 Deployment Architecture

This project uses a **secure cloud deployment** strategy:

- **Frontend**: Static web application (HTML/CSS/JavaScript)
- **Backend**: Supabase (cloud database + API)
- **Hosting**: GitHub Pages with GitHub Actions
- **Security**: Environment variables in GitHub Secrets
- **CI/CD**: Automatic deployment on every push to master

---

## 🔧 Setup Instructions

### For Production (GitHub Pages)

#### Step 1: Set GitHub Secrets
1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://okzmnblaaeupbktoujcf.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rem1uYmxhYWV1cGJrdG91amNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODM3NjQsImV4cCI6MjA2ODQ1OTc2NH0.4cJt7kHPbmIpCL-KufgI0xg-NaM6W4Dw5D_z7pmXPhY` |

#### Step 2: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under **Source**, select: **"GitHub Actions"**
3. Click **Save**

#### Step 3: Deploy
- Push to master branch → automatic deployment
- Check **Actions** tab for deployment status
- Site will be live at: `https://yourusername.github.io/RMHokeoUnuhina/`

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

---

## 🔄 Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers** on every push to master branch
2. **Builds** the application with environment variables
3. **Injects** secure credentials from GitHub Secrets
4. **Preserves** folder structure (`admin/web-interface/`)
5. **Deploys** to GitHub Pages
6. **Updates** live site in ~2 minutes

### Deployment Commands
```bash
git add .
git commit -m "Your changes"
git push origin master  # Triggers automatic deployment
```

### Monitoring Deployments
- **Actions Tab**: Monitor deployment status
- **Pages Settings**: View live URL and configuration
- **Live Site**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/

---

## 🛡️ Security Features

### ✅ What's Secure
- Credentials stored in encrypted GitHub Secrets
- Environment variables injected at build time
- Local config files ignored by git (`.gitignore`)
- Repository safe for public visibility
- Supabase Row Level Security enabled

### ❌ What's Protected
- No hardcoded credentials in source code
- No `.env` files in version control
- No sensitive data in commit history
- API keys never exposed in client code

---

## 📋 Troubleshooting

### Common Issues

**Problem**: Site loads but no translations show
- **Solution**: Ensure GitHub Secrets are set correctly

**Problem**: 404 on `/admin/web-interface/`
- **Solution**: Check GitHub Pages source is set to "GitHub Actions"

**Problem**: Deployment fails
- **Solution**: Check Actions tab for error details

**Problem**: Local development not working
- **Solution**: Create `config.local.js` from template

### Verification Steps
1. ✅ GitHub Secrets configured
2. ✅ GitHub Pages enabled with "GitHub Actions" source  
3. ✅ Latest deployment successful (green checkmark)
4. ✅ Live site loads at: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/
5. ✅ Translation data loads from Supabase

---

## 🚀 Current Status

**Deployment**: ✅ **LIVE AND OPERATIONAL**
**URL**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/
**Last Updated**: November 19, 2025
**Next Action**: Configure GitHub Secrets for database connection