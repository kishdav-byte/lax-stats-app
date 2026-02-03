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

async function checkMarchGames() {
    console.log('--- CHECKING MARCH 2026 GAMES ---\n');

    const { data: games, error } = await supabase.from('games').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total games in database: ${games.length}\n`);

    // Filter for March 2026 games
    const marchGames = games.filter(g => {
        const date = g.scheduledTime;
        return date && date.startsWith('2026-03');
    });

    console.log(`March 2026 games: ${marchGames.length}\n`);

    if (marchGames.length > 0) {
        console.log('March games details:');
        marchGames.forEach(g => {
            console.log(`- ${g.scheduledTime}: ${g.homeTeam?.name || 'Unknown'} vs ${g.awayTeam?.name || 'Unknown'}`);
        });
    }

    // Show all game dates
    console.log('\nAll game dates:');
    games.forEach(g => {
        console.log(`- ${g.scheduledTime}`);
    });
}

checkMarchGames();
