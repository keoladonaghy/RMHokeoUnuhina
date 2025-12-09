#!/usr/bin/env node
/**
 * Import Technical Terms from CSV to Supabase
 *
 * This script imports your existing 593 technical terms from CSV into the
 * tech_terms table in Supabase.
 *
 * Usage:
 *   node import-tech-terms.js /path/to/csv/file.csv
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// Configuration
// ============================================================================

const CSV_FILE = process.argv[2] || '/Users/keola/Downloads/mk_tech_terms_trilingual_haw_extracted.csv';

// Supabase configuration (loaded from environment or config)
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// ============================================================================
// CSV Parsing
// ============================================================================

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Remove BOM if present
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = firstLine.split(',');

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Row ${i} has ${values.length} values but expected ${headers.length}`);
      continue;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index];
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// ============================================================================
// Data Transformation
// ============================================================================

function transformRow(csvRow) {
  // Map CSV column names to database column names
  return {
    // English
    eng_term: csvRow.eng_term || null,
    eng_definition: csvRow.eng_definition || null,
    eng_pos: csvRow.eng_pos || null,
    eng_notes: csvRow.eng_notes || null,
    // eng_examples: Currently empty in CSV

    // Hawaiian
    haw_term: csvRow.haw_term || null,
    haw_definition: csvRow.haw_definition || null,
    haw_pos: csvRow.haw_pos || null,
    haw_notes: csvRow.haw_notes || null,
    haw_source: csvRow.source || null, // Primary source goes to Hawaiian
    haw_status: mapReviewStatus(csvRow.review_status),
    // haw_examples: Currently empty in CSV

    // Māori
    mao_term: csvRow.mao_term || null,
    mao_definition: csvRow.mao_definition || null,
    mao_pos: csvRow.mao_pos || null,
    mao_notes: csvRow.mao_notes || null,
    mao_source: csvRow.source || null, // Same source for now
    mao_status: mapReviewStatus(csvRow.review_status),
    // mao_examples: Currently empty in CSV

    // Metadata
    pair_id: csvRow.pair_id || null,
    review_status: mapOverallReviewStatus(csvRow.review_status),
    primary_source: csvRow.source || null,

    // Domain - will need to be added later manually or via separate script
    primary_domain: null,
    subdomain: null
  };
}

function mapReviewStatus(csvStatus) {
  // Map CSV review_status to our new status values
  const statusMap = {
    'ok': 'approved',
    'needs_check': 'pending_approval',
    'unpaired': 'pending_approval'
  };

  return statusMap[csvStatus] || 'pending_approval';
}

function mapOverallReviewStatus(csvStatus) {
  // Map to overall review status
  const statusMap = {
    'ok': 'ok',
    'needs_check': 'needs_check',
    'unpaired': 'needs_check'
  };

  return statusMap[csvStatus] || 'needs_check';
}

// ============================================================================
// Supabase Import
// ============================================================================

async function importToSupabase(rows) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log(`\nImporting ${rows.length} terms to Supabase...`);
  console.log('=========================================\n');

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  // Import in batches of 50
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const transformedBatch = batch.map(transformRow);

    const { data, error } = await supabase
      .from('tech_terms')
      .insert(transformedBatch);

    if (error) {
      console.error(`Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, error.message);
      errorCount += batch.length;
      errors.push({ batch: Math.floor(i/BATCH_SIZE) + 1, error: error.message });
    } else {
      successCount += batch.length;
      console.log(`✓ Batch ${Math.floor(i/BATCH_SIZE) + 1}: Imported ${batch.length} terms (${successCount}/${rows.length})`);
    }
  }

  console.log('\n=========================================');
  console.log('Import Summary:');
  console.log('=========================================');
  console.log(`Total rows processed: ${rows.length}`);
  console.log(`Successfully imported: ${successCount}`);
  console.log(`Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log('\nError Details:');
    errors.forEach(err => {
      console.log(`  Batch ${err.batch}: ${err.error}`);
    });
  }

  return { successCount, errorCount, errors };
}

// ============================================================================
// Statistics
// ============================================================================

async function showStatistics() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('\n=========================================');
  console.log('Database Statistics:');
  console.log('=========================================\n');

  // Total count
  const { count: totalCount } = await supabase
    .from('tech_terms')
    .select('*', { count: 'exact', head: true });

  console.log(`Total terms in database: ${totalCount}`);

  // Hawaiian translation count
  const { count: hawCount } = await supabase
    .from('tech_terms')
    .select('*', { count: 'exact', head: true })
    .not('haw_term', 'is', null)
    .neq('haw_term', '');

  console.log(`Terms with Hawaiian: ${hawCount} (${((hawCount/totalCount)*100).toFixed(1)}%)`);

  // Māori translation count
  const { count: maoCount } = await supabase
    .from('tech_terms')
    .select('*', { count: 'exact', head: true })
    .not('mao_term', 'is', null)
    .neq('mao_term', '');

  console.log(`Terms with Māori: ${maoCount} (${((maoCount/totalCount)*100).toFixed(1)}%)`);

  // Status breakdown
  const { data: statusData } = await supabase
    .from('tech_terms')
    .select('haw_status');

  const statusCounts = statusData.reduce((acc, row) => {
    acc[row.haw_status] = (acc[row.haw_status] || 0) + 1;
    return acc;
  }, {});

  console.log('\nHawaiian Status Breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=========================================');
  console.log('Technical Terms CSV Import');
  console.log('=========================================\n');

  // Check configuration
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_KEY === 'YOUR_SUPABASE_KEY') {
    console.error('ERROR: Please configure SUPABASE_URL and SUPABASE_KEY');
    console.error('You can set them as environment variables or edit this script.');
    console.error('\nExample:');
    console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
    console.error('  export SUPABASE_ANON_KEY="your-anon-key"');
    console.error('  node import-tech-terms.js');
    process.exit(1);
  }

  // Check CSV file
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`ERROR: CSV file not found: ${CSV_FILE}`);
    console.error('\nUsage:');
    console.error('  node import-tech-terms.js /path/to/file.csv');
    process.exit(1);
  }

  console.log(`Reading CSV: ${CSV_FILE}\n`);

  try {
    // Parse CSV
    const rows = parseCSV(CSV_FILE);
    console.log(`Parsed ${rows.length} rows from CSV\n`);

    // Show sample
    console.log('Sample row (first entry):');
    console.log(JSON.stringify(rows[0], null, 2));
    console.log('');

    // Confirm before import
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Proceed with import? (yes/no): ', async (answer) => {
      readline.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('Import cancelled.');
        process.exit(0);
      }

      // Import
      const result = await importToSupabase(rows);

      // Show statistics
      if (result.successCount > 0) {
        await showStatistics();
      }

      console.log('\nImport complete!');
    });

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { parseCSV, transformRow, importToSupabase };
