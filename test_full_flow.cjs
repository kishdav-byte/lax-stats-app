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

async function testGameInsert() {
    console.log('--- TESTING GAME INSERT WITH CAMELCASE ---\n');

    // First, create a test team
    const testTeam1 = {
        id: 'test_team_home_' + Date.now(),
        name: 'Test Home Team',
        roster: []
    };

    const testTeam2 = {
        id: 'test_team_away_' + Date.now(),
        name: 'Test Away Team',
        roster: []
    };

    console.log('1. Attempting to insert teams...');
    const { error: team1Error } = await supabase.from('teams').insert(testTeam1);
    const { error: team2Error } = await supabase.from('teams').insert(testTeam2);

    if (team1Error || team2Error) {
        console.error('❌ Team insert failed (RLS still blocking):');
        if (team1Error) console.error('  Team 1:', team1Error.message);
        if (team2Error) console.error('  Team 2:', team2Error.message);
        console.log('\n⚠️  YOU MUST RUN THE SQL IN SUPABASE TO DISABLE RLS!\n');
        return;
    }

    console.log('✅ Teams inserted successfully\n');

    // Now try to insert a game with camelCase
    const testGame = {
        id: 'test_game_' + Date.now(),
        homeTeam: testTeam1.id,
        awayTeam: testTeam2.id,
        scheduledTime: new Date().toISOString(),
        status: 'scheduled',
        score: { home: 0, away: 0 },
        currentPeriod: 1,
        gameClock: 720,
        periodType: 'quarters',
        clockType: 'stop',
        periodLength: 720,
        totalPeriods: 4
    };

    console.log('2. Attempting to insert game with camelCase...');
    const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert(testGame)
        .select();

    if (gameError) {
        console.error('❌ Game insert failed:', gameError.message);
        console.error('Full error:', gameError);
    } else {
        console.log('✅ Game inserted successfully!');
        console.log('Game data:', gameData);
    }

    // Cleanup
    console.log('\n3. Cleaning up test data...');
    await supabase.from('games').delete().eq('id', testGame.id);
    await supabase.from('teams').delete().eq('id', testTeam1.id);
    await supabase.from('teams').delete().eq('id', testTeam2.id);
    console.log('✅ Cleanup complete\n');

    if (!gameError && !team1Error && !team2Error) {
        console.log('🎉 SUCCESS! Your database is ready to accept games!');
        console.log('You can now add games in your app and they will persist.');
    }
}

testGameInsert();
