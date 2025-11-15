-- Supabase Translation Management System Schema
-- Run these commands in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for all tables
-- Note: You can modify permissions later based on your needs

-- 1. Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Languages table  
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'eng', 'haw', 'mao', etc.
  name TEXT NOT NULL, -- 'English', 'Hawaiian', etc.
  native_name TEXT NOT NULL, -- 'English', 'ʻŌlelo Hawaiʻi', etc.
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Translation keys table (hierarchical structure)
CREATE TABLE translation_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  key_path TEXT NOT NULL, -- 'buttons.save', 'game.messages.wordFound'
  namespace TEXT NOT NULL, -- 'buttons', 'game', 'instructions'
  description TEXT,
  context TEXT, -- Additional context for translators
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, key_path)
);

-- 4. Translations table
CREATE TABLE translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES translation_keys(id) ON DELETE CASCADE,
  language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  notes TEXT, -- Translator notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key_id, language_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_translation_keys_project ON translation_keys(project_id);
CREATE INDEX idx_translation_keys_namespace ON translation_keys(namespace);
CREATE INDEX idx_translation_keys_path ON translation_keys(key_path);
CREATE INDEX idx_translations_key_lang ON translations(key_id, language_id);

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_keys_updated_at BEFORE UPDATE ON translation_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert initial languages data
INSERT INTO languages (code, name, native_name, sort_order) VALUES
('eng', 'English', 'English', 1),
('haw', 'Hawaiian', 'ʻŌlelo Hawaiʻi', 2),
('mao', 'Māori', 'Te Reo Māori', 3),
('tah', 'Tahitian', 'Reo Tahiti', 4),
('fra', 'French', 'Français', 5),
('spa', 'Spanish', 'Español', 6),
('smo', 'Samoan', 'Gagana Sāmoa', 7),
('ton', 'Tongan', 'Lea Fakatonga', 8);

-- 9. Insert initial projects data
INSERT INTO projects (name, slug, description) VALUES
('Polynesian Common', 'polynesian-common', 'Shared UI elements across all projects'),
('JEMT4 Music Theory', 'jemt4-music', 'Hawaiian music theory education application'),
('KimiKupu Word Game', 'kimiKupu-specific', 'Polynesian word puzzle game interface'),
('PangaKupu Crossword', 'pangaKupu-specific', 'Crossword-style word puzzle interface');

-- 10. Enable Row Level Security (optional - you can customize these policies)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;  
ALTER TABLE translation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

-- 11. Create basic policies (allows all operations for now - customize as needed)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on languages" ON languages FOR ALL USING (true);
CREATE POLICY "Allow all operations on translation_keys" ON translation_keys FOR ALL USING (true);
CREATE POLICY "Allow all operations on translations" ON translations FOR ALL USING (true);

-- 12. Create a view for easy translation export
CREATE OR REPLACE VIEW translation_export AS
SELECT 
  p.slug as project_slug,
  l.code as language_code,
  tk.namespace,
  tk.key_path,
  t.value,
  t.is_approved,
  t.updated_at
FROM translations t
JOIN translation_keys tk ON t.key_id = tk.id
JOIN projects p ON tk.project_id = p.id
JOIN languages l ON t.language_id = l.id
WHERE p.is_active = true AND l.is_active = true;

-- 13. Create a function to get translations in JSON format
CREATE OR REPLACE FUNCTION get_project_translations(
  project_slug_param TEXT,
  language_code_param TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH nested_translations AS (
    SELECT 
      string_to_array(tk.key_path, '.') as key_parts,
      t.value
    FROM translations t
    JOIN translation_keys tk ON t.key_id = tk.id
    JOIN projects p ON tk.project_id = p.id
    JOIN languages l ON t.language_id = l.id
    WHERE p.slug = project_slug_param 
      AND l.code = language_code_param
      AND p.is_active = true 
      AND l.is_active = true
  )
  SELECT json_object_agg(
    key_parts[1],
    CASE 
      WHEN array_length(key_parts, 1) = 1 THEN to_json(value)
      ELSE json_build_object(key_parts[2], value) -- This is simplified, real nested JSON requires recursive function
    END
  ) INTO result
  FROM nested_translations;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE projects IS 'Translation projects (applications)';
COMMENT ON TABLE languages IS 'Supported languages with their codes and display names';
COMMENT ON TABLE translation_keys IS 'Translation keys with hierarchical paths (e.g., buttons.save)';
COMMENT ON TABLE translations IS 'Actual translation values for each key in each language';
COMMENT ON VIEW translation_export IS 'Flattened view of all translations for easy querying';
COMMENT ON FUNCTION get_project_translations IS 'Function to retrieve translations in JSON format for a specific project and language';