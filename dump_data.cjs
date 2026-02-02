const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: teams } = await supabase.from('teams').select('*');
    console.log('TEAMS:', JSON.stringify(teams, null, 2));

    const { data: games } = await supabase.from('games').select('*');
    console.log('GAMES:', JSON.stringify(games, null, 2));
}
check();
