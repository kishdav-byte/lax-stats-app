const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { count, error } = await supabase.from('games').select('*', { count: 'exact', head: true });
    if (error) console.error(error);
    else console.log('GAME_COUNT:' + count);

    const { data: teams } = await supabase.from('teams').select('id, name');
    console.log('TEAM_COUNT:' + (teams ? teams.length : 0));
}
check();
