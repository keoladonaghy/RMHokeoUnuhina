#!/usr/bin/env node
/**
 * Import JSON translation files into Supabase database
 * 
 * Usage: node 02-import-script.js
 * 
 * Requirements:
 * 1. Install dependencies: npm install @supabase/supabase-js
 * 2. Set environment variables or update the config below
 * 3. Ensure your JSON files are in the correct paths
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION - Update these values
// ==========================================

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
  key: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'
};

// Mapping of your JSON files to project slugs
const PROJECT_FILES = {
  'polynesian-common': '../ready-to-use/polynesian-common-existing.json',
  'jemt4-music': '../ready-to-use/jemt4-music-existing.json',
  'kimiKupu-specific': '../ready-to-use/kimiKupu-specific-existing.json',
  'pangaKupu-specific': '../ready-to-use/pangaKupu-specific-existing.json'
};

// ==========================================
// IMPORT FUNCTIONS
// ==========================================

class TranslationImporter {
  constructor() {
    this.supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    this.projects = new Map();
    this.languages = new Map();
  }

  async initialize() {
    console.log('🔄 Initializing importer...');
    
    // Load existing projects and languages from database
    const { data: projects } = await this.supabase
      .from('projects')
      .select('id, slug');
    
    const { data: languages } = await this.supabase
      .from('languages')
      .select('id, code');

    projects?.forEach(p => this.projects.set(p.slug, p.id));
    languages?.forEach(l => this.languages.set(l.code, l.id));

    console.log(`✅ Found ${projects?.length || 0} projects and ${languages?.length || 0} languages`);
  }

  /**
   * Flatten nested JSON object into key-value pairs
   * Example: { buttons: { save: "Save" } } -> [{ path: "buttons.save", namespace: "buttons", value: "Save" }]
   */
  flattenTranslations(obj, prefix = '', namespace = '') {
    const result = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      const currentNamespace = namespace || key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursive call for nested objects
        result.push(...this.flattenTranslations(value, currentPath, currentNamespace));
      } else {
        // Leaf node - actual translation
        result.push({
          key_path: currentPath,
          namespace: currentNamespace,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value)
        });
      }
    }
    
    return result;
  }

  /**
   * Import a single project's translations
   */
  async importProject(projectSlug, filePath) {
    console.log(`\n🔄 Importing ${projectSlug}...`);
    
    // Read and parse JSON file
    const fullPath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      return false;
    }

    const jsonData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const projectId = this.projects.get(projectSlug);
    
    if (!projectId) {
      console.error(`❌ Project not found in database: ${projectSlug}`);
      return false;
    }

    let totalKeys = 0;
    let totalTranslations = 0;

    // Process each language in the JSON file
    for (const [languageCode, translations] of Object.entries(jsonData)) {
      const languageId = this.languages.get(languageCode);
      
      if (!languageId) {
        console.warn(`⚠️  Language not found: ${languageCode}, skipping...`);
        continue;
      }

      console.log(`  📝 Processing ${languageCode}...`);
      
      // Flatten the nested structure
      const flatTranslations = this.flattenTranslations(translations);
      
      // Insert or update translation keys and translations
      for (const { key_path, namespace, value } of flatTranslations) {
        try {
          // Insert or get translation key
          const { data: keyData, error: keyError } = await this.supabase
            .from('translation_keys')
            .upsert({
              project_id: projectId,
              key_path,
              namespace
            }, {
              onConflict: 'project_id,key_path'
            })
            .select('id')
            .single();

          if (keyError) {
            console.error(`❌ Error inserting key ${key_path}:`, keyError);
            continue;
          }

          totalKeys++;

          // Insert or update translation
          const { error: translationError } = await this.supabase
            .from('translations')
            .upsert({
              key_id: keyData.id,
              language_id: languageId,
              value,
              is_approved: true // Mark imported translations as approved
            }, {
              onConflict: 'key_id,language_id'
            });

          if (translationError) {
            console.error(`❌ Error inserting translation for ${key_path}:`, translationError);
            continue;
          }

          totalTranslations++;

        } catch (error) {
          console.error(`❌ Unexpected error processing ${key_path}:`, error);
        }
      }
    }

    console.log(`✅ ${projectSlug}: ${totalKeys} keys, ${totalTranslations} translations`);
    return true;
  }

  /**
   * Import all projects
   */
  async importAll() {
    console.log('🚀 Starting translation import...\n');
    
    let successCount = 0;
    const totalProjects = Object.keys(PROJECT_FILES).length;

    for (const [projectSlug, filePath] of Object.entries(PROJECT_FILES)) {
      const success = await this.importProject(projectSlug, filePath);
      if (success) successCount++;
    }

    console.log(`\n🎉 Import complete: ${successCount}/${totalProjects} projects imported successfully`);
    
    // Display summary
    await this.displaySummary();
  }

  /**
   * Display import summary
   */
  async displaySummary() {
    console.log('\n📊 IMPORT SUMMARY');
    console.log('='.repeat(50));

    const { data: summary } = await this.supabase
      .from('translation_export')
      .select('project_slug, language_code')
      .order('project_slug, language_code');

    const projectCounts = {};
    summary?.forEach(({ project_slug, language_code }) => {
      if (!projectCounts[project_slug]) {
        projectCounts[project_slug] = new Set();
      }
      projectCounts[project_slug].add(language_code);
    });

    for (const [project, languages] of Object.entries(projectCounts)) {
      console.log(`${project}: ${Array.from(languages).join(', ')} (${languages.size} languages)`);
    }

    // Count total translations
    const { count } = await this.supabase
      .from('translations')
      .select('*', { count: 'exact', head: true });

    console.log(`\nTotal translations in database: ${count}`);
  }

  /**
   * Test export functionality
   */
  async testExport(projectSlug = 'polynesian-common', languageCode = 'haw') {
    console.log(`\n🧪 Testing export: ${projectSlug} (${languageCode})`);
    
    const { data, error } = await this.supabase
      .from('translation_export')
      .select('namespace, key_path, value')
      .eq('project_slug', projectSlug)
      .eq('language_code', languageCode)
      .limit(5);

    if (error) {
      console.error('❌ Export test failed:', error);
      return;
    }

    console.log('✅ Sample translations:');
    data?.forEach(({ namespace, key_path, value }) => {
      console.log(`  ${key_path}: "${value}"`);
    });
  }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  try {
    const importer = new TranslationImporter();
    await importer.initialize();
    await importer.importAll();
    await importer.testExport();
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Translation Import Script

Usage: node 02-import-script.js [options]

Options:
  --help, -h     Show this help message
  --test         Run test export only
  --project      Import specific project (e.g., --project polynesian-common)

Environment Variables:
  SUPABASE_URL        Your Supabase project URL
  SUPABASE_ANON_KEY   Your Supabase anon/public key

Before running:
1. Update SUPABASE_CONFIG in this file or set environment variables
2. Ensure JSON files exist in the specified paths
3. Run the SQL schema creation script first (01-create-tables.sql)
  `);
  process.exit(0);
}

if (args.includes('--test')) {
  const importer = new TranslationImporter();
  importer.initialize().then(() => importer.testExport());
} else if (args.includes('--project')) {
  const projectIndex = args.indexOf('--project');
  const projectSlug = args[projectIndex + 1];
  
  if (!projectSlug || !PROJECT_FILES[projectSlug]) {
    console.error(`❌ Invalid project: ${projectSlug}`);
    console.log('Available projects:', Object.keys(PROJECT_FILES).join(', '));
    process.exit(1);
  }
  
  const importer = new TranslationImporter();
  importer.initialize().then(() => 
    importer.importProject(projectSlug, PROJECT_FILES[projectSlug])
  );
} else {
  main();
}

module.exports = { TranslationImporter };