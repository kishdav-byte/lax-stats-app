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

async function diagnose() {
    console.log('--- DIAGNOSING DATA FETCH ---\n');

    // Fetch teams
    const { data: teams, error: teamsError } = await supabase.from('teams').select('*').limit(2);

    if (teamsError) {
        console.error('❌ Error fetching teams:', teamsError);
    } else {
        console.log('✅ Teams fetched:', teams?.length || 0);
        if (teams && teams.length > 0) {
            console.log('Sample team structure:', JSON.stringify(teams[0], null, 2));
        }
    }

    // Fetch games
    const { data: games, error: gamesError } = await supabase.from('games').select('*').limit(2);

    if (gamesError) {
        console.error('❌ Error fetching games:', gamesError);
    } else {
        console.log('\n✅ Games fetched:', games?.length || 0);
        if (games && games.length > 0) {
            console.log('Sample game structure:', JSON.stringify(games[0], null, 2));
            console.log('\nColumn names in game:', Object.keys(games[0]));
        }
    }
}

diagnose();
