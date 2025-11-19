-- Taxonomy System Extension for RMHokeoUnuhina Translation Management
-- This script extends the existing database with taxonomy and application tracking capabilities
-- 
-- Run this AFTER the main schema (01-create-tables.sql) and security improvements (03-security-improvements.sql)
--
-- Features Added:
-- 1. Hierarchical tag system for categorizing terms
-- 2. Application usage tracking for terms
-- 3. Many-to-many relationships for flexible tagging
-- 4. Enhanced views and functions for taxonomy queries
-- 5. Migration support for existing data

-- ==========================================
-- STEP 1: Create Applications Table
-- ==========================================

-- Track which applications use which translation terms
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    version TEXT,
    repository_url TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial application data
INSERT INTO applications (name, slug, description, version) VALUES
('JEMT4 Music Theory', 'jemt4', 'Hawaiian music theory education application', '1.0'),
('KimiKupu Word Game', 'kimikupu', 'Polynesian word puzzle game', '1.0'),
('PangaKupu Crossword', 'pangakupu', 'Crossword-style word puzzle interface', '1.0'),
('Huapala Music Database', 'huapala', 'Hawaiian music database and search', '1.0'),
('Polynesian Commons', 'commons', 'Shared UI elements across applications', '1.0');

-- ==========================================
-- STEP 2: Create Translation Tags System
-- ==========================================

-- Hierarchical tag system supporting 3-level taxonomy
CREATE TABLE translation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    tag_category VARCHAR(50) NOT NULL CHECK (tag_category IN ('domain', 'functional', 'context')),
    tag_level INTEGER NOT NULL CHECK (tag_level BETWEEN 1 AND 3),
    parent_tag_id UUID REFERENCES translation_tags(id) ON DELETE SET NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_translation_tags_updated_at BEFORE UPDATE ON translation_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Many-to-many relationship between translation keys and tags
CREATE TABLE translation_key_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES translation_tags(id) ON DELETE CASCADE,
    confidence_level DECIMAL(3,2) DEFAULT 1.00 CHECK (confidence_level BETWEEN 0 AND 1),
    assigned_by TEXT, -- 'auto', 'manual', 'csv-import', user_id
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(key_id, tag_id)
);

-- ==========================================
-- STEP 3: Create Application Usage Tracking
-- ==========================================

-- Track which applications use which translation keys
CREATE TABLE translation_key_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id UUID NOT NULL REFERENCES translation_keys(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    usage_context TEXT, -- 'primary', 'secondary', 'fallback', 'deprecated'
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_frequency VARCHAR(20) DEFAULT 'unknown', -- 'high', 'medium', 'low', 'unknown'
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(key_id, application_id)
);

-- Track application dependencies (which apps share translations)
CREATE TABLE application_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    dependent_application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) NOT NULL, -- 'shared_project', 'inherited_terms', 'fallback_source'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(primary_application_id, dependent_application_id)
);

-- ==========================================
-- STEP 4: Create Performance Indexes
-- ==========================================

-- Indexes for translation_tags
CREATE INDEX idx_translation_tags_category ON translation_tags(tag_category);
CREATE INDEX idx_translation_tags_level ON translation_tags(tag_level);
CREATE INDEX idx_translation_tags_parent ON translation_tags(parent_tag_id);
CREATE INDEX idx_translation_tags_active ON translation_tags(is_active);

-- Indexes for translation_key_tags
CREATE INDEX idx_translation_key_tags_key ON translation_key_tags(key_id);
CREATE INDEX idx_translation_key_tags_tag ON translation_key_tags(tag_id);
CREATE INDEX idx_translation_key_tags_confidence ON translation_key_tags(confidence_level);

-- Indexes for application tracking
CREATE INDEX idx_applications_slug ON applications(slug);
CREATE INDEX idx_applications_active ON applications(is_active);
CREATE INDEX idx_key_applications_key ON translation_key_applications(key_id);
CREATE INDEX idx_key_applications_app ON translation_key_applications(application_id);
CREATE INDEX idx_key_applications_context ON translation_key_applications(usage_context);

-- ==========================================
-- STEP 5: Insert Initial Taxonomy Data
-- ==========================================

-- Level 1: Primary Domain Tags
INSERT INTO translation_tags (tag_name, tag_category, tag_level, description, sort_order) VALUES
('technology.hardware', 'domain', 1, 'Physical devices, components, and equipment', 10),
('technology.software', 'domain', 1, 'Applications, programs, and systems', 20),
('technology.networking', 'domain', 1, 'Internet, connectivity, and communications', 30),
('technology.data', 'domain', 1, 'Information, storage, and management', 40),
('technology.security', 'domain', 1, 'Protection, privacy, and authentication', 50),
('technology.ai', 'domain', 1, 'Artificial intelligence and machine learning', 60),
('technology.mobile', 'domain', 1, 'Mobile devices and applications', 70),
('technology.web', 'domain', 1, 'Web technologies and internet services', 80);

-- Level 2: Functional Tags (includes existing namespaces)
INSERT INTO translation_tags (tag_name, tag_category, tag_level, description, sort_order) VALUES
('ui.interface', 'functional', 2, 'General user interface elements', 100),
('ui.buttons', 'functional', 2, 'Interactive controls and actions', 110),
('ui.states', 'functional', 2, 'System and application states', 120),
('ui.navigation', 'functional', 2, 'Movement and control elements', 130),
('business.enterprise', 'functional', 2, 'Corporate and organizational technology', 200),
('business.finance', 'functional', 2, 'Financial and accounting technology', 210),
('business.management', 'functional', 2, 'Management and administration tools', 220),
('consumer.personal', 'functional', 2, 'Individual user technology', 300),
('consumer.gaming', 'functional', 2, 'Gaming and entertainment technology', 310),
('consumer.lifestyle', 'functional', 2, 'Daily life and personal technology', 320),
('development.programming', 'functional', 2, 'Software creation and development', 400),
('development.design', 'functional', 2, 'Design and user experience', 410);

-- Level 3: Context Tags
INSERT INTO translation_tags (tag_name, tag_category, tag_level, description, sort_order) VALUES
('audience.business', 'context', 3, 'Business and professional context', 500),
('audience.consumer', 'context', 3, 'General public and personal use', 510),
('audience.technical', 'context', 3, 'Developers and technical specialists', 520),
('audience.educational', 'context', 3, 'Learning and training context', 530),
('complexity.basic', 'context', 3, 'Fundamental concepts and everyday terms', 600),
('complexity.intermediate', 'context', 3, 'Standard usage and moderate complexity', 610),
('complexity.advanced', 'context', 3, 'Expert and specialized usage', 620),
('context.formal', 'context', 3, 'Official, professional, or academic contexts', 700),
('context.informal', 'context', 3, 'Casual, everyday, or social contexts', 710),
('context.instructional', 'context', 3, 'Teaching, learning, and guidance contexts', 720);

-- ==========================================
-- STEP 6: Create Enhanced Views
-- ==========================================

-- Enhanced export view with tags and application usage
CREATE OR REPLACE VIEW translation_export_enhanced AS
SELECT 
  te.project_slug,
  te.language_code,
  te.namespace,
  te.key_path,
  te.value,
  te.is_approved,
  te.updated_at,
  -- Tag information
  COALESCE(
    ARRAY_AGG(tt.tag_name ORDER BY tt.tag_level, tt.sort_order) 
    FILTER (WHERE tt.tag_name IS NOT NULL), 
    '{}'::text[]
  ) as tags,
  COALESCE(
    ARRAY_AGG(DISTINCT tt.tag_category) 
    FILTER (WHERE tt.tag_category IS NOT NULL), 
    '{}'::text[]
  ) as tag_categories,
  -- Application usage information
  COALESCE(
    ARRAY_AGG(DISTINCT a.slug) 
    FILTER (WHERE a.slug IS NOT NULL), 
    '{}'::text[]
  ) as used_by_applications,
  COALESCE(
    ARRAY_AGG(DISTINCT tka.usage_context) 
    FILTER (WHERE tka.usage_context IS NOT NULL), 
    '{}'::text[]
  ) as usage_contexts
FROM translation_export te
LEFT JOIN translation_keys tk ON (
  te.key_path = tk.key_path AND 
  te.project_slug = (SELECT slug FROM projects WHERE id = tk.project_id)
)
LEFT JOIN translation_key_tags tkt ON tk.id = tkt.key_id
LEFT JOIN translation_tags tt ON tkt.tag_id = tt.id AND tt.is_active = true
LEFT JOIN translation_key_applications tka ON tk.id = tka.key_id AND tka.is_active = true
LEFT JOIN applications a ON tka.application_id = a.id AND a.is_active = true
GROUP BY 
  te.project_slug, te.language_code, te.namespace, 
  te.key_path, te.value, te.is_approved, te.updated_at;

-- Tag hierarchy view for easier navigation
CREATE OR REPLACE VIEW tag_hierarchy AS
WITH RECURSIVE tag_tree AS (
  -- Base case: level 1 tags (no parent)
  SELECT 
    id, tag_name, tag_category, tag_level, parent_tag_id,
    description, sort_order, is_active,
    tag_name as root_tag,
    1 as depth,
    ARRAY[tag_name] as path
  FROM translation_tags 
  WHERE tag_level = 1 AND is_active = true
  
  UNION ALL
  
  -- Recursive case: child tags
  SELECT 
    t.id, t.tag_name, t.tag_category, t.tag_level, t.parent_tag_id,
    t.description, t.sort_order, t.is_active,
    tt.root_tag,
    tt.depth + 1,
    tt.path || t.tag_name
  FROM translation_tags t
  JOIN tag_tree tt ON t.parent_tag_id = tt.id
  WHERE t.is_active = true
)
SELECT * FROM tag_tree ORDER BY root_tag, depth, sort_order;

-- Application usage summary view
CREATE OR REPLACE VIEW application_usage_summary AS
SELECT 
  a.slug as application_slug,
  a.name as application_name,
  p.slug as project_slug,
  p.name as project_name,
  COUNT(DISTINCT tka.key_id) as total_terms_used,
  COUNT(DISTINCT CASE WHEN tka.usage_context = 'primary' THEN tka.key_id END) as primary_terms,
  COUNT(DISTINCT CASE WHEN tka.usage_context = 'secondary' THEN tka.key_id END) as secondary_terms,
  MAX(tka.last_verified_at) as last_verification_date
FROM applications a
LEFT JOIN translation_key_applications tka ON a.id = tka.application_id AND tka.is_active = true
LEFT JOIN translation_keys tk ON tka.key_id = tk.id
LEFT JOIN projects p ON tk.project_id = p.id
WHERE a.is_active = true
GROUP BY a.slug, a.name, p.slug, p.name
ORDER BY a.name, p.name;

-- ==========================================
-- STEP 7: Create Utility Functions
-- ==========================================

-- Function to get all tags for a translation key
CREATE OR REPLACE FUNCTION get_translation_key_tags(key_path_param TEXT, project_slug_param TEXT)
RETURNS TABLE(
  tag_name TEXT,
  tag_category TEXT,
  tag_level INTEGER,
  confidence_level DECIMAL,
  assigned_by TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tt.tag_name,
    tt.tag_category,
    tt.tag_level,
    tkt.confidence_level,
    tkt.assigned_by
  FROM translation_key_tags tkt
  JOIN translation_tags tt ON tkt.tag_id = tt.id
  JOIN translation_keys tk ON tkt.key_id = tk.id
  JOIN projects p ON tk.project_id = p.id
  WHERE tk.key_path = key_path_param 
    AND p.slug = project_slug_param
    AND tt.is_active = true
  ORDER BY tt.tag_level, tt.sort_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to find translation keys by tags
CREATE OR REPLACE FUNCTION find_translations_by_tags(tag_names TEXT[])
RETURNS TABLE(
  project_slug TEXT,
  key_path TEXT,
  namespace TEXT,
  matching_tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.slug as project_slug,
    tk.key_path,
    tk.namespace,
    ARRAY_AGG(tt.tag_name) as matching_tags
  FROM translation_keys tk
  JOIN projects p ON tk.project_id = p.id
  JOIN translation_key_tags tkt ON tk.id = tkt.key_id
  JOIN translation_tags tt ON tkt.tag_id = tt.id
  WHERE tt.tag_name = ANY(tag_names)
    AND tt.is_active = true
    AND p.is_active = true
  GROUP BY p.slug, tk.key_path, tk.namespace
  HAVING COUNT(DISTINCT tt.tag_name) = array_length(tag_names, 1) -- Must match ALL tags
  ORDER BY p.slug, tk.key_path;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to add application usage for a translation key
CREATE OR REPLACE FUNCTION add_translation_key_usage(
  key_path_param TEXT,
  project_slug_param TEXT,
  application_slug_param TEXT,
  usage_context_param TEXT DEFAULT 'primary',
  usage_frequency_param TEXT DEFAULT 'unknown'
)
RETURNS BOOLEAN AS $$
DECLARE
  key_id_var UUID;
  app_id_var UUID;
BEGIN
  -- Get key ID
  SELECT tk.id INTO key_id_var
  FROM translation_keys tk
  JOIN projects p ON tk.project_id = p.id
  WHERE tk.key_path = key_path_param AND p.slug = project_slug_param;
  
  -- Get application ID
  SELECT id INTO app_id_var
  FROM applications 
  WHERE slug = application_slug_param AND is_active = true;
  
  -- Both must exist
  IF key_id_var IS NULL OR app_id_var IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update usage record
  INSERT INTO translation_key_applications (
    key_id, application_id, usage_context, usage_frequency
  ) VALUES (
    key_id_var, app_id_var, usage_context_param, usage_frequency_param
  )
  ON CONFLICT (key_id, application_id) 
  DO UPDATE SET 
    usage_context = EXCLUDED.usage_context,
    usage_frequency = EXCLUDED.usage_frequency,
    last_verified_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 8: Migration Function for Existing Data
-- ==========================================

-- Function to migrate existing namespace data to tags
CREATE OR REPLACE FUNCTION migrate_namespaces_to_tags()
RETURNS INTEGER AS $$
DECLARE
  migration_count INTEGER := 0;
  rec RECORD;
  tag_id_var UUID;
BEGIN
  -- Migrate existing UI namespaces to functional tags
  FOR rec IN 
    SELECT DISTINCT namespace 
    FROM translation_keys 
    WHERE namespace IN ('buttons', 'states', 'interface', 'navigation', 'languages')
  LOOP
    -- Get the corresponding functional tag ID
    SELECT id INTO tag_id_var
    FROM translation_tags 
    WHERE tag_name = 'ui.' || rec.namespace;
    
    IF tag_id_var IS NOT NULL THEN
      -- Add tag assignments for all keys in this namespace
      INSERT INTO translation_key_tags (key_id, tag_id, assigned_by, confidence_level)
      SELECT tk.id, tag_id_var, 'migration', 1.00
      FROM translation_keys tk
      WHERE tk.namespace = rec.namespace
      ON CONFLICT (key_id, tag_id) DO NOTHING;
      
      GET DIAGNOSTICS migration_count = migration_count + ROW_COUNT;
    END IF;
  END LOOP;
  
  -- Add basic complexity tags for UI elements
  INSERT INTO translation_key_tags (key_id, tag_id, assigned_by, confidence_level)
  SELECT tk.id, tt.id, 'migration', 0.90
  FROM translation_keys tk
  CROSS JOIN translation_tags tt
  WHERE tk.namespace IN ('buttons', 'states', 'interface', 'navigation')
    AND tt.tag_name = 'complexity.basic'
  ON CONFLICT (key_id, tag_id) DO NOTHING;
  
  RETURN migration_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 9: Enable Row Level Security
-- ==========================================

-- Enable RLS for new tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_key_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_key_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
CREATE POLICY "Public read access to applications" ON applications FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to translation_tags" ON translation_tags FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to translation_key_tags" ON translation_key_tags FOR SELECT USING (true);
CREATE POLICY "Public read access to translation_key_applications" ON translation_key_applications FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to application_dependencies" ON application_dependencies FOR SELECT USING (true);

-- Admin policies for authenticated users
CREATE POLICY "Authenticated users can manage applications" ON applications FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage translation_tags" ON translation_tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage translation_key_tags" ON translation_key_tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage translation_key_applications" ON translation_key_applications FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage application_dependencies" ON application_dependencies FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- STEP 10: Summary and Verification
-- ==========================================

-- Run migration and provide summary
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  -- Run the migration
  SELECT migrate_namespaces_to_tags() INTO migrated_count;
  
  RAISE NOTICE '✅ Taxonomy system extension completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - applications (% records)', (SELECT COUNT(*) FROM applications);
  RAISE NOTICE '  - translation_tags (% records)', (SELECT COUNT(*) FROM translation_tags);
  RAISE NOTICE '  - translation_key_tags (% migrated)', migrated_count;
  RAISE NOTICE '  - translation_key_applications';
  RAISE NOTICE '  - application_dependencies';
  RAISE NOTICE '';
  RAISE NOTICE 'New views created:';
  RAISE NOTICE '  - translation_export_enhanced';
  RAISE NOTICE '  - tag_hierarchy';  
  RAISE NOTICE '  - application_usage_summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Utility functions created:';
  RAISE NOTICE '  - get_translation_key_tags()';
  RAISE NOTICE '  - find_translations_by_tags()';
  RAISE NOTICE '  - add_translation_key_usage()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update web interface to support tag management';
  RAISE NOTICE '  2. Create CSV import agent with taxonomy support';
  RAISE NOTICE '  3. Update client libraries if tag filtering needed';
  RAISE NOTICE '  4. Add application usage tracking to your apps';
END $$;

-- ==========================================
-- COMMENTS AND DOCUMENTATION
-- ==========================================

COMMENT ON TABLE applications IS 'Applications that use the translation system';
COMMENT ON TABLE translation_tags IS 'Hierarchical tag system for categorizing translation terms';
COMMENT ON TABLE translation_key_tags IS 'Many-to-many relationship between translation keys and tags';
COMMENT ON TABLE translation_key_applications IS 'Tracks which applications use which translation keys';
COMMENT ON TABLE application_dependencies IS 'Tracks dependencies between applications for shared translations';

COMMENT ON VIEW translation_export_enhanced IS 'Enhanced export view including tags and application usage information';
COMMENT ON VIEW tag_hierarchy IS 'Hierarchical view of all tags showing parent-child relationships';
COMMENT ON VIEW application_usage_summary IS 'Summary of translation usage by application and project';

COMMENT ON FUNCTION get_translation_key_tags IS 'Returns all tags assigned to a specific translation key';
COMMENT ON FUNCTION find_translations_by_tags IS 'Finds translation keys that match all specified tags';
COMMENT ON FUNCTION add_translation_key_usage IS 'Adds or updates application usage tracking for a translation key';
COMMENT ON FUNCTION migrate_namespaces_to_tags IS 'Migrates existing namespace data to the new tag system';