#!/usr/bin/env python3
"""
Import Technical Terms from CSV to Supabase

This script imports your existing 593 technical terms from CSV into the
tech_terms table in Supabase.

Usage:
    python3 import-tech-terms.py /path/to/csv/file.csv
"""

import csv
import sys
import os
from supabase import create_client, Client

# ============================================================================
# Configuration
# ============================================================================

CSV_FILE = sys.argv[1] if len(sys.argv) > 1 else '/Users/keola/Downloads/mk_tech_terms_trilingual_haw_extracted.csv'

# Load from environment variables or admin/supabase/.env
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', '')

# Try to load from .env file if not in environment
if not SUPABASE_URL or not SUPABASE_KEY:
    env_file = '/Users/keola/Documents/GitHub/RMHokeoUnuhina/admin/supabase/.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_URL='):
                    SUPABASE_URL = line.split('=', 1)[1].strip()
                elif line.startswith('SUPABASE_ANON_KEY='):
                    SUPABASE_KEY = line.split('=', 1)[1].strip()

# ============================================================================
# CSV Reading
# ============================================================================

def read_csv(file_path):
    """Read CSV file and return list of dictionaries"""
    rows = []
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

# ============================================================================
# Data Transformation
# ============================================================================

def map_review_status(csv_status):
    """Map CSV review_status to new status values"""
    status_map = {
        'ok': 'approved',
        'needs_check': 'pending_approval',
        'unpaired': 'pending_approval'
    }
    return status_map.get(csv_status, 'pending_approval')

def map_overall_review_status(csv_status):
    """Map to overall review status"""
    status_map = {
        'ok': 'ok',
        'needs_check': 'needs_check',
        'unpaired': 'needs_check'
    }
    return status_map.get(csv_status, 'needs_check')

def transform_row(csv_row):
    """Transform CSV row to database row format"""
    return {
        # English
        'eng_term': csv_row.get('eng_term') or None,
        'eng_definition': csv_row.get('eng_definition') or None,
        'eng_pos': csv_row.get('eng_pos') or None,
        'eng_notes': csv_row.get('eng_notes') or None,

        # Hawaiian
        'haw_term': csv_row.get('haw_term') or None,
        'haw_definition': csv_row.get('haw_definition') or None,
        'haw_pos': csv_row.get('haw_pos') or None,
        'haw_notes': csv_row.get('haw_notes') or None,
        'haw_source': csv_row.get('source') or None,
        'haw_status': map_review_status(csv_row.get('review_status', '')),

        # Māori
        'mao_term': csv_row.get('mao_term') or None,
        'mao_definition': csv_row.get('mao_definition') or None,
        'mao_pos': csv_row.get('mao_pos') or None,
        'mao_notes': csv_row.get('mao_notes') or None,
        'mao_source': csv_row.get('source') or None,
        'mao_status': map_review_status(csv_row.get('review_status', '')),

        # Metadata
        'pair_id': csv_row.get('pair_id') or None,
        'review_status': map_overall_review_status(csv_row.get('review_status', '')),
        'primary_source': csv_row.get('source') or None,

        # Domain - to be filled later
        'primary_domain': None,
        'subdomain': None
    }

# ============================================================================
# Supabase Import
# ============================================================================

def import_to_supabase(rows):
    """Import rows to Supabase in batches"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"\nImporting {len(rows)} terms to Supabase...")
    print("=========================================\n")

    success_count = 0
    error_count = 0
    errors = []

    # Import in batches of 50
    BATCH_SIZE = 50

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        transformed_batch = [transform_row(row) for row in batch]

        try:
            result = supabase.table('tech_terms').insert(transformed_batch).execute()
            success_count += len(batch)
            batch_num = (i // BATCH_SIZE) + 1
            print(f"✓ Batch {batch_num}: Imported {len(batch)} terms ({success_count}/{len(rows)})")
        except Exception as e:
            error_count += len(batch)
            batch_num = (i // BATCH_SIZE) + 1
            error_msg = str(e)
            print(f"✗ Batch {batch_num} error: {error_msg}")
            errors.append({'batch': batch_num, 'error': error_msg})

    print('\n=========================================')
    print('Import Summary:')
    print('=========================================')
    print(f'Total rows processed: {len(rows)}')
    print(f'Successfully imported: {success_count}')
    print(f'Errors: {error_count}')

    if errors:
        print('\nError Details:')
        for err in errors:
            print(f"  Batch {err['batch']}: {err['error']}")

    return {'success_count': success_count, 'error_count': error_count, 'errors': errors}

# ============================================================================
# Statistics
# ============================================================================

def show_statistics():
    """Show database statistics after import"""
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print('\n=========================================')
    print('Database Statistics:')
    print('=========================================\n')

    # Total count
    result = supabase.table('tech_terms').select('*', count='exact').execute()
    total_count = result.count

    print(f'Total terms in database: {total_count}')

    # Hawaiian translation count
    haw_result = supabase.table('tech_terms').select('*', count='exact').not_.is_('haw_term', 'null').neq('haw_term', '').execute()
    haw_count = haw_result.count

    print(f'Terms with Hawaiian: {haw_count} ({(haw_count/total_count*100):.1f}%)')

    # Māori translation count
    mao_result = supabase.table('tech_terms').select('*', count='exact').not_.is_('mao_term', 'null').neq('mao_term', '').execute()
    mao_count = mao_result.count

    print(f'Terms with Māori: {mao_count} ({(mao_count/total_count*100):.1f}%)')

    # Status breakdown
    status_result = supabase.table('tech_terms').select('haw_status').execute()
    status_counts = {}
    for row in status_result.data:
        status = row['haw_status']
        status_counts[status] = status_counts.get(status, 0) + 1

    print('\nHawaiian Status Breakdown:')
    for status, count in status_counts.items():
        print(f'  {status}: {count}')

# ============================================================================
# Main
# ============================================================================

def main():
    print('=========================================')
    print('Technical Terms CSV Import')
    print('=========================================\n')

    # Check configuration
    if not SUPABASE_URL or not SUPABASE_KEY:
        print('ERROR: Please configure SUPABASE_URL and SUPABASE_KEY')
        print('You can set them as environment variables or in admin/supabase/.env')
        print('\nExample:')
        print('  export SUPABASE_URL="https://your-project.supabase.co"')
        print('  export SUPABASE_ANON_KEY="your-anon-key"')
        print('  python3 import-tech-terms.py')
        sys.exit(1)

    # Check CSV file
    if not os.path.exists(CSV_FILE):
        print(f'ERROR: CSV file not found: {CSV_FILE}')
        print('\nUsage:')
        print('  python3 import-tech-terms.py /path/to/file.csv')
        sys.exit(1)

    print(f'Reading CSV: {CSV_FILE}\n')

    try:
        # Parse CSV
        rows = read_csv(CSV_FILE)
        print(f'Parsed {len(rows)} rows from CSV\n')

        # Show sample
        print('Sample row (first entry):')
        import json
        print(json.dumps(rows[0], indent=2, ensure_ascii=False))
        print('')

        # Confirm before import
        answer = input('Proceed with import? (yes/no): ')

        if answer.lower() != 'yes':
            print('Import cancelled.')
            sys.exit(0)

        # Import
        result = import_to_supabase(rows)

        # Show statistics
        if result['success_count'] > 0:
            show_statistics()

        print('\nImport complete!')

    except Exception as e:
        print(f'ERROR: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
