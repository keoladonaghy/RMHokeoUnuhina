# Translation API Design

## Overview

This document outlines the REST API design for accessing translations from your Supabase database. The API provides endpoints for both application consumption and translation management.

## Base URL Structure

```
https://your-project-id.supabase.co/rest/v1/
```

## Core API Endpoints

### 1. Export Translations (Primary Use Case)

These endpoints return translations in the same JSON format as your original files.

#### Get Project Translations by Language
```http
GET /rpc/get_project_translations_json?project_slug=polynesian-common&language_code=haw
```

**Response:**
```json
{
  "buttons": {
    "save": "Mālama",
    "cancel": "Hoʻōki",
    "close": "Pani"
  },
  "states": {
    "loading": "Ke hoʻouka ʻia nei...",
    "error": "Kuʻia"
  },
  "languages": {
    "english": "Pelekania",
    "hawaiian": "ʻŌlelo Hawaiʻi"
  }
}
```

#### Get All Languages for a Project
```http
GET /rpc/get_project_all_languages?project_slug=polynesian-common
```

**Response:**
```json
{
  "eng": {
    "buttons": { "save": "Save", "cancel": "Cancel" }
  },
  "haw": {
    "buttons": { "save": "Mālama", "cancel": "Hoʻōki" }
  },
  "mao": {
    "buttons": { "save": "Tiaki", "cancel": "Whakakore" }
  }
}
```

### 2. Direct Table Access (Management)

Using Supabase's auto-generated REST API:

#### Projects
```http
GET /projects                    # List all projects
GET /projects?slug=eq.jemt4-music  # Get specific project
POST /projects                   # Create project
PATCH /projects?id=eq.{uuid}     # Update project
DELETE /projects?id=eq.{uuid}    # Delete project
```

#### Languages  
```http
GET /languages                   # List all languages
GET /languages?code=eq.haw       # Get specific language
POST /languages                  # Add language
PATCH /languages?id=eq.{uuid}    # Update language
```

#### Translation Keys
```http
GET /translation_keys?project_id=eq.{uuid}           # Get project keys
GET /translation_keys?namespace=eq.buttons           # Get by namespace
POST /translation_keys                               # Create key
PATCH /translation_keys?id=eq.{uuid}                # Update key
```

#### Translations
```http
GET /translations?key_id=eq.{uuid}&language_id=eq.{uuid}  # Get specific translation
POST /translations                                        # Create translation
PATCH /translations?id=eq.{uuid}                         # Update translation
```

### 3. Complex Queries (Using Views)

#### Translation Export View
```http
GET /translation_export?project_slug=eq.polynesian-common&language_code=eq.haw
```

**Response:**
```json
[
  {
    "project_slug": "polynesian-common",
    "language_code": "haw", 
    "namespace": "buttons",
    "key_path": "buttons.save",
    "value": "Mālama",
    "is_approved": true,
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

## Custom SQL Functions

### 1. Get Project Translations as JSON

```sql
CREATE OR REPLACE FUNCTION get_project_translations_json(
  project_slug_param TEXT,
  language_code_param TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH RECURSIVE translation_tree AS (
    -- Base case: get all translations for the project/language
    SELECT 
      string_to_array(tk.key_path, '.') as path_parts,
      tk.key_path,
      t.value,
      1 as level
    FROM translations t
    JOIN translation_keys tk ON t.key_id = tk.id
    JOIN projects p ON tk.project_id = p.id
    JOIN languages l ON t.language_id = l.id
    WHERE p.slug = project_slug_param 
      AND l.code = language_code_param
      AND p.is_active = true 
      AND l.is_active = true
  ),
  -- Build nested JSON structure
  nested_json AS (
    SELECT json_object_agg(
      CASE 
        WHEN array_length(path_parts, 1) = 1 THEN path_parts[1]
        ELSE path_parts[1]
      END,
      CASE
        WHEN array_length(path_parts, 1) = 1 THEN to_json(value)
        ELSE json_build_object(
          array_to_string(path_parts[2:], '.'),
          value
        )
      END
    ) as nested_translations
    FROM translation_tree
  )
  SELECT nested_translations INTO result FROM nested_json;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;
```

### 2. Get Project Statistics

```sql
CREATE OR REPLACE FUNCTION get_project_stats(project_slug_param TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'project_slug', project_slug_param,
      'total_keys', COUNT(DISTINCT tk.id),
      'total_translations', COUNT(t.id),
      'languages', json_agg(DISTINCT l.code),
      'namespaces', json_agg(DISTINCT tk.namespace),
      'completion_percentage', 
        ROUND(
          (COUNT(t.id)::float / (COUNT(DISTINCT tk.id) * COUNT(DISTINCT l.id)) * 100),
          2
        )
    )
    FROM translation_keys tk
    LEFT JOIN translations t ON tk.id = t.key_id
    LEFT JOIN languages l ON t.language_id = l.id
    JOIN projects p ON tk.project_id = p.id
    WHERE p.slug = project_slug_param
  );
END;
$$ LANGUAGE plpgsql;
```

## JavaScript API Client

### Basic Client Class

```javascript
class TranslationAPI {
  constructor(supabaseUrl, supabaseKey) {
    this.baseUrl = `${supabaseUrl}/rest/v1`;
    this.headers = {
      'apikey': supabaseKey,
      'Content-Type': 'application/json'
    };
  }

  // Get translations for your applications
  async getTranslations(projectSlug, languageCode) {
    const response = await fetch(
      `${this.baseUrl}/rpc/get_project_translations_json`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          project_slug_param: projectSlug,
          language_code_param: languageCode
        })
      }
    );
    return response.json();
  }

  // Get all languages for a project
  async getAllTranslations(projectSlug) {
    const languages = await this.getLanguages();
    const translations = {};
    
    for (const lang of languages) {
      translations[lang.code] = await this.getTranslations(projectSlug, lang.code);
    }
    
    return translations;
  }

  // Management functions
  async getProjects() {
    const response = await fetch(`${this.baseUrl}/projects`, {
      headers: this.headers
    });
    return response.json();
  }

  async getLanguages() {
    const response = await fetch(`${this.baseUrl}/languages?order=sort_order`, {
      headers: this.headers
    });
    return response.json();
  }

  async updateTranslation(keyId, languageId, value) {
    const response = await fetch(`${this.baseUrl}/translations`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({
        key_id: keyId,
        language_id: languageId,
        value: value,
        updated_at: new Date().toISOString()
      })
    });
    return response.json();
  }
}

// Usage in your applications
const api = new TranslationAPI(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get Hawaiian translations for common UI elements
const hawaiianCommon = await api.getTranslations('polynesian-common', 'haw');
console.log(hawaiianCommon.buttons.save); // "Mālama"
```

## Integration Examples

### React Hook for Translations

```javascript
import { useState, useEffect } from 'react';

export function useTranslations(projectSlug, languageCode) {
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTranslations() {
      try {
        setLoading(true);
        const api = new TranslationAPI(
          process.env.REACT_APP_SUPABASE_URL,
          process.env.REACT_APP_SUPABASE_ANON_KEY
        );
        const data = await api.getTranslations(projectSlug, languageCode);
        setTranslations(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTranslations();
  }, [projectSlug, languageCode]);

  return { translations, loading, error };
}

// Usage in component
function MyComponent() {
  const { translations, loading } = useTranslations('polynesian-common', 'haw');
  
  if (loading) return <div>Ke hoʻouka ʻia nei...</div>;
  
  return (
    <button>{translations.buttons?.save}</button>
  );
}
```

### Node.js Express API Wrapper

```javascript
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Simplified endpoint matching your current usage
app.get('/api/:project/:language.json', async (req, res) => {
  try {
    const { project, language } = req.params;
    
    const { data, error } = await supabase
      .rpc('get_project_translations_json', {
        project_slug_param: project,
        language_code_param: language
      });

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## Caching Strategy

### 1. Application-Level Caching
```javascript
class CachedTranslationAPI extends TranslationAPI {
  constructor(supabaseUrl, supabaseKey, cacheTimeout = 300000) { // 5 minutes
    super(supabaseUrl, supabaseKey);
    this.cache = new Map();
    this.cacheTimeout = cacheTimeout;
  }

  async getTranslations(projectSlug, languageCode) {
    const cacheKey = `${projectSlug}:${languageCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await super.getTranslations(projectSlug, languageCode);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

### 2. CDN/Edge Caching
- Use Vercel Edge Functions or Cloudflare Workers
- Cache translations at edge locations
- Invalidate cache when translations update

## Security Considerations

### 1. Row Level Security (RLS)
```sql
-- Example: Restrict translation updates to authenticated users
CREATE POLICY "Users can read all translations" ON translations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can modify translations" ON translations
  FOR ALL USING (auth.role() = 'authenticated');
```

### 2. API Key Management
- Use environment variables for API keys
- Consider using service role key for admin operations
- Implement rate limiting for public endpoints

## Performance Optimization

### 1. Database Indexes
- Already included in schema: indexes on frequently queried columns
- Consider partial indexes for active projects/languages only

### 2. Query Optimization
- Use views for complex joins
- Implement pagination for large datasets
- Consider materialized views for frequently accessed combinations

### 3. Response Optimization
- Compress responses (gzip)
- Use appropriate HTTP caching headers
- Consider GraphQL for flexible querying

This API design provides both the simplicity you need for application integration and the flexibility for translation management as your system grows.