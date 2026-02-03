
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

async function checkColumns() {
    console.log('--- TABLE STRUCTURE CHECK ---');

    // Check teams
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').limit(1);
    if (teamsError) {
        console.error('Teams error:', teamsError);
    } else {
        console.log('Teams columns:', teamsData && teamsData.length > 0 ? Object.keys(teamsData[0]) : 'Table is empty, cannot infer columns from select *');
    }

    // Check games
    const { data: gamesData, error: gamesError } = await supabase.from('games').select('*').limit(1);
    if (gamesError) {
        console.error('Games error:', gamesError);
    } else {
        console.log('Games columns:', gamesData && gamesData.length > 0 ? Object.keys(gamesData[0]) : 'Table is empty, cannot infer columns from select *');
    }
}

checkColumns();
