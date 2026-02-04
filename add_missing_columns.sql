-- Add missing server-side clock tracking columns to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS "clockRunning" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "clockLastStarted" timestamptz;

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS "bestClampSpeed" double precision;

-- If you are seeing 400 errors about columns like 'last_login', 
-- these errors should be gone now as we removed them from the code.
-- The columns above are the only ones needed for the new timing features.
