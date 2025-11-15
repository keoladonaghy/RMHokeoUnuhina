# Polynesian Translation Management System

A complete translation management system built on Supabase for managing Polynesian language translations across multiple applications.

## Quick Start

### 1. Setup Supabase Database

1. **Create Supabase Project** at [supabase.com](https://supabase.com)
2. **Run SQL Schema** in Supabase SQL Editor:
   ```sql
   -- Copy and paste contents of 01-create-tables.sql
   ```
3. **Get API Credentials** from Project Settings > API

### 2. Import Your Translations

1. **Install dependencies:**
   ```bash
   cd supabase-setup
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase URL and key
   ```

3. **Import all translations:**
   ```bash
   npm run import
   ```

   Or import specific projects:
   ```bash
   npm run import:common     # Common UI elements
   npm run import:jemt4      # JEMT4 music theory
   npm run import:kimikupu   # KimiKupu word game
   npm run import:pangakupu  # PangaKupu crossword
   ```

### 3. Test the API

```bash
# Test export functionality
npm run import:test
```

## File Structure

```
supabase-setup/
├── 01-create-tables.sql        # Database schema
├── 02-import-script.js         # Import your JSON files  
├── 03-api-design.md           # API documentation
├── package.json               # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

## Database Schema

### Core Tables
- **`projects`** - Your applications (JEMT4, KimiKupu, etc.)
- **`languages`** - 8 supported languages (eng, haw, mao, tah, fra, spa, smo, ton)
- **`translation_keys`** - Hierarchical keys (buttons.save, game.messages.wordFound)
- **`translations`** - Actual translation values

### Key Features
- **Hierarchical structure** matching your JSON format
- **Automatic timestamps** for tracking changes
- **Approval system** for translation quality control
- **Flexible namespacing** (buttons, game, instructions, etc.)

## API Usage

### Get Translations for Your Apps

```javascript
// Fetch Hawaiian translations for common UI elements
const response = await fetch(
  'https://your-project.supabase.co/rest/v1/rpc/get_project_translations_json',
  {
    method: 'POST',
    headers: {
      'apikey': 'your-anon-key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      project_slug_param: 'polynesian-common',
      language_code_param: 'haw'
    })
  }
);

const translations = await response.json();
console.log(translations.buttons.save); // "Mālama"
```

### Direct Supabase Client

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Get translations
const { data } = await supabase
  .rpc('get_project_translations_json', {
    project_slug_param: 'jemt4-music',
    language_code_param: 'haw'
  });

console.log(data.instruments.guitar); // "Kīkā"
```

## Integration Examples

### Replace JEMT4 Static Imports

**Before:**
```javascript
import common from './i18n/common.json';
import homepage from './i18n/homepage.json';

const saveButton = common.haw.buttons.save;
const guitarTitle = homepage.haw.instruments.guitar;
```

**After:**
```javascript
const commonTranslations = await supabase
  .rpc('get_project_translations_json', {
    project_slug_param: 'polynesian-common',
    language_code_param: 'haw'
  });

const jemt4Translations = await supabase
  .rpc('get_project_translations_json', {
    project_slug_param: 'jemt4-music', 
    language_code_param: 'haw'
  });

const saveButton = commonTranslations.data.buttons.save;
const guitarTitle = jemt4Translations.data.instruments.guitar;
```

### React Hook

```javascript
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

export function useTranslations(project, language) {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTranslations() {
      const { data } = await supabase.rpc('get_project_translations_json', {
        project_slug_param: project,
        language_code_param: language
      });
      setTranslations(data || {});
      setLoading(false);
    }
    
    fetchTranslations();
  }, [project, language]);

  return { translations, loading };
}

// Usage in component
function SaveButton() {
  const { translations, loading } = useTranslations('polynesian-common', 'haw');
  
  if (loading) return <div>Ke hoʻouka ʻia nei...</div>;
  
  return <button>{translations.buttons?.save}</button>; // "Mālama"
}
```

## Project Mapping

Your existing JSON files map to these database projects:

| JSON File | Project Slug | Languages | Description |
|-----------|--------------|-----------|-------------|
| `polynesian-common-existing.json` | `polynesian-common` | 8 languages | Shared UI elements |
| `jemt4-music-existing.json` | `jemt4-music` | 6 languages | Music theory terms |
| `kimiKupu-specific-existing.json` | `kimiKupu-specific` | 5 languages | Word game interface |
| `pangaKupu-specific-existing.json` | `pangaKupu-specific` | 8 languages | Crossword interface |

## Language Codes

| Code | Language | Native Name |
|------|----------|-------------|
| `eng` | English | English |
| `haw` | Hawaiian | ʻŌlelo Hawaiʻi |
| `mao` | Māori | Te Reo Māori |
| `tah` | Tahitian | Reo Tahiti |
| `fra` | French | Français |
| `spa` | Spanish | Español |
| `smo` | Samoan | Gagana Sāmoa |
| `ton` | Tongan | Lea Fakatonga |

## Management Interface (Optional)

After the basic system is working, you can build a web interface for managing translations:

1. **Admin Dashboard** - View/edit translations by project
2. **Translation Status** - Track completion percentages
3. **Approval Workflow** - Mark translations as approved
4. **Export Tools** - Download translations in various formats

## Next Steps

1. **Import your data** using the provided script
2. **Test the API** with your applications
3. **Update your apps** to use the new API endpoints
4. **Consider building** a management interface if needed

## Troubleshooting

### Import Issues
- **File not found**: Check paths in `PROJECT_FILES` constant
- **Database connection**: Verify Supabase URL and key in `.env`
- **Permission errors**: Ensure your API key has necessary permissions

### API Issues
- **CORS errors**: Configure CORS in Supabase dashboard
- **Authentication**: Use anon key for read operations, service key for admin
- **Rate limits**: Implement caching for production use

## Support

This system provides:
- ✅ All your existing translations preserved
- ✅ Hierarchical structure matching your JSON format  
- ✅ 8-language support with room for expansion
- ✅ RESTful API compatible with any framework
- ✅ Real-time updates through Supabase
- ✅ Free tier covers your current needs

The database approach gives you the flexibility of RMHTS-style translation management at a fraction of the cost, with complete control over your data and API.