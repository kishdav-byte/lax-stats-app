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

async function getSchema() {
    console.log('--- FETCHING ACTUAL SCHEMA ---\n');

    // Query information_schema for teams table
    const { data: teamsColumns, error: teamsError } = await supabase.rpc('exec_sql', {
        query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teams' ORDER BY ordinal_position;`
    });

    if (teamsError) {
        console.log('RPC not available, trying direct query...');
        // Fallback: try to get schema from a failed insert
        const { error: e1 } = await supabase.from('teams').insert({ _fake: true });
        console.log('Teams insert error:', e1);

        const { error: e2 } = await supabase.from('games').insert({ _fake: true });
        console.log('Games insert error:', e2);
    } else {
        console.log('Teams columns:', teamsColumns);
    }

    // Try getting games schema
    const { data: gamesColumns, error: gamesError } = await supabase.rpc('exec_sql', {
        query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'games' ORDER BY ordinal_position;`
    });

    if (!gamesError) {
        console.log('Games columns:', gamesColumns);
    }
}

getSchema();
