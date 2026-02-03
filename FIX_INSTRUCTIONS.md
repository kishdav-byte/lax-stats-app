# 🔧 CRITICAL FIX REQUIRED: Games Not Saving to Database

## Problem Identified
Your games are not persisting because of **TWO critical issues**:

### Issue 1: Row-Level Security (RLS) Blocking All Writes ❌
Supabase RLS policies are rejecting all INSERT operations on the `teams` and `games` tables.

### Issue 2: Schema Mismatch (FIXED ✅)
The application code was using `snake_case` column names (`home_team`, `away_team`) but your Supabase database uses `camelCase` (`homeTeam`, `awayTeam`). This has been fixed in the latest commit.

---

## IMMEDIATE ACTION REQUIRED

### Step 1: Disable RLS in Supabase (Required)

1. Go to: https://app.supabase.com/project/qiwaxgruejxmgxzzvgko/editor
2. Click the **SQL Editor** tab (left sidebar)
3. Click **"New Query"**
4. Copy and paste the contents of `fix_rls.sql` (in your project root)
5. Click **RUN** (or press Cmd+Enter)

**The SQL will disable RLS on all tables, allowing your app to save data.**

---

### Step 2: Test the Fix

After running the SQL, test that it worked:

```bash
node test_insert.cjs
```

You should see:
```
✅ Team inserted successfully
✅ camelCase worked!
```

---

### Step 3: Re-import Your Schedule

1. Refresh your app at http://localhost:5173
2. Log in
3. Go to **Schedule** tab
4. Select "DORMAN BOYS LACROSSE" as the managed team
5. Click **"AI SYNC"** and paste your schedule
6. Games should now persist to the database!

---

## What Was Fixed in the Code

### ✅ Fixed Files (Already Pushed to Vercel):
- `src/services/storageService.ts`:
  - `saveGame()` now uses `homeTeam`, `awayTeam`, `scheduledTime` (camelCase)
  - `fetchInitialData()` now reads `g.homeTeam`, `g.awayTeam`, etc. (camelCase)

### 📝 SQL Script Created:
- `fix_rls.sql` - Run this in Supabase SQL Editor to disable RLS

### 🧪 Diagnostic Scripts Created:
- `test_insert.cjs` - Verify database write permissions
- `check_permissions.cjs` - Check RLS policy status
- `table_check.cjs` - Count rows in all tables

---

## Why This Happened

When you migrated from Firebase to Supabase, the database schema was created with camelCase column names, but the application code was written assuming snake_case. Additionally, RLS was enabled by default on all tables without permissive policies, blocking all anonymous writes.

---

## Next Steps After Fix

Once RLS is disabled and you've re-imported your schedule:

1. Verify games appear on Dashboard
2. Verify games appear on Schedule tab
3. Verify games appear on Calendar view
4. Test adding a single game manually
5. Test starting a game (should work now)

---

**Status: Waiting for you to run the SQL in Supabase SQL Editor**
