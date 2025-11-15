-- Security Improvements for Translation Management System
-- Run this script AFTER rotating your Supabase anon key
--
-- This script:
-- 1. Removes overly permissive RLS policies
-- 2. Implements proper read-only access for anon users
-- 3. Sets up admin role for write operations
-- 4. Adds database constraints for data integrity

-- ==========================================
-- STEP 1: Remove overly permissive policies
-- ==========================================

DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on languages" ON languages;
DROP POLICY IF EXISTS "Allow all operations on translation_keys" ON translation_keys;
DROP POLICY IF EXISTS "Allow all operations on translations" ON translations;

-- ==========================================
-- STEP 2: Create read-only policies for public access
-- ==========================================

-- Allow anyone to read projects (for application access)
CREATE POLICY "Public read access to projects"
  ON projects FOR SELECT
  USING (is_active = true);

-- Allow anyone to read languages (for application access)
CREATE POLICY "Public read access to languages"
  ON languages FOR SELECT
  USING (is_active = true);

-- Allow anyone to read translation keys (for application access)
CREATE POLICY "Public read access to translation_keys"
  ON translation_keys FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE is_active = true)
  );

-- Allow anyone to read approved translations (for application access)
CREATE POLICY "Public read access to approved translations"
  ON translations FOR SELECT
  USING (is_approved = true);

-- Allow reading all translations for authenticated users (for admin interface)
CREATE POLICY "Authenticated users can read all translations"
  ON translations FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==========================================
-- STEP 3: Create admin policies for write operations
-- ==========================================

-- Note: You'll need to set up Supabase Auth and create an admin_users table
-- For now, these policies require authentication but don't restrict by role
-- You can enhance these later with proper role-based access control

-- Allow authenticated users to insert/update/delete projects
CREATE POLICY "Authenticated users can manage projects"
  ON projects FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update/delete languages
CREATE POLICY "Authenticated users can manage languages"
  ON languages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update/delete translation keys
CREATE POLICY "Authenticated users can manage translation_keys"
  ON translation_keys FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update/delete translations
CREATE POLICY "Authenticated users can manage translations"
  ON translations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- STEP 4: Add database constraints for data integrity
-- ==========================================

-- Language codes must be exactly 3 characters (ISO 639-3)
ALTER TABLE languages
  ADD CONSTRAINT language_code_length CHECK (length(code) = 3);

-- Language names should have reasonable length limits
ALTER TABLE languages
  ADD CONSTRAINT language_name_length CHECK (length(name) <= 255);

ALTER TABLE languages
  ADD CONSTRAINT language_native_name_length CHECK (length(native_name) <= 255);

-- Project slugs should be reasonable length
ALTER TABLE projects
  ADD CONSTRAINT project_slug_length CHECK (length(slug) > 0 AND length(slug) <= 100);

-- Key paths should have reasonable length limits
ALTER TABLE translation_keys
  ADD CONSTRAINT key_path_length CHECK (length(key_path) > 0 AND length(key_path) <= 255);

-- Namespace should have reasonable length
ALTER TABLE translation_keys
  ADD CONSTRAINT namespace_length CHECK (length(namespace) > 0 AND length(namespace) <= 100);

-- Translation values should not be empty strings
ALTER TABLE translations
  ADD CONSTRAINT translation_value_not_empty CHECK (length(trim(value)) > 0);

-- Boolean columns should not be null
ALTER TABLE projects
  ADD CONSTRAINT projects_is_active_not_null CHECK (is_active IS NOT NULL);

ALTER TABLE languages
  ADD CONSTRAINT languages_is_active_not_null CHECK (is_active IS NOT NULL);

ALTER TABLE translations
  ADD CONSTRAINT translations_is_approved_not_null CHECK (is_approved IS NOT NULL);

-- ==========================================
-- STEP 5: Add missing indexes for performance
-- ==========================================

-- Index on translations.language_id (frequently queried)
CREATE INDEX IF NOT EXISTS idx_translations_language_id ON translations(language_id);

-- Index on translations.is_approved (for filtering approved translations)
CREATE INDEX IF NOT EXISTS idx_translations_is_approved ON translations(is_approved);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_translations_key_lang_approved
  ON translations(key_id, language_id, is_approved);

-- ==========================================
-- STEP 6: Create audit table (optional but recommended)
-- ==========================================

-- Audit table to track changes
CREATE TABLE IF NOT EXISTS translation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id UUID REFERENCES translations(id) ON DELETE CASCADE,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_translation_id ON translation_audit(translation_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON translation_audit(changed_at DESC);

-- Enable RLS on audit table
ALTER TABLE translation_audit ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view audit logs
CREATE POLICY "Authenticated users can read audit logs"
  ON translation_audit FOR SELECT
  USING (auth.role() = 'authenticated');

-- ==========================================
-- STEP 7: Create trigger for audit logging (optional)
-- ==========================================

-- Function to log translation changes
CREATE OR REPLACE FUNCTION log_translation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO translation_audit (translation_id, old_value, new_value, changed_by, action)
    VALUES (NEW.id, OLD.value, NEW.value, auth.uid(), 'UPDATE');
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO translation_audit (translation_id, old_value, new_value, changed_by, action)
    VALUES (NEW.id, NULL, NEW.value, auth.uid(), 'INSERT');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO translation_audit (translation_id, old_value, new_value, changed_by, action)
    VALUES (OLD.id, OLD.value, NULL, auth.uid(), 'DELETE');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log changes
DROP TRIGGER IF EXISTS translation_change_trigger ON translations;
CREATE TRIGGER translation_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON translations
  FOR EACH ROW EXECUTE FUNCTION log_translation_change();

-- ==========================================
-- STEP 8: Summary and next steps
-- ==========================================

-- Print summary
DO $$
BEGIN
  RAISE NOTICE '✅ Security improvements applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'What changed:';
  RAISE NOTICE '  1. Removed overly permissive "allow all" RLS policies';
  RAISE NOTICE '  2. Public users can now only READ approved translations';
  RAISE NOTICE '  3. Write operations require authentication';
  RAISE NOTICE '  4. Added database constraints for data integrity';
  RAISE NOTICE '  5. Added performance indexes';
  RAISE NOTICE '  6. Created audit logging system';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Set up Supabase Auth for your admin users';
  RAISE NOTICE '  2. Update your web interface to use authentication';
  RAISE NOTICE '  3. Test with the new anon key (after rotation)';
  RAISE NOTICE '  4. Consider implementing role-based access control';
END $$;

-- ==========================================
-- IMPORTANT NOTES:
-- ==========================================

-- BEFORE running this script:
-- 1. Rotate your Supabase anon key in the dashboard
-- 2. Update your .env and config.js with the new key
-- 3. Backup your database
--
-- AFTER running this script:
-- 1. Your anon key will only have read access to approved translations
-- 2. The web admin interface will require authentication
-- 3. You'll need to set up Supabase Auth for admin access
--
-- For development/testing, you can temporarily use the service_role key
-- but NEVER expose it in client-side code or version control!
