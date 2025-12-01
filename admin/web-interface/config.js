/**
 * Configuration file for Translation Manager
 * RMHokeoUnuhina Translation System
 * 
 * This file loads configuration from environment variables when available,
 * falling back to prompts for local development.
 */

window.SUPABASE_CONFIG = {
    // Try to load from environment variables first (GitHub Pages, Netlify, Vercel)
    url: window.GITHUB_ENV?.SUPABASE_URL || window.ENV_SUPABASE_URL || null,
    key: window.GITHUB_ENV?.SUPABASE_KEY || window.ENV_SUPABASE_KEY || null
};

// If no environment variables are set, try to load local development config
if (!window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.key) {
    // Try to load from config.local.js (not committed to git)
    // This file should be created from config.local.example.js for local development
    
    // If still no config, the app will prompt the user
    console.log('No Supabase configuration found in environment variables.');
    console.log('For local development, create config.local.js from config.local.example.js');
    console.log('For production, set SUPABASE_URL and SUPABASE_KEY secrets in GitHub.');
}