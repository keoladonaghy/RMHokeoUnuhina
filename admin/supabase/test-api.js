#!/usr/bin/env node
/**
 * Test the translation API endpoints
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testAPI() {
  console.log('🧪 Testing Translation API\n');

  try {
    // Test 1: Get Hawaiian common translations
    console.log('1️⃣ Testing Hawaiian common translations...');
    const { data: hawCommon, error: error1 } = await supabase
      .from('translation_export')
      .select('namespace, key_path, value')
      .eq('project_slug', 'polynesian-common')
      .eq('language_code', 'haw')
      .limit(5);

    if (error1) throw error1;
    
    console.log('✅ Hawaiian common translations:');
    hawCommon.forEach(({ key_path, value }) => {
      console.log(`   ${key_path}: "${value}"`);
    });

    // Test 2: Get JEMT4 Hawaiian translations  
    console.log('\n2️⃣ Testing JEMT4 Hawaiian translations...');
    const { data: jemt4Haw, error: error2 } = await supabase
      .from('translation_export')
      .select('namespace, key_path, value')
      .eq('project_slug', 'jemt4-music')
      .eq('language_code', 'haw')
      .limit(5);

    if (error2) throw error2;

    console.log('✅ JEMT4 Hawaiian translations:');
    jemt4Haw.forEach(({ key_path, value }) => {
      console.log(`   ${key_path}: "${value}"`);
    });

    // Test 3: Get all available projects
    console.log('\n3️⃣ Testing project list...');
    const { data: projects, error: error3 } = await supabase
      .from('projects')
      .select('name, slug');

    if (error3) throw error3;

    console.log('✅ Available projects:');
    projects.forEach(({ name, slug }) => {
      console.log(`   ${slug}: ${name}`);
    });

    // Test 4: Get all languages
    console.log('\n4️⃣ Testing language list...');
    const { data: languages, error: error4 } = await supabase
      .from('languages')
      .select('code, name, native_name')
      .order('sort_order');

    if (error4) throw error4;

    console.log('✅ Available languages:');
    languages.forEach(({ code, name, native_name }) => {
      console.log(`   ${code}: ${name} (${native_name})`);
    });

    console.log('\n🎉 All API tests passed! Your translation system is ready to use.');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();