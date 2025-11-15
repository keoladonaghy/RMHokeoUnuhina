#  RM Hōkea ʻUnuhina Translation System - Discussion Notes

## Date: October 12, 2025

## System Overview

This document captures our discussion about implementing a centralized translation management system for Hawaiian and Polynesian language applications.

### Core Architecture

**Platform Stack:**
- **RMUTS**: Translation management platform (web interface)
- **Railway**: Docker container hosting ($5-15/month)
- **Supabase**: PostgreSQL database (Free tier - 500MB)
- **Vercel**: Frontend application hosting

**Supported Languages:**
- Hawaiian (haw)
- English (en)
- Māori (mao)
- Tahitian (tah)
- French (fr)
- Spanish (es)

### Target Projects
1. **JEMT4** - Hawaiian Music Theory application
2. **Word Games** - Hawaiian language learning games
3. **Huapala** - Hawaiian music project

---

## Key Discussion Points

### 1. Translation Update Strategy

**Challenge**: Balance between fresh translations and server load

**Solution Approach:**
- Implement caching strategy instead of loading translations on every page view
- Check for updates once daily or once weekly when user logs in
- Cache translations locally in browser/app storage
- Optional manual refresh button for immediate updates

**Benefits:**
- Reduces load on RMHTS API and database
- Users still get regular updates
- Better performance for end users

### 2. API Integration Method

**Current State**: Static JSON files for translations

**RMHTS Integration:**
- Replace JSON file imports with API calls
- Use i18next with HTTP backend
- Call RMHTS export endpoints (e.g., `/api/projects/{projectId}/export/settings.json`)
- Maintain existing JSON structure and key naming
- Minimal code changes required

**Example Structure:**
```javascript
// Instead of: import settingsEn from './i18n/settings.en.json'
// Use: API call to RMHTS endpoint returns same JSON structure
```

### 3. Shared Translation Strings (Common Namespace)

**Problem Identified:**
Many UI elements appear across multiple applications and contexts:
- "Okay" / "Cancel" buttons
- "Save" / "Delete" actions
- Common navigation terms
- Standard UI labels

**RMHTS Solution:**
- Create a "common" namespace for universal terms
- All projects reference the same shared translations
- Define each term once in Hawaiian
- Automatic consistency across all applications
- Updates propagate everywhere simultaneously

**Namespace Organization:**
```
common/
  ├── ui.okay
  ├── ui.cancel
  ├── ui.save
  └── ui.delete

project-specific/
  ├── music.terms
  └── game.mechanics
```

### 4. Context-Dependent Translations

**Challenge:**
Some English words have multiple meanings requiring different Hawaiian translations

**Example:**
- "Play" (music) vs "Play" (game)
- Different Hawaiian words needed for each context

**Solution:**
- Use separate translation keys: `music.play` and `game.play`
- Add context notes in RMHTS for translators
- Provides clarity for accurate Hawaiian translation choices

### 5. Language Source Flexibility

**Capability:**
- Set project-wide base language (typically English)
- Override specific terms to translate from different source languages
- Example: Italian musical terms, other Polynesian languages for cultural concepts

**Use Case:**
Hawaiian music terminology might be better translated from original cultural sources rather than through English

### 6. Strategic Planning Considerations

#### Moving Strings Between Namespaces

**Future Need Identified:**
Ability to promote project-specific translations to shared common namespace

**Scenario:**
1. Start development with project-specific translation: `game1.settings.save`
2. Later realize term is universal across multiple games
3. Need to move to shared namespace: `common.ui.save`
4. Other projects can then reuse the translation

**Implementation Notes:**
- RMHTS web interface should support moving/copying keys between namespaces
- Requires updating app code to reference new common namespace keys
- Important for scalability as project portfolio grows

#### Refactoring Considerations

**Planning Ahead:**
- Identify obvious common elements upfront (UI terms, numbers, dates)
- Create shared namespaces from day one
- Reduces future refactoring work

**If Refactoring Needed:**
- Move translations from project-specific to shared namespace
- Update all application codebases to reference new keys
- Coordinate updates across multiple apps
- Doable but requires careful planning

---

## Benefits of Centralized System

1. **Single Source of Truth**: All translations managed in one place
2. **Consistency**: Shared terms translated once, used everywhere
3. **Efficiency**: Translators don't duplicate work
4. **Real-time Updates**: Changes propagate without redeployment
5. **Collaboration**: Multiple translators can work simultaneously
6. **Version Control**: Track translation changes over time
7. **Scalability**: Easy to add new projects and languages

---

## Implementation Strategy

### Phase 1: Foundation
- Set up Supabase database
- Deploy RMHTS on Railway
- Configure initial admin access

### Phase 2: Migration
- Import existing JSON translations
- Organize into common vs project-specific namespaces
- Identify shared UI elements

### Phase 3: Integration
- Update JEMT4 with i18next HTTP backend
- Implement caching strategy
- Add language switching functionality

### Phase 4: Expansion
- Add word games project
- Implement namespace sharing
- Expand to additional Polynesian languages

### Phase 5: Optimization
- Fine-tune caching intervals
- Monitor API performance
- Refine namespace organization based on usage

---

## Follow-up Discussion - October 12, 2025 (Continued)

### JSON File Consolidation Strategy

**Current State Analysis:**
- Multiple JSON files across various projects
- Different completion levels (some incomplete)
- Mixed language combinations:
  - Some files: Hawaiian + English
  - Some files: Hawaiian + English + Māori
  - Inconsistent structure and coverage

**Identified Need: Intermediate Preparation Phase**

Before importing into RMHTS, requires systematic file preparation:

1. **Create Standard Format Template**
   - Define consistent naming conventions
   - Establish namespace structure rules
   - Plan for all future languages (even if not immediately developed)
   - Create conversion template for existing files

2. **File-by-File Processing**
   - Inventory existing JSON files
   - Audit language coverage gaps
   - Standardize key naming across files
   - Restructure to match template format

3. **Strategic Considerations**
   - Account for future language expansion
   - Prevent need for later restructuring
   - Ensure clean import into RMHTS
   - Avoid creating organizational mess

**Next Steps:**
- Complete file inventory when back at computer
- Define standard format specification
- Systematically convert each file to standard
- Prepare consolidated files for RMHTS import

### Custom LLM Integration Planning

**Question Raised:**
Integration possibilities between RMHTS and custom Polynesian language LLM currently in development.

**Current Understanding:**
- RMHTS supports major translation services (Google Translate, AWS Translate)
- Uses standard translation API interfaces
- Custom providers possible if API-compatible

**Strategic Opportunity:**
Design custom Polynesian LLM with RMHTS compatibility from the beginning

**Benefits of Custom LLM Integration:**
- Superior accuracy for Hawaiian and Polynesian languages
- Cultural and linguistic nuance understanding
- Better than mainstream translation services
- Powerful differentiator for underserved languages

**Design Considerations:**
- Research RMHTS's translation provider API specifications
- Build compatible request/response formats into LLM design
- Plan API endpoints during LLM architecture phase
- Ensure seamless integration when both systems ready

**Current Status:**
- LLM still in design phase (no model selected yet)
- API design to be incorporated into overall project planning
- Translation integration as key application consideration

**Future Planning:**
- Include translation API compatibility in LLM architecture
- Research RMHTS translation provider specifications
- Design endpoints for seamless integration
- Other LLM applications to be discussed in future

### RMHTS Deployment Clarification

**Question:** Is RMHTS a GitHub repo that needs to be forked?

**Answer:** No forking required!

- RMHTS is deployed using official Docker image: `RMHTS/RMHTS:latest`
- Create simple repository with configuration files only:
  - Dockerfile (references official image)
  - config.yaml (custom configuration)
  - railway.toml (Railway deployment settings)
- No need to fork entire RMHTS codebase
- Deploy pre-built container to Railway
- Configure with Supabase database connection

**Deployment Approach:**
- Use official Docker image as-is
- Add only your configuration files
- Simple, clean deployment without managing RMHTS source code

---

## Open Questions for Future Discussion

1. Specific caching implementation details (localStorage vs IndexedDB?)
2. Exact update frequency (daily vs weekly check?)
3. Fallback strategy if RMHTS API is unavailable
4. Permission model for translators and reviewers
5. Machine translation workflow for initial drafts
6. Review process for Hawaiian language accuracy
7. Standard format specification for JSON file consolidation
8. Custom LLM applications beyond translation

---

## Cost Estimates

- **Supabase**: Free tier (sufficient for current needs)
- **Railway**: $5-15/month
- **Vercel**: Free tier (hobby projects)
- **Domain** (optional): $10-15/year
- **Total Annual**: $60-200/year

---

## Next Steps

1. Review RMHTS's web interface documentation for namespace management features
2. Test caching strategies with prototype implementation
3. Create initial list of common UI terms for shared namespace
4. Develop naming conventions for translation keys
5. Plan migration timeline for existing JSON files
6. Inventory existing JSON files and language coverage
7. Define standard format template for all translations
8. Research RMHTS translation provider API for custom LLM integration

---

## Deployment Implementation Guide

### Option A: Supabase Database Setup

#### 1. Supabase Project Configuration

**Create Project:**
- Login to https://supabase.com/dashboard
- Click "New Project" or select existing project
- Note the project reference ID and region

**Database Setup:**
```sql
-- In Supabase SQL Editor, create dedicated database (optional)
CREATE DATABASE RMHTS_translations;
-- Or use the default 'postgres' database
```

**Get Connection Details:**
- Navigate to Settings → Database
- Copy the Connection String (URI format)
- Note both direct and pooled connection options
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Security Configuration:**
- Settings → Authentication → URL Configuration
- Add Railway IP ranges to allowed connections (if using Railway)
- Enable Row Level Security if needed for multi-tenant setup

#### 2. Environment Variables for Supabase
```env
# Database Connection
POSTGRES_HOST=db.xxx.supabase.co
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_supabase_password
POSTGRES_PORT=5432
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Optional: Connection Pooling
POSTGRES_POOLED_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Option B: Generic PostgreSQL Database Setup

#### 1. Hosting Platform Database Creation

**Through cPanel/Plesk/Admin Panel:**
- Create new PostgreSQL database
- Create dedicated database user
- Grant full permissions to user for the database
- Note the database server hostname

**Common Hosting Platforms:**
- **Shared Hosting**: Usually provides PostgreSQL through admin panel
- **VPS/Dedicated**: Direct PostgreSQL installation and configuration
- **Managed Hosting**: Database-as-a-Service options

#### 2. Database Configuration

**Required Database Setup:**
```sql
-- Connect to your PostgreSQL database
-- Ensure UTF-8 encoding for international character support
CREATE DATABASE RMHTS_translations 
  WITH ENCODING 'UTF8' 
  LC_COLLATE = 'en_US.UTF-8' 
  LC_CTYPE = 'en_US.UTF-8';

-- Create dedicated user (if not done through hosting panel)
CREATE USER RMHTS_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE RMHTS_translations TO RMHTS_user;
```

**Connection Testing:**
```bash
# Test connection from your local machine
psql -h your-hosting-server.com -U RMHTS_user -d RMHTS_translations
```

#### 3. Environment Variables for Generic PostgreSQL
```env
# Database Connection
POSTGRES_HOST=your-hosting-server.com
POSTGRES_DATABASE=RMHTS_translations
POSTGRES_USER=RMHTS_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_PORT=5432
POSTGRES_URL=postgresql://RMHTS_user:your_secure_password@your-hosting-server.com:5432/RMHTS_translations
```

### Railway Deployment Setup

#### 1. Railway Account and Project Setup

**Account Creation:**
- Sign up at https://railway.app
- Connect GitHub account for deployment integration
- Verify account (may require payment method for resource usage)

**Project Creation:**
- Click "New Project"
- Choose "Deploy from GitHub repo"
- Create new repository or select existing one
- Railway will auto-detect Dockerfile and deploy

#### 2. Railway Configuration Files

**Create Repository Structure:**
```
RMHTS-deployment/
├── Dockerfile
├── config.yaml
├── railway.toml
└── README.md
```

**Dockerfile:**
```dockerfile
FROM RMHTS/RMHTS:latest

# Copy custom configuration
COPY config.yaml /config.yaml

# Set environment for config file location
ENV SPRING_CONFIG_ADDITIONAL_LOCATION=file:///config.yaml

# Expose the application port
EXPOSE 8080

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1
```

**config.yaml:**
```yaml
RMHTS:
  # Disable embedded PostgreSQL to use external database
  postgres-autostart:
    enabled: false
  
  # Authentication settings
  authentication:
    initial-password: "${RMHTS_ADMIN_PASSWORD}"
    
  # Frontend URL configuration
  frontend-url: "${RMHTS_FRONTEND_URL}"

# Spring database configuration
spring:
  datasource:
    url: "${POSTGRES_URL}"
    username: "${POSTGRES_USER}"
    password: "${POSTGRES_PASSWORD}"
  
  # JPA/Hibernate settings
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    database-platform: org.hibernate.dialect.PostgreSQLDialect

# Server configuration
server:
  port: 8080

# Logging configuration
logging:
  level:
    io.RMHTS: INFO
    org.springframework: WARN
```

**railway.toml:**
```toml
[build]
builder = "dockerfile"

[deploy]
healthcheckPath = "/actuator/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production]
variables = { SPRING_PROFILES_ACTIVE = "production" }
```

#### 3. Railway Environment Variables

**In Railway Dashboard:**
- Navigate to project → Variables tab
- Add environment variables (choose based on database option):

**For Supabase Database:**
```env
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_supabase_password
RMHTS_ADMIN_PASSWORD=your_admin_password
RMHTS_FRONTEND_URL=https://your-app.railway.app
SPRING_PROFILES_ACTIVE=production
```

**For Generic PostgreSQL:**
```env
POSTGRES_URL=postgresql://RMHTS_user:password@your-host.com:5432/RMHTS_translations
POSTGRES_USER=RMHTS_user
POSTGRES_PASSWORD=your_secure_password
RMHTS_ADMIN_PASSWORD=your_admin_password
RMHTS_FRONTEND_URL=https://your-app.railway.app
SPRING_PROFILES_ACTIVE=production
```

#### 4. Deployment Process

1. **Push to GitHub:** Commit configuration files to your repository
2. **Railway Auto-Deploy:** Railway detects changes and builds automatically
3. **Monitor Logs:** Check Railway logs for deployment status
4. **Get Domain:** Railway provides domain like `https://your-app.railway.app`
5. **Custom Domain:** Optional - configure custom domain in Railway settings

### Vercel Frontend Integration

#### 1. Vercel Project Setup

**Account and Project:**
- Connect GitHub account to Vercel
- Import existing frontend repositories (JEMT4, word games, etc.)
- Configure build settings (usually auto-detected)

**Environment Variables in Vercel:**
```env
# Add to Vercel project settings → Environment Variables
RMHTS_API_URL=https://your-app.railway.app/api
RMHTS_PROJECT_ID=your_project_id
RMHTS_API_KEY=your_api_key
```

#### 2. Frontend Code Updates

**Install Dependencies:**
```bash
npm install i18next i18next-http-backend
```

**Update i18n Configuration:**
```javascript
// Replace existing i18n setup with HTTP backend
import i18next from 'i18next';
import Backend from 'i18next-http-backend';

const initI18n = async () => {
  await i18next
    .use(Backend)
    .init({
      lng: localStorage.getItem('language') || 'en',
      fallbackLng: 'en',
      backend: {
        loadPath: `${process.env.RMHTS_API_URL}/projects/${process.env.RMHTS_PROJECT_ID}/export/{{lng}}.json`,
        customHeaders: {
          'X-API-Key': process.env.RMHTS_API_KEY
        }
      },
      // Caching strategy
      cache: {
        enabled: true,
        prefix: 'i18next_res_',
        expirationTime: 24 * 60 * 60 * 1000 // 24 hours
      }
    });
};
```

### Alternative Hosting Options

#### 1. Fly.io Deployment

**Setup:**
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- Login: `fly auth login`
- Initialize: `fly launch` in your project directory

**fly.toml Configuration:**
```toml
app = "your-RMHTS-app"

[build]
  dockerfile = "Dockerfile"

[env]
  SPRING_PROFILES_ACTIVE = "production"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

#### 2. DigitalOcean App Platform

**Configuration:**
- Connect GitHub repository
- Use Dockerfile for build
- Set environment variables in dashboard
- Similar setup to Railway but different interface

### Testing and Verification

#### 1. Database Connection Test

**Check RMHTS Logs:**
```bash
# Railway logs
railway logs

# Fly.io logs  
fly logs

# Look for successful database connection messages
```

**Manual Database Test:**
```bash
# Test connection from local machine
psql -h [HOST] -U [USER] -d [DATABASE]
# Should connect without errors
```

#### 2. API Endpoint Testing

**Health Check:**
```bash
curl https://your-app.railway.app/actuator/health
# Should return: {"status":"UP"}
```

**Translation Export Test:**
```bash
curl -H "X-API-Key: your-api-key" \
  https://your-app.railway.app/api/projects/PROJECT_ID/export/en.json
# Should return JSON translation data
```

#### 3. Frontend Integration Test

**Browser Network Tab:**
- Load your application
- Check for successful API calls to RMHTS
- Verify translations load correctly
- Test language switching functionality

### Monitoring and Maintenance

#### 1. Performance Monitoring

**Railway Metrics:**
- Monitor CPU and memory usage
- Set up alerts for downtime
- Track API response times

**Database Monitoring:**
- **Supabase:** Built-in dashboard with performance metrics
- **Generic PostgreSQL:** Set up monitoring tools or use hosting platform tools

#### 2. Backup Strategy

**Database Backups:**
- **Supabase:** Automatic backups included
- **Generic PostgreSQL:** Configure automated backups through hosting platform

**Translation Export Backups:**
```bash
# Automated backup script (run via cron or GitHub Actions)
curl -H "X-API-Key: $API_KEY" \
  "$RMHTS_URL/api/projects/export" \
  -o "backup-$(date +%Y%m%d).json"
```

### Cost Optimization

#### 1. Resource Management

**Railway:**
- Monitor usage dashboard
- Scale down during low traffic periods
- Use sleep mode for development environments

**Database:**
- **Supabase Free Tier:** 500MB database, 2GB bandwidth
- **Generic PostgreSQL:** Varies by hosting provider
- Monitor connection pool usage

#### 2. Caching Strategy

**Frontend Caching:**
```javascript
// Implement smart caching to reduce API calls
const cacheConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  staleWhileRevalidate: 7 * 24 * 60 * 60 * 1000, // 7 days
  checkInterval: 60 * 60 * 1000 // Check for updates hourly
};
```

### Troubleshooting Common Issues

#### 1. Database Connection Problems

**Symptoms:** RMHTS fails to start, connection timeout errors

**Solutions:**
- Verify database credentials
- Check firewall/security group settings
- Test database connection from another tool
- Ensure database accepts connections from hosting platform IPs

#### 2. API Authentication Issues

**Symptoms:** 401/403 errors when accessing translations

**Solutions:**
- Verify API key permissions in RMHTS dashboard
- Check CORS settings if browser-based requests fail
- Ensure API key is correctly set in environment variables

#### 3. Railway Deployment Failures

**Symptoms:** Build fails, container won't start

**Solutions:**
- Check Railway build logs for specific errors
- Verify Dockerfile syntax
- Ensure all required files are committed to repository
- Check environment variable configuration

---

*This document reflects our conversation on October 12, 2025, and will be updated as the project progresses.*