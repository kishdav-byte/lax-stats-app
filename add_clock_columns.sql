-- Add server-side clock tracking columns to games table
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS "clockRunning" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "clockLastStarted" timestamptz;

-- Add comment explaining the columns
COMMENT ON COLUMN games."clockRunning" IS 'Whether the game clock is currently running (server-side)';
COMMENT ON COLUMN games."clockLastStarted" IS 'ISO timestamp when the clock was last started (for calculating elapsed time)';
