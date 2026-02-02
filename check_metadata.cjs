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
    const { data, error } = await supabase.rpc('get_tables'); // This might not exist
    if (error) {
        // Fallback: try querying information_schema if possible (often blocked)
        const { data: data2, error: error2 } = await supabase.from('teams').select('*', { count: 'exact', head: true });
        console.log('--- RE-CHECKING TEAMS ---');
        console.log(data2, error2);
    } else {
        console.log('TABLES:', data);
    }
}
check();
