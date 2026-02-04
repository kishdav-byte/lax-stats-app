const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length > 0) {
            env[key.trim()] = vals.join('=').trim().replace(/^"(.*)"$/, '$1');
        }
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('--- CHECKING GAMES TABLE SCHEMA ---\n');

    // We can't easily get full schema via JS client without RPC, 
    // but we can try to fetch one row and see what comes back.
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching game:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns in games table:', Object.keys(data[0]));
    } else {
        console.log('No games found to inspect columns.');
    }

    console.log('\n--- CHECKING PROFILES TABLE SCHEMA ---\n');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError) {
        console.error('Error fetching profile:', profileError.message);
    } else if (profiles && profiles.length > 0) {
        console.log('Columns in profiles table:', Object.keys(profiles[0]));
    } else {
        console.log('No profiles found to inspect columns.');
    }
}

checkSchema();
