/**
 * Configuration Template for Translation Manager
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file to 'config.js' (same directory)
 * 2. Replace the placeholder values with your actual Supabase credentials
 * 3. NEVER commit config.js to version control (it's in .gitignore)
 *
 * To get your Supabase credentials:
 * 1. Go to https://supabase.com/dashboard
 * 2. Select your project
 * 3. Go to Settings > API
 * 4. Copy the "Project URL" and "anon/public" key
 */

window.SUPABASE_CONFIG = {
    // Your Supabase project URL (e.g., https://xxxxx.supabase.co)
    url: 'YOUR_SUPABASE_PROJECT_URL',

    // Your Supabase anon/public key (safe for client-side use)
    key: 'YOUR_SUPABASE_ANON_KEY'
};

// If you prefer not to store credentials in this file,
// comment out the above and the app will prompt for them
// (Note: prompting is less secure and will require re-entry each session)
