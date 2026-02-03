-- CRITICAL FIX: Allow data persistence in Supabase
-- Run this in your Supabase SQL Editor

-- Option 1: Disable RLS entirely (simplest for development)
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_penalties DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE drill_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use these policies instead
-- (Comment out Option 1 above and uncomment the lines below)

/*
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON teams;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON games;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON teams;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON games;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON teams;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON games;

-- Create permissive policies for anon and authenticated users
CREATE POLICY "Allow all for teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for game_stats" ON game_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for game_penalties" ON game_penalties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for access_requests" ON access_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for drill_assignments" ON drill_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for training_sessions" ON training_sessions FOR ALL USING (true) WITH CHECK (true);
*/
