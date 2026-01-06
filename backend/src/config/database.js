const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let supabaseAdmin = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not configured.');
    console.warn('   Create a .env file in /backend with:');
    console.warn('   SUPABASE_URL=https://your-project.supabase.co');
    console.warn('   SUPABASE_ANON_KEY=your-anon-key');
    console.warn('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
    console.warn('');
    console.warn('   Running in DEMO MODE with in-memory storage...');
} else {
    // Public client (respects RLS policies)
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
    });

    // Admin client (bypasses RLS - use for server-side operations)
    supabaseAdmin = supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
            auth: { persistSession: false }
        })
        : supabase;
}

// Test connection
const testConnection = async () => {
    if (!supabase) {
        console.log('📦 Running in DEMO MODE (no database)');
        return false;
    }

    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') {
            console.error('Supabase connection failed:', error.message);
            return false;
        }
        console.log('✅ Supabase Connected');
        return true;
    } catch (err) {
        console.error('Supabase error:', err.message);
        return false;
    }
};

// Check if Supabase is configured
const isConfigured = () => supabase !== null;

module.exports = {
    supabase,
    supabaseAdmin,
    testConnection,
    isConfigured
};
