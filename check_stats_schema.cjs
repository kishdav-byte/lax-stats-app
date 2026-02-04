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

async function checkStatsSchema() {
    console.log('--- CHECKING GAME_STATS TABLE SCHEMA ---\n');
    const { data, error } = await supabase.from('game_stats').select('*').limit(1);
    if (error) {
        console.error('Error fetching game_stats:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns in game_stats table:', Object.keys(data[0]));
    } else {
        console.log('No stats found to inspect columns.');
    }

    console.log('\n--- CHECKING GAME_PENALTIES TABLE SCHEMA ---\n');
    const { data: penalties, error: penError } = await supabase.from('game_penalties').select('*').limit(1);
    if (penError) {
        console.error('Error fetching game_penalties:', penError.message);
    } else if (penalties && penalties.length > 0) {
        console.log('Columns in game_penalties table:', Object.keys(penalties[0]));
    } else {
        console.log('No penalties found to inspect columns.');
    }
}

checkStatsSchema();
