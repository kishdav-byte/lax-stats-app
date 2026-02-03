
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

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- DB PERMISSIONS CHECK ---');
    console.log('Testing with URL:', supabaseUrl);

    // Check if we can insert into teams
    const testTeam = { id: 'test_id_' + Date.now(), name: 'Test Team', roster: [] };
    const { error: teamError } = await supabase.from('teams').insert(testTeam);

    if (teamError) {
        console.error('FAILED to insert into teams:', teamError.message);
        console.error('Error details:', teamError);
    } else {
        console.log('SUCCESS: Inserted into teams');
        // Clean up
        await supabase.from('teams').delete().eq('id', testTeam.id);
    }

    const testGame = {
        id: 'test_game_' + Date.now(),
        home_team: testTeam.id,
        away_team: testTeam.id,
        status: 'scheduled',
        scheduled_time: new Date().toISOString()
    };
    const { error: gameError } = await supabase.from('games').insert(testGame);

    if (gameError) {
        console.error('FAILED to insert into games:', gameError.message);
        console.error('Error details:', gameError);
    } else {
        console.log('SUCCESS: Inserted into games');
        await supabase.from('games').delete().eq('id', testGame.id);
    }
}

check();
