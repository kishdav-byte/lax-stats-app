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

async function testInsert() {
    console.log('--- TESTING WITH CORRECT SCHEMA ---\n');

    // Test 1: Insert team with expected schema
    const testTeam = {
        id: 'test_team_' + Date.now(),
        name: 'Test Team',
        roster: []
    };

    console.log('Attempting to insert team:', testTeam);
    const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert(testTeam)
        .select();

    if (teamError) {
        console.error('❌ Team insert failed:', teamError.message);
        console.error('Full error:', teamError);
    } else {
        console.log('✅ Team inserted successfully:', teamData);
    }

    // Test 2: Try different column name variations for games
    const gameVariations = [
        {
            name: 'snake_case',
            data: {
                id: 'test_game_' + Date.now(),
                home_team: testTeam.id,
                away_team: testTeam.id,
                scheduled_time: new Date().toISOString(),
                status: 'scheduled'
            }
        },
        {
            name: 'camelCase',
            data: {
                id: 'test_game_' + Date.now(),
                homeTeam: testTeam.id,
                awayTeam: testTeam.id,
                scheduledTime: new Date().toISOString(),
                status: 'scheduled'
            }
        }
    ];

    for (const variation of gameVariations) {
        console.log(`\nTrying ${variation.name} for games...`);
        const { data: gameData, error: gameError } = await supabase
            .from('games')
            .insert(variation.data)
            .select();

        if (gameError) {
            console.error(`❌ ${variation.name} failed:`, gameError.message);
        } else {
            console.log(`✅ ${variation.name} worked!`, gameData);
            break;
        }
    }

    // Cleanup
    if (!teamError) {
        await supabase.from('teams').delete().eq('id', testTeam.id);
    }
}

testInsert();
