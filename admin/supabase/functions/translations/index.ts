import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationResponse {
  [key: string]: string
}

interface AvailableLanguage {
  code: string
  name: string
  nativeName: string
  isActive: boolean
}

interface Project {
  slug: string
  name: string
  description?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Remove 'functions' and 'translations' from path
    const apiPath = pathParts.slice(2)

    // Route handling
    if (apiPath.length === 0) {
      // GET /api/translations - return API info
      return new Response(JSON.stringify({
        name: 'Polynesian Translation API',
        version: '1.0.0',
        endpoints: [
          'GET /api/translations/:project/:language',
          'GET /api/translations/available-languages', 
          'GET /api/translations/projects'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (apiPath[0] === 'available-languages') {
      // GET /api/translations/available-languages
      const { data: languages, error } = await supabase
        .from('languages')
        .select('code, name, native_name, is_active')
        .eq('is_active', true)
        .in('code', ['eng', 'haw', 'mao']) // Only enable specified languages
        .order('code')

      if (error) throw error

      const response: AvailableLanguage[] = languages.map(lang => ({
        code: lang.code,
        name: lang.name,
        nativeName: lang.native_name,
        isActive: lang.is_active
      }))

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (apiPath[0] === 'projects') {
      // GET /api/translations/projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('slug, name, description')
        .order('name')

      if (error) throw error

      const response: Project[] = projects.map(project => ({
        slug: project.slug,
        name: project.name,
        description: project.description
      }))

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (apiPath.length === 2) {
      // GET /api/translations/:project/:language
      const [projectSlug, languageCode] = apiPath

      // Validate language code
      if (!['eng', 'haw', 'mao'].includes(languageCode)) {
        return new Response(JSON.stringify({
          error: 'Unsupported language code',
          supportedLanguages: ['eng', 'haw', 'mao']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get translations for both common and project-specific
      const projects = projectSlug === 'all' 
        ? ['polynesian-common']
        : ['polynesian-common', projectSlug]

      const { data: translations, error } = await supabase
        .from('translation_export')
        .select('key_path, value, project_slug')
        .eq('language_code', languageCode)
        .in('project_slug', projects)

      if (error) throw error

      // Build response object with project-specific translations overriding common ones
      const response: TranslationResponse = {}
      
      // First add common translations
      translations
        .filter(t => t.project_slug === 'polynesian-common')
        .forEach(t => {
          response[t.key_path] = t.value
        })

      // Then add/override with project-specific translations
      if (projectSlug !== 'polynesian-common') {
        translations
          .filter(t => t.project_slug === projectSlug)
          .forEach(t => {
            response[t.key_path] = t.value
          })
      }

      // Add metadata
      const metadata = {
        _metadata: {
          project: projectSlug,
          language: languageCode,
          count: Object.keys(response).length,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }

      return new Response(JSON.stringify({ ...response, ...metadata }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        },
      })
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Translation API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})