import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkGames() {
    const { data, count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact' });

    if (error) {
        console.error('Error fetching games:', error);
        return;
    }

    console.log(`Successfully connected to Supabase.`);
    console.log(`Total games in database: ${count}`);
    if (data && data.length > 0) {
        console.log('Sample game data (status and teams):');
        data.slice(0, 5).forEach(g => {
            console.log(`- ID: ${g.id}, Status: ${g.status}, Home: ${g.home_team}, Away: ${g.away_team}`);
        });
    } else {
        console.log('No games found in the "games" table.');
    }
}

checkGames();
