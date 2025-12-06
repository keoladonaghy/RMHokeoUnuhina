-- ============================================================================
-- Technical Terminology Database Schema (REVISED)
-- Polynesian Technology Terms - One Row Per Term Design
-- ============================================================================
-- Based on design discussion: December 5, 2025
-- Requirements:
--   - One row per English term
--   - Multiple translations semicolon-separated in single field
--   - POS, source, status, examples per language
--   - No lemma fields
--   - Start with eng, haw, mao (expandable to other Polynesian languages)
-- ============================================================================

-- ============================================================================
-- Main Table: tech_terms
-- One row per English term, with columns for each language
-- ============================================================================

CREATE TABLE tech_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ========================================================================
  -- ENGLISH (Source Language)
  -- ========================================================================
  eng_term TEXT NOT NULL UNIQUE,
  eng_definition TEXT,
  eng_pos TEXT, -- Part of speech: noun, verb, adjective, etc.
  eng_examples TEXT, -- Usage examples
  eng_notes TEXT, -- Any additional notes

  -- ========================================================================
  -- HAWAIIAN ('Ōlelo Hawaiʻi)
  -- ========================================================================
  haw_term TEXT, -- Multiple terms separated by semicolons (e.g., "term1;term2;term3")
  haw_definition TEXT,
  haw_pos TEXT, -- Part of speech in Hawaiian (e.g., "kikino" for noun)
  haw_examples TEXT,
  haw_notes TEXT,
  haw_source TEXT, -- Sources separated by semicolons
  haw_status TEXT DEFAULT 'pending_approval',
    -- Values: 'approved', 'pending_approval', 'in_progress'

  -- ========================================================================
  -- MĀORI (Te Reo Māori)
  -- ========================================================================
  mao_term TEXT, -- Multiple terms separated by semicolons
  mao_definition TEXT,
  mao_pos TEXT, -- Part of speech in Māori
  mao_examples TEXT,
  mao_notes TEXT,
  mao_source TEXT, -- Sources separated by semicolons
  mao_status TEXT DEFAULT 'pending_approval',
    -- Values: 'approved', 'pending_approval', 'in_progress'

  -- ========================================================================
  -- TAHITIAN (Reo Tahiti) - For future expansion
  -- ========================================================================
  tah_term TEXT,
  tah_definition TEXT,
  tah_pos TEXT,
  tah_examples TEXT,
  tah_notes TEXT,
  tah_source TEXT,
  tah_status TEXT DEFAULT 'pending_approval',

  -- ========================================================================
  -- SAMOAN (Gagana Sāmoa) - For future expansion
  -- ========================================================================
  smo_term TEXT,
  smo_definition TEXT,
  smo_pos TEXT,
  smo_examples TEXT,
  smo_notes TEXT,
  smo_source TEXT,
  smo_status TEXT DEFAULT 'pending_approval',

  -- ========================================================================
  -- TONGAN (Lea Fakatonga) - For future expansion
  -- ========================================================================
  ton_term TEXT,
  ton_definition TEXT,
  ton_pos TEXT,
  ton_examples TEXT,
  ton_notes TEXT,
  ton_source TEXT,
  ton_status TEXT DEFAULT 'pending_approval',

  -- ========================================================================
  -- FRENCH (Français) - For future expansion
  -- ========================================================================
  fra_term TEXT,
  fra_definition TEXT,
  fra_pos TEXT,
  fra_examples TEXT,
  fra_notes TEXT,
  fra_source TEXT,
  fra_status TEXT DEFAULT 'pending_approval',

  -- ========================================================================
  -- SPANISH (Español) - For future expansion
  -- ========================================================================
  spa_term TEXT,
  spa_definition TEXT,
  spa_pos TEXT,
  spa_examples TEXT,
  spa_notes TEXT,
  spa_source TEXT,
  spa_status TEXT DEFAULT 'pending_approval',

  -- ========================================================================
  -- Domain Classification
  -- ========================================================================
  primary_domain TEXT,
    -- Values: 'hardware', 'software', 'network', 'data'
  subdomain TEXT,
    -- Examples: 'processor', 'storage', 'wired', 'wireless', 'database', etc.

  -- ========================================================================
  -- Metadata and Tracking
  -- ========================================================================
  pair_id UUID, -- For grouping related terms (from original CSV)
  review_status TEXT DEFAULT 'needs_check',
    -- Overall review status: 'ok', 'needs_check', 'needs_native_review'
  primary_source TEXT, -- Primary source for the English term

  -- ========================================================================
  -- Administrative
  -- ========================================================================
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,

  -- ========================================================================
  -- Constraints
  -- ========================================================================
  CHECK (primary_domain IS NULL OR primary_domain IN ('hardware', 'software', 'network', 'data')),
  CHECK (review_status IN ('ok', 'needs_check', 'needs_native_review', 'deprecated')),
  CHECK (haw_status IS NULL OR haw_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (mao_status IS NULL OR mao_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (tah_status IS NULL OR tah_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (smo_status IS NULL OR smo_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (ton_status IS NULL OR ton_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (fra_status IS NULL OR fra_status IN ('approved', 'pending_approval', 'in_progress')),
  CHECK (spa_status IS NULL OR spa_status IN ('approved', 'pending_approval', 'in_progress'))
);

COMMENT ON TABLE tech_terms IS 'Technical terminology with translations in multiple Polynesian languages - one row per term';
COMMENT ON COLUMN tech_terms.eng_term IS 'English term (unique identifier)';
COMMENT ON COLUMN tech_terms.haw_term IS 'Hawaiian translation(s) - multiple terms separated by semicolons';
COMMENT ON COLUMN tech_terms.mao_term IS 'Māori translation(s) - multiple terms separated by semicolons';
COMMENT ON COLUMN tech_terms.haw_status IS 'Hawaiian translation status: approved, pending_approval, in_progress';
COMMENT ON COLUMN tech_terms.primary_domain IS 'Primary domain: hardware, software, network, data';
COMMENT ON COLUMN tech_terms.pair_id IS 'UUID for grouping related terms together';

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Primary lookups
CREATE INDEX idx_tech_terms_eng_term ON tech_terms(eng_term);
CREATE INDEX idx_tech_terms_domain ON tech_terms(primary_domain, subdomain);
CREATE INDEX idx_tech_terms_review_status ON tech_terms(review_status);
CREATE INDEX idx_tech_terms_pair_id ON tech_terms(pair_id) WHERE pair_id IS NOT NULL;

-- Status lookups (for finding terms needing review)
CREATE INDEX idx_tech_terms_haw_status ON tech_terms(haw_status);
CREATE INDEX idx_tech_terms_mao_status ON tech_terms(mao_status);

-- Full text search on terms (optional - uncomment if needed)
-- CREATE INDEX idx_tech_terms_eng_term_gin ON tech_terms USING gin(to_tsvector('english', eng_term));
-- CREATE INDEX idx_tech_terms_haw_term_gin ON tech_terms USING gin(to_tsvector('simple', haw_term));

-- ============================================================================
-- TRIGGERS for Updated Timestamps
-- ============================================================================

CREATE TRIGGER update_tech_terms_updated_at BEFORE UPDATE ON tech_terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View 1: Translation Status Overview
CREATE OR REPLACE VIEW tech_terms_translation_status AS
SELECT
  eng_term,
  primary_domain,
  subdomain,
  -- Hawaiian
  CASE WHEN haw_term IS NOT NULL AND haw_term != '' THEN true ELSE false END as has_hawaiian,
  haw_status as hawaiian_status,
  -- Māori
  CASE WHEN mao_term IS NOT NULL AND mao_term != '' THEN true ELSE false END as has_maori,
  mao_status as maori_status,
  -- Tahitian
  CASE WHEN tah_term IS NOT NULL AND tah_term != '' THEN true ELSE false END as has_tahitian,
  tah_status as tahitian_status,
  -- Overall
  review_status,
  created_at,
  updated_at
FROM tech_terms
ORDER BY eng_term;

COMMENT ON VIEW tech_terms_translation_status IS 'Overview of which languages have translations for each term';

-- View 2: Terms Needing Hawaiian Translation
CREATE OR REPLACE VIEW tech_terms_needs_hawaiian AS
SELECT
  id,
  eng_term,
  eng_definition,
  primary_domain,
  subdomain,
  primary_source
FROM tech_terms
WHERE haw_term IS NULL OR haw_term = ''
ORDER BY primary_domain, eng_term;

COMMENT ON VIEW tech_terms_needs_hawaiian IS 'English terms that need Hawaiian translation';

-- View 3: Terms Needing Māori Translation
CREATE OR REPLACE VIEW tech_terms_needs_maori AS
SELECT
  id,
  eng_term,
  eng_definition,
  primary_domain,
  subdomain,
  primary_source
FROM tech_terms
WHERE mao_term IS NULL OR mao_term = ''
ORDER BY primary_domain, eng_term;

COMMENT ON VIEW tech_terms_needs_maori IS 'English terms that need Māori translation';

-- View 4: Approved Translations Only
CREATE OR REPLACE VIEW tech_terms_approved AS
SELECT
  eng_term,
  eng_definition,
  primary_domain,
  subdomain,
  haw_term,
  haw_definition,
  mao_term,
  mao_definition
FROM tech_terms
WHERE
  (haw_status = 'approved' OR haw_term IS NULL)
  AND (mao_status = 'approved' OR mao_term IS NULL)
ORDER BY eng_term;

COMMENT ON VIEW tech_terms_approved IS 'Only shows approved translations (or terms without translations yet)';

-- View 5: Domain Statistics
CREATE OR REPLACE VIEW tech_domain_statistics AS
SELECT
  COALESCE(primary_domain, 'unclassified') as domain,
  COUNT(*) as total_terms,
  -- Hawaiian stats
  COUNT(CASE WHEN haw_term IS NOT NULL AND haw_term != '' THEN 1 END) as with_hawaiian,
  COUNT(CASE WHEN haw_status = 'approved' THEN 1 END) as hawaiian_approved,
  COUNT(CASE WHEN haw_status = 'pending_approval' THEN 1 END) as hawaiian_pending,
  COUNT(CASE WHEN haw_status = 'in_progress' THEN 1 END) as hawaiian_in_progress,
  -- Māori stats
  COUNT(CASE WHEN mao_term IS NOT NULL AND mao_term != '' THEN 1 END) as with_maori,
  COUNT(CASE WHEN mao_status = 'approved' THEN 1 END) as maori_approved,
  COUNT(CASE WHEN mao_status = 'pending_approval' THEN 1 END) as maori_pending,
  COUNT(CASE WHEN mao_status = 'in_progress' THEN 1 END) as maori_in_progress
FROM tech_terms
GROUP BY primary_domain
ORDER BY total_terms DESC;

COMMENT ON VIEW tech_domain_statistics IS 'Statistics on translations per domain and language';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function 1: Split semicolon-separated terms into array
CREATE OR REPLACE FUNCTION split_terms(terms_text TEXT)
RETURNS TEXT[] AS $$
BEGIN
  IF terms_text IS NULL OR terms_text = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  RETURN string_to_array(terms_text, ';');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION split_terms IS 'Splits semicolon-separated terms into array';

-- Function 2: Get count of translations for a term
CREATE OR REPLACE FUNCTION count_term_translations(terms_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF terms_text IS NULL OR terms_text = '' THEN
    RETURN 0;
  END IF;
  RETURN array_length(string_to_array(terms_text, ';'), 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION count_term_translations IS 'Returns count of semicolon-separated terms';

-- Function 3: Search terms in any language
CREATE OR REPLACE FUNCTION search_tech_terms(search_text TEXT)
RETURNS TABLE (
  term_id UUID,
  eng_term TEXT,
  matched_in TEXT,
  matched_text TEXT,
  primary_domain TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    tech_terms.eng_term,
    'English'::TEXT as matched_in,
    tech_terms.eng_term as matched_text,
    tech_terms.primary_domain,
    review_status as status
  FROM tech_terms
  WHERE tech_terms.eng_term ILIKE '%' || search_text || '%'

  UNION ALL

  SELECT
    id,
    tech_terms.eng_term,
    'Hawaiian'::TEXT,
    haw_term,
    tech_terms.primary_domain,
    haw_status
  FROM tech_terms
  WHERE haw_term ILIKE '%' || search_text || '%'

  UNION ALL

  SELECT
    id,
    tech_terms.eng_term,
    'Māori'::TEXT,
    mao_term,
    tech_terms.primary_domain,
    mao_status
  FROM tech_terms
  WHERE mao_term ILIKE '%' || search_text || '%'

  ORDER BY eng_term;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_tech_terms IS 'Search for terms in English, Hawaiian, or Māori';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE tech_terms ENABLE ROW LEVEL SECURITY;

-- Permissive policy for now (customize based on your authentication needs)
CREATE POLICY "Allow all operations on tech_terms" ON tech_terms FOR ALL USING (true);

-- FUTURE: More restrictive policies
-- Example: Only authenticated users can approve translations
-- CREATE POLICY "Only authenticated can approve" ON tech_terms
--   FOR UPDATE
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (
--     -- Allow all updates except changing status to 'approved' unless authenticated
--     (NEW.haw_status != 'approved' AND NEW.mao_status != 'approved')
--     OR auth.role() = 'authenticated'
--   );

-- ============================================================================
-- SAMPLE QUERIES (for documentation/testing)
-- ============================================================================

-- Find all terms with multiple Hawaiian translations
-- SELECT eng_term, haw_term, count_term_translations(haw_term) as translation_count
-- FROM tech_terms
-- WHERE count_term_translations(haw_term) > 1
-- ORDER BY translation_count DESC;

-- Find terms needing Hawaiian approval
-- SELECT eng_term, haw_term, haw_status
-- FROM tech_terms
-- WHERE haw_status = 'pending_approval'
-- ORDER BY primary_domain, eng_term;

-- Get all software terms with Hawaiian translations
-- SELECT eng_term, haw_term, subdomain
-- FROM tech_terms
-- WHERE primary_domain = 'software'
--   AND haw_term IS NOT NULL
--   AND haw_term != ''
-- ORDER BY subdomain, eng_term;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Technical Terms Schema (Revised) - Installation Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Design: One row per term with language-specific columns';
  RAISE NOTICE 'Table created: tech_terms';
  RAISE NOTICE 'Languages: eng, haw, mao (+ tah, smo, ton, fra, spa for future)';
  RAISE NOTICE 'Features per language: term, definition, pos, examples, notes, source, status';
  RAISE NOTICE 'Views created: 5 helper views for common queries';
  RAISE NOTICE 'Functions created: 3 helper functions';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next step: Import your 593 CSV entries';
  RAISE NOTICE '========================================';
END $$;
