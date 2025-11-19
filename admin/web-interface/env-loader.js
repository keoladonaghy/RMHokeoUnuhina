/**
 * Environment Variable Loader for GitHub Pages
 * This script loads environment variables into the window object
 * for use by the configuration system.
 */

// Load environment variables from various hosting platforms
(function() {
    'use strict';
    
    // GitHub Pages: Environment variables are injected via GitHub Secrets + build action
    // They'll be available as window.ENV_* variables set by a build script
    
    // For GitHub Pages deployment, these will be set by build action:
    if (typeof window.GITHUB_ENV !== 'undefined') {
        window.ENV_SUPABASE_URL = window.GITHUB_ENV.SUPABASE_URL;
        window.ENV_SUPABASE_KEY = window.GITHUB_ENV.SUPABASE_KEY;
    }
    
    // For Netlify deployment:
    if (typeof window.NETLIFY_ENV !== 'undefined') {
        window.ENV_SUPABASE_URL = window.NETLIFY_ENV.SUPABASE_URL;
        window.ENV_SUPABASE_KEY = window.NETLIFY_ENV.SUPABASE_KEY;
    }
    
    // For Vercel deployment:
    if (typeof window.VERCEL_ENV !== 'undefined') {
        window.ENV_SUPABASE_URL = window.VERCEL_ENV.SUPABASE_URL;
        window.ENV_SUPABASE_KEY = window.VERCEL_ENV.SUPABASE_KEY;
    }
    
    console.log('Environment loader: Checked for deployment environment variables');
})();