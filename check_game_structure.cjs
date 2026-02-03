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

async function checkGameStructure() {
    console.log('--- CHECKING GAME STRUCTURE ---\n');

    const { data: games, error } = await supabase.from('games').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (games && games.length > 0) {
        const game = games[0];
        console.log('Sample game:');
        console.log(JSON.stringify(game, null, 2));

        console.log('\n--- Validation ---');
        console.log('Has homeTeam object?', typeof game.homeTeam === 'object' && game.homeTeam !== null);
        console.log('Has awayTeam object?', typeof game.awayTeam === 'object' && game.awayTeam !== null);
        console.log('homeTeam has roster?', game.homeTeam?.roster !== undefined);
        console.log('awayTeam has roster?', game.awayTeam?.roster !== undefined);

        if (!game.homeTeam?.roster || !game.awayTeam?.roster) {
            console.log('\n⚠️  WARNING: Teams missing roster arrays!');
            console.log('This will cause the GameTracker to fail.');
        }
    } else {
        console.log('No games found in database.');
    }
}

checkGameStructure();
