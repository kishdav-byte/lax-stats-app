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

async function checkStats() {
    console.log('--- CHECKING GAME STATS ---\n');

    // Get the most recent game
    const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'live')
        .order('scheduledTime', { ascending: false })
        .limit(1);

    if (gamesError) {
        console.error('Error fetching games:', gamesError);
        return;
    }

    if (!games || games.length === 0) {
        console.log('No live games found. Checking all games...');
        const { data: allGames } = await supabase
            .from('games')
            .select('*')
            .order('scheduledTime', { ascending: false })
            .limit(1);

        if (allGames && allGames.length > 0) {
            console.log('Most recent game:', allGames[0].id);
            console.log('Status:', allGames[0].status);
        }
        return;
    }

    const game = games[0];
    console.log('Live game found:', game.id);
    console.log('Home:', game.homeTeam?.name);
    console.log('Away:', game.awayTeam?.name);

    // Check game_stats table
    const { data: stats, error: statsError } = await supabase
        .from('game_stats')
        .select('*')
        .eq('game_id', game.id);

    if (statsError) {
        console.error('Error fetching stats:', statsError);
    } else {
        console.log(`\nStats in game_stats table: ${stats?.length || 0}`);
        if (stats && stats.length > 0) {
            console.log('Sample stat:', stats[0]);
        }
    }

    // Check if stats are in the game object itself (JSONB)
    if (game.stats) {
        console.log(`\nStats in game.stats (JSONB): ${Array.isArray(game.stats) ? game.stats.length : 'not an array'}`);
        if (Array.isArray(game.stats) && game.stats.length > 0) {
            console.log('Sample stat from JSONB:', game.stats[0]);
        }
    } else {
        console.log('\ngame.stats is null or undefined');
    }
}

checkStats();
