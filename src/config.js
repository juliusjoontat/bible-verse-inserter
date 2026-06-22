/**
 * Bible Extension Configuration
 * Update these values with your Supabase credentials
 */

const CONFIG = {
  // Your Supabase project URL
  // Get from: https://supabase.com → Your Project → Settings → API
  // Example: https://xxxxx.supabase.co
  SUPABASE_URL: 'https://your-project.supabase.co',
  
  // Your Supabase anon public key
  // Get from: https://supabase.com → Your Project → Settings → API
  // Under "Project API keys" → "anon public"
  SUPABASE_KEY: 'your-anon-key-here',
  
  // API endpoint path
  API_ENDPOINT: '/rest/v1/verses',
  
  // Cache settings
  CACHE_ENABLED: true,
  CACHE_DURATION_MS: 3600000, // 1 hour
  
  // UI settings
  RESULTS_LIMIT: 100,
  SHOW_VERSE_NUMBERS: true,
  
  // Debug mode (set to true to see console logs)
  DEBUG: false
};

/**
 * Log helper function
 */
function log(...args) {
  if (CONFIG.DEBUG) {
    console.log('[BibleExtension]', ...args);
  }
}

/**
 * Validate configuration
 */
function validateConfig() {
  const errors = [];
  
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL === 'https://your-project.supabase.co') {
    errors.push('SUPABASE_URL not configured');
  }
  
  if (!CONFIG.SUPABASE_KEY || CONFIG.SUPABASE_KEY === 'your-anon-key-here') {
    errors.push('SUPABASE_KEY not configured');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, log, validateConfig };
}
