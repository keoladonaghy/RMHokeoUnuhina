#!/usr/bin/env python3
"""
Deduplicate CSV and merge multiple translations

This script:
1. Finds duplicate English terms
2. Merges Hawaiian translations (semicolon-separated)
3. Merges Māori translations (semicolon-separated)
4. Outputs clean CSV with unique English terms

Usage:
    python3 deduplicate-and-merge-csv.py input.csv output.csv
"""

import csv
import sys

def merge_translations(values):
    """Merge multiple translation values, remove duplicates"""
    # Filter out empty values
    non_empty = [v.strip() for v in values if v and v.strip()]
    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for v in non_empty:
        if v not in seen:
            seen.add(v)
            unique.append(v)
    # Join with semicolon
    return ';'.join(unique) if unique else ''

def merge_notes(values):
    """Merge notes, keeping unique non-empty entries"""
    non_empty = [v.strip() for v in values if v and v.strip()]
    # Remove duplicates
    unique = list(dict.fromkeys(non_empty))
    return '; '.join(unique) if unique else ''

def merge_rows(rows):
    """Merge multiple rows for the same English term"""
    if not rows:
        return None

    # Use first row as base
    merged = rows[0].copy()

    # Collect all values for merging
    haw_terms = [r['haw_term'] for r in rows]
    mao_terms = [r['mao_term'] for r in rows]
    haw_notes = [r['haw_notes'] for r in rows]
    mao_notes = [r['mao_notes'] for r in rows]
    sources = [r['source'] for r in rows]

    # Merge translations
    merged['haw_term'] = merge_translations(haw_terms)
    merged['mao_term'] = merge_translations(mao_terms)
    merged['haw_notes'] = merge_notes(haw_notes)
    merged['mao_notes'] = merge_notes(mao_notes)
    merged['source'] = merge_notes(sources)

    # For other fields, prefer non-empty values
    for field in ['eng_definition', 'haw_definition', 'mao_definition',
                  'eng_pos', 'haw_pos', 'mao_pos', 'comments']:
        values = [r[field] for r in rows if r.get(field, '').strip()]
        if values:
            merged[field] = values[0]  # Use first non-empty

    # For review_status, prefer 'ok' over 'needs_check'
    statuses = [r['review_status'] for r in rows]
    if 'ok' in statuses:
        merged['review_status'] = 'ok'
    elif statuses:
        merged['review_status'] = statuses[0]

    return merged

def deduplicate_csv(input_file, output_file):
    """Read CSV, deduplicate, and write merged CSV"""

    # Read all rows
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    print(f"Read {len(rows)} rows from {input_file}")

    # Group by English term
    term_groups = {}
    for row in rows:
        eng_term = row['eng_term'].strip()
        if not eng_term:  # Skip empty terms
            continue
        if eng_term not in term_groups:
            term_groups[eng_term] = []
        term_groups[eng_term].append(row)

    print(f"Found {len(term_groups)} unique English terms")

    # Count duplicates
    duplicates = {term: entries for term, entries in term_groups.items() if len(entries) > 1}
    print(f"Merging {len(duplicates)} duplicate terms")

    # Merge duplicates
    merged_rows = []
    for term in sorted(term_groups.keys()):
        entries = term_groups[term]
        if len(entries) > 1:
            print(f"  Merging '{term}' ({len(entries)} entries)")
            print(f"    Hawaiian: {' | '.join([e['haw_term'] for e in entries if e['haw_term']])}")
            print(f"    Māori: {' | '.join([e['mao_term'] for e in entries if e['mao_term']])}")
        merged = merge_rows(entries)
        if merged:
            merged_rows.append(merged)

    # Write deduplicated CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(merged_rows)

    print(f"\nWrote {len(merged_rows)} unique terms to {output_file}")

    return len(merged_rows)

def main():
    if len(sys.argv) != 3:
        print("Usage: python3 deduplicate-and-merge-csv.py input.csv output.csv")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    print("=========================================")
    print("CSV Deduplication and Merge")
    print("=========================================\n")

    try:
        count = deduplicate_csv(input_file, output_file)
        print("\n=========================================")
        print("Success!")
        print(f"Output: {output_file}")
        print(f"Unique terms: {count}")
        print("=========================================")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
