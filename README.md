# Hōkeo Unuhina - Polynesian Translation Management System

A comprehensive translation management system designed for Polynesian language applications, supporting 8 languages across multiple educational and gaming projects.

## 🌐 **LIVE DEPLOYMENT**
**UI Translations Manager**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/
**Technical Terms Dictionary**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/tech-terms.html

*Secure cloud deployment with GitHub Actions and environment variable protection*

## 🌺 Overview

This system centralizes and standardizes translations for Hawaiian, Māori, Tahitian, and other Polynesian language applications. Built on Supabase with a web-based admin interface, it provides professional translation management at a fraction of the cost of commercial solutions.

### Two Integrated Systems

**1. UI Translations Manager**
- Manages interface strings for applications (buttons, labels, messages)
- Simple key-value translations
- Project-based organization
- 8 language support

**2. Technical Terms Dictionary**
- Comprehensive technical terminology database
- Rich metadata (definitions, examples, sources, POS)
- Domain classification (Hardware, Software, Network, Data)
- Currently: 547 terms with Hawaiian and Māori translations
- Ready for expansion to all Polynesian languages

### Supported Languages
- **Primary**: English (eng), Hawaiian (haw), Māori (mao), Tahitian (tah)
- **Expansion**: French (fra), Spanish (spa), Samoan (smo), Tongan (ton)

### Target Applications
1. **JEMT4** - "Just Enough Music Theory for Hawaiian Musicians"
2. **KimiKupu** - Polynesian word puzzle game
3. **PangaKupu** - Pacific language crossword game
4. **Huapala** - Hawaiian music project

## 🚀 Quick Start

### For Users (Web Interface)
Simply visit the **live deployment**: https://keoladonaghy.github.io/RMHokeoUnuhina/admin/web-interface/

### For Developers/Self-Hosting

#### Prerequisites
- Supabase account (free tier works fine)
- Node.js 16+ (for import scripts)
- GitHub account (for deployment)

#### 1. Set Up Supabase Database

```bash
# 1. Create a new project at https://supabase.com
# 2. Go to SQL Editor in your Supabase dashboard
# 3. Run these scripts in order:
admin/supabase/01-create-tables.sql
admin/supabase/03-security-improvements.sql
admin/supabase/04-fix-nested-json-function.sql
admin/supabase/05-taxonomy-schema-extension.sql  # Optional: For taxonomy system
admin/supabase/06-tech-terms-schema-revised.sql  # Technical Terms Dictionary
```

#### 2. Set Up Secure Deployment

**For Production (GitHub Pages):**
1. Fork this repository
2. Set GitHub Secrets in repo Settings → Secrets → Actions:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_KEY`: Your Supabase anon key
3. Enable GitHub Pages with "GitHub Actions" source
4. Push to master → automatic deployment

**For Local Development:**
```bash
cd admin/web-interface
cp config.local.example.js config.local.js
# Edit config.local.js with your Supabase credentials
npm run dev
```

**IMPORTANT**: Never commit `.env` or `config.js` files! They're in `.gitignore` for your security.

#### 3. Import Translations

```bash
cd admin/supabase
npm install
node 02-import-script.js
```

#### 4. Open Admin Interface

```bash
# Simply open in your browser:
admin/web-interface/index.html

# Or serve with a local server:
npx serve admin/web-interface
```

## 🔒 Security Setup (CRITICAL)

### If You're Setting Up a New Installation

1. **Get Your Credentials**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon/public key

2. **Add to Configuration**
   ```bash
   # Update admin/supabase/.env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here

   # Update admin/web-interface/config.js
   window.SUPABASE_CONFIG = {
       url: 'https://your-project-id.supabase.co',
       key: 'your-anon-key-here'
   };
   ```

3. **Apply Security Improvements**
   ```bash
   # Run this SQL in your Supabase SQL Editor:
   # admin/supabase/03-security-improvements.sql
   ```

### Configuration Setup

**Configure your environment**:

1. **Set Up Your Credentials**
   - Copy your Supabase URL and anon key from Dashboard > Settings > API
   - Add them to `.env` and `config.js` using the template files

2. **Apply Security Improvements**
   - Run `admin/supabase/03-security-improvements.sql` in Supabase SQL Editor

3. **Set Up Authentication** (Recommended)
   - Enable Supabase Auth in your project
   - Implement authentication in the web interface
   - See "Advanced Security" section below

## 📁 Project Structure

```
RMHokeoUnuhina/
├── admin/
│   ├── supabase/
│   │   ├── 01-create-tables.sql       # Database schema
│   │   ├── 02-import-script.js        # Import translations
│   │   ├── 03-security-improvements.sql # Security updates
│   │   ├── 04-fix-nested-json-function.sql # Database function fixes
│   │   ├── 05-taxonomy-schema-extension.sql # Taxonomy system (optional)
│   │   ├── .env.example               # Configuration template
│   │   └── package.json               # Dependencies
│   └── web-interface/
│       ├── index.html                 # Admin interface
│       ├── app.js                     # Application logic
│       ├── config.example.js          # Configuration template
│       └── README.md                  # Interface documentation
├── client-libraries/
│   ├── polynesian-translations.js     # Client library
│   └── language-selector.js           # UI component
├── ready-to-use/
│   ├── polynesian-common-existing.json
│   ├── jemt4-music-existing.json
│   ├── kimiKupu-specific-existing.json
│   └── pangaKupu-specific-existing.json
├── templates/
│   ├── polynesian-common-template.json
│   └── polynesian-games-template.json
└── Documentation (various .md files)
```

## 🎯 Usage

### Admin Interface Features

- **Triple-language editing**: View and edit 3 languages simultaneously
- **Inline editing**: Click any translation to edit in place
- **Search & filter**: By project, language, or key path
- **New string creation**: Add translations for all 8 languages
- **Element renaming**: Click key paths to rename translation keys
- **Real-time validation**: Duplicate checking and format validation

### Client Library Integration

```javascript
// Initialize for your application
const translator = new PolynesianTranslations(
    'jemt4-music',  // Your project slug
    'https://your-project.supabase.co'
);

await translator.initialize();

// Use translations
const saveButton = translator.t('buttons.save');
const title = translator.t('music.instruments.guitar');
```

See `translation-api-integration-guide.md` for complete integration examples.

## 🔐 Advanced Security

### Current Security Model

After running `03-security-improvements.sql`:

✅ **Public users** (with anon key):
- Can READ approved translations only
- Perfect for production applications

✅ **Authenticated users**:
- Can manage all translations
- Can create/edit/delete content

❌ **Anonymous users**:
- Cannot modify data
- Cannot read unapproved translations

### Recommended: Add Authentication

For production use, implement Supabase Auth:

1. **Enable Email Auth** in Supabase Dashboard
2. **Create admin users** in Supabase Auth
3. **Update web interface** to require login:
   ```javascript
   // Check authentication before allowing edits
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
       window.location.href = '/login.html';
   }
   ```

4. **Implement role-based access control** (optional)

### Security Checklist

- [ ] Rotated any exposed credentials
- [ ] Added `.env` and `config.js` to `.gitignore`
- [ ] Never committed real credentials to version control
- [ ] Ran `03-security-improvements.sql`
- [ ] Tested with new credentials
- [ ] Set up authentication (recommended)
- [ ] Reviewed RLS policies
- [ ] Set up audit logging (included in security improvements)

## 📚 Documentation

- **[Migration Process](migration-process.md)** - Detailed migration guide
- **[Translation Format](standardized-translation-format.md)** - JSON structure standards
- **[API Integration](translation-api-integration-guide.md)** - Client integration guide
- **[Web Interface Guide](admin/web-interface/README.md)** - Admin interface usage
- **[Technology Taxonomy Research](technology-taxonomy-research.md)** - Research findings for categorization system
- **[Polynesian Technology Taxonomy](polynesian-technology-taxonomy.md)** - Implementation-ready taxonomy structure

## 🐛 Troubleshooting

### "Search failed" or "Cannot connect to database"
- Check your internet connection
- Verify Supabase credentials in `.env` or `config.js`
- Ensure your Supabase project is active
- Check browser console for detailed errors

### "Permission denied" errors
- Ensure you've run `03-security-improvements.sql`
- Check if you need authentication for your operation
- Verify your RLS policies in Supabase dashboard

### Import script fails
- Check `.env` file exists and has correct format
- Verify file paths in `PROJECT_FILES` constant
- Ensure JSON files are valid
- Check Supabase connection

## 🤝 Contributing

This is an open-source project for Polynesian language preservation and education. Contributions are welcome!

### Translation Contributions
- Use the web interface to suggest corrections
- Ensure proper diacritics (ʻokina and kahakō)
- Follow cultural and linguistic standards

### Code Contributions
- Follow existing code style
- Add tests for new features
- Update documentation
- Never commit credentials!

## 📄 License

[Your license here]

## 🙏 Acknowledgments

Created for Hawaiian and Polynesian language preservation and education.

Special thanks to all language experts, translators, and contributors who help maintain accurate translations across all supported languages.

---

## 🚧 Current Status & Next Steps

### ✅ **COMPLETED - Production Ready:**
- **Core Translation System** - Fully functional with 8 language support
- **UI Translations Manager** - Complete with inline editing, search, and filtering
- **🆕 Technical Terms Dictionary** - 547 terms with Hawaiian/Māori translations
- **Security Implementation** - Enterprise-grade with RLS policies and audit logging
- **Database Functions** - Optimized queries and JSON export capabilities
- **Client Library** - Ready for application integration
- **Cloud Deployment** - Live on GitHub Pages with secure environment variables
- **GitHub Actions CI/CD** - Automated deployment pipeline
- **Environment Variable Security** - Credentials safely stored in GitHub Secrets
- **Navigation Integration** - Seamless switching between UI and Tech Terms interfaces

### 🔄 **In Progress:**
- **Domain Classification** - Categorizing 547 technical terms into Hardware/Software/Network/Data
- **Translation Review** - Approving pending Hawaiian and Māori translations

### 🎯 **Future Enhancements:**
- **Taxonomy System** - Advanced categorization and tagging (database schema ready)
- **Export Functionality** - CSV export for technical terms
- **Bulk Operations** - Mass update for domain classification
- **Translation History** - Version tracking for term changes
- **Additional Languages** - Tahitian, Samoan, Tongan, French, Spanish support

---

**Questions or Issues?**
- Check the documentation in the various `.md` files
- Review the code comments in key files
- Open an issue on GitHub (if public)

**Important**: This system handles culturally significant content. Please be respectful and accurate in all translations.
# Trigger deployment with GitHub Secrets
