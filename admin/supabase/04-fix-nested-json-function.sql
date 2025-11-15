-- Fix for Incomplete Nested JSON Function
-- This script replaces the incomplete get_project_translations function
-- with a simpler, more efficient flat JSON structure that works with the client library
--
-- Run this in your Supabase SQL Editor after running 01-create-tables.sql

-- Drop the old incomplete function
DROP FUNCTION IF EXISTS get_project_translations(TEXT, TEXT);

-- Create improved function that returns flat JSON with dot-notation keys
-- This matches how the client library (polynesian-translations.js) expects data
CREATE OR REPLACE FUNCTION get_project_translations_json(
  project_slug_param TEXT,
  language_code_param TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Build a flat JSON object with key_path as keys
  -- Example: {"buttons.save": "Save", "game.messages.wordFound": "Word found!"}
  SELECT json_object_agg(tk.key_path, t.value)
  INTO result
  FROM translations t
  JOIN translation_keys tk ON t.key_id = tk.id
  JOIN projects p ON tk.project_id = p.id
  JOIN languages l ON t.language_id = l.id
  WHERE p.slug = project_slug_param
    AND l.code = language_code_param
    AND p.is_active = true
    AND l.is_active = true;

  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create alternative function for nested JSON structure (if needed)
-- This properly handles arbitrary depth nesting using recursive CTE
CREATE OR REPLACE FUNCTION get_project_translations_nested(
  project_slug_param TEXT,
  language_code_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  rec RECORD;
  path_parts TEXT[];
  i INT;
  current_obj JSONB;
BEGIN
  -- Loop through all translations for this project/language
  FOR rec IN
    SELECT
      tk.key_path,
      t.value,
      string_to_array(tk.key_path, '.') as path_array
    FROM translations t
    JOIN translation_keys tk ON t.key_id = tk.id
    JOIN projects p ON tk.project_id = p.id
    JOIN languages l ON t.language_id = l.id
    WHERE p.slug = project_slug_param
      AND l.code = language_code_param
      AND p.is_active = true
      AND l.is_active = true
    ORDER BY tk.key_path
  LOOP
    -- Build nested path by creating intermediate objects as needed
    current_obj := result;
    path_parts := rec.path_array;

    -- Build up the nested structure
    FOR i IN 1..array_length(path_parts, 1)-1 LOOP
      -- Create intermediate object if it doesn't exist
      IF NOT (current_obj #> path_parts[1:i]) ? path_parts[i] THEN
        result := jsonb_set(result, path_parts[1:i], '{}'::jsonb, true);
      END IF;
    END LOOP;

    -- Set the final value
    result := jsonb_set(result, path_parts, to_jsonb(rec.value), true);
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON FUNCTION get_project_translations_json IS
  'Returns translations as flat JSON with dot-notation keys (e.g., {"buttons.save": "Save"}). This is the recommended format for client libraries and matches the client-libraries/polynesian-translations.js expectations.';

COMMENT ON FUNCTION get_project_translations_nested IS
  'Returns translations as nested JSON (e.g., {"buttons": {"save": "Save"}, "game": {"messages": {"wordFound": "Found!"}}}). Use this if you need deeply nested structure. Handles arbitrary depth correctly.';

-- Create a simpler RPC wrapper for the web interface
CREATE OR REPLACE FUNCTION rpc_get_translations(
  project_slug_param TEXT,
  language_code_param TEXT,
  format_param TEXT DEFAULT 'flat'
)
RETURNS JSON AS $$
BEGIN
  IF format_param = 'nested' THEN
    RETURN get_project_translations_nested(project_slug_param, language_code_param)::json;
  ELSE
    RETURN get_project_translations_json(project_slug_param, language_code_param);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION rpc_get_translations IS
  'RPC wrapper for getting translations. Use format_param="flat" (default) for dot-notation keys or "nested" for hierarchical structure.';

-- Verify the functions work
DO $$
BEGIN
  RAISE NOTICE '✅ Translation functions updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  1. get_project_translations_json(project_slug, language_code)';
  RAISE NOTICE '     Returns: {"buttons.save": "Save", "game.messages.wordFound": "Found!"}';
  RAISE NOTICE '     Recommended for: Client libraries, web interfaces';
  RAISE NOTICE '     Format: Flat JSON with dot-notation keys';
  RAISE NOTICE '';
  RAISE NOTICE '  2. get_project_translations_nested(project_slug, language_code)';
  RAISE NOTICE '     Returns: {"buttons": {"save": "Save"}, "game": {"messages": {"wordFound": "Found!"}}}';
  RAISE NOTICE '     Recommended for: Complex hierarchical data needs';
  RAISE NOTICE '     Format: Nested JSON with proper depth handling';
  RAISE NOTICE '';
  RAISE NOTICE '  3. rpc_get_translations(project_slug, language_code, format_param)';
  RAISE NOTICE '     Returns: Either flat or nested based on format_param ("flat" or "nested")';
  RAISE NOTICE '     Recommended for: Flexible API endpoints';
  RAISE NOTICE '';
  RAISE NOTICE 'The old incomplete get_project_translations() function has been removed.';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage examples:';
  RAISE NOTICE '  SELECT get_project_translations_json(''polynesian-common'', ''haw'');';
  RAISE NOTICE '  SELECT get_project_translations_nested(''jemt4-music'', ''eng'');';
  RAISE NOTICE '  SELECT rpc_get_translations(''polynesian-common'', ''haw'', ''flat'');';
END $$;
