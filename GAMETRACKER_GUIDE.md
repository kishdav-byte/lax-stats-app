# 🎮 GameTracker Complete User Guide

## 📍 Where Everything Is Located

### Top Section (Scoreboard & Clock)
```
┌─────────────────────────────────────────────────────────┐
│  HOME TEAM NAME          12:00          AWAY TEAM NAME  │
│       15                  Q1                   8         │
│      [+1]              [▶/⏸]               [+1]         │
└─────────────────────────────────────────────────────────┘
```

### Middle Section (Player Rosters)
```
┌──────────────────────┬──────────────────────┐
│   HOME TEAM ROSTER   │   AWAY TEAM ROSTER   │
├──────────────────────┼──────────────────────┤
│ #13 Carter Kish      │ #7 John Doe          │
│ #12 Liam Courier     │ #10 Jane Smith       │
│ (Click to select)    │ (Click to select)    │
└──────────────────────┴──────────────────────┘
```

### Bottom Section (Stats Tables)
```
┌─────────────────────────────────────────────────────────┐
│         HOME TEAM // STATS                              │
├──────┬────┬───┬─────┬────┬────┬────┬────┬─────┬─────┤
│ NAME │ #  │ G │  A  │ SHT│ GB │ TO │ CT │ FOW │ FOL │
├──────┼────┼───┼─────┼────┼────┼────┼────┼─────┼─────┤
│Carter│ 13 │ 2 │  1  │ 5  │ 3  │ 1  │ 0  │  0  │  0  │
│Liam  │ 12 │ 1 │  2  │ 3  │ 2  │ 0  │ 1  │  0  │  0  │
└──────┴────┴───┴─────┴────┴────┴────┴────┴─────┴─────┘
```

---

## 🎯 Step-by-Step Instructions

### 1️⃣ Starting the Game

1. **Click "START GAME ⚡"** (bottom right)
2. Game switches to live tracking mode
3. Clock is PAUSED initially

### 2️⃣ Starting the Clock

**Option A:** Click the **clock display** (12:00)
**Option B:** Click the **▶ button** next to the clock

- Clock turns **GREEN** when running
- Clock counts DOWN (12:00 → 11:59 → 11:58...)
- Clock auto-pauses at 0:00

### 3️⃣ Pausing the Clock

- Click the **⏸ button** or click the clock again
- Clock turns **ORANGE** when paused

### 4️⃣ Recording a Goal (WITH Player Stats)

**Best Practice Method:**

1. **Click the player** who scored (in the roster)
2. **Click "G"** (Goal button)
3. **If there was an assist:**
   - A modal pops up asking "Who assisted?"
   - Click the assisting player
   - Both players get stats recorded
4. **Score updates automatically**
5. **Stats appear in the table below**

### 5️⃣ Quick Score (WITHOUT Player Stats)

**Fast Method (not recommended for tracking):**

1. Click **[+1]** button under HOME or AWAY
2. Score increases
3. NO player stats are recorded

### 6️⃣ Recording Other Stats

1. **Click a player** in the roster
2. **Click the stat button:**
   - **SHT** = Shot (missed)
   - **GB** = Ground Ball pickup
   - **TO** = Turnover (lost possession)
   - **CT** = Caused Turnover (forced opponent turnover)
   - **SV** = Save (goalie only)
   - **FOW** = Faceoff Win
   - **FOL** = Faceoff Loss

3. Stat is recorded with:
   - ✅ Player name
   - ✅ Game clock time
   - ✅ Current period

### 7️⃣ Recording a Penalty

1. **Click a player** in the roster
2. **Click "⚠️ PENALTY"** button
3. **Select penalty type:**
   - Slashing
   - Tripping
   - Holding
   - Illegal Body Check
   - Unsportsmanlike Conduct
4. **Select duration:**
   - 30 seconds
   - 1 minute
   - 2 minutes (releasable)
   - 3 minutes (non-releasable)
5. Penalty is recorded and timer starts

### 8️⃣ Viewing Stats During Game

**Stats are displayed in TWO places:**

1. **Stats Tables** (scroll down):
   - Full breakdown by player
   - All stat categories (G, A, SHT, GB, etc.)
   - Team totals at bottom

2. **Live Feed** (right side):
   - Recent events in chronological order
   - Shows who scored, when, and at what time
   - Can delete stats by clicking trash icon

### 9️⃣ Changing Periods

1. **Click "NEXT PERIOD"** button (appears when clock hits 0:00)
2. Period advances (Q1 → Q2 → Q3 → Q4)
3. Clock resets to period length
4. Stats continue accumulating

### 🔟 Ending the Game

1. **Click "END GAME"** button (appears after final period)
2. Game status changes to "finished"
3. **AI Summary** is generated automatically
4. **Game Report** is created with:
   - Final score
   - All player stats
   - Top performers
   - Game highlights

---

## 📊 Where Stats Are Saved

### During the Game:
- ✅ Stats are saved to **Supabase** in real-time
- ✅ Each stat includes: player, type, time, period
- ✅ Stats persist even if you refresh the page

### After the Game:
- ✅ View in **Game Report** (click "VIEW REPORT")
- ✅ View in **Analytics** tab (team/player trends)
- ✅ View in **Player Profile** (individual stats)

---

## 🐛 Troubleshooting

### "Stats aren't showing up!"
- **Scroll down** - Stats tables are below the rosters
- Make sure you clicked a **player first**, then the stat button
- Check the **Live Feed** on the right to confirm stats were recorded

### "Clock won't start!"
- Make sure you clicked **"START GAME"** first
- Click the **clock display** or the **▶ button**
- Check that the game status is "live" (not "scheduled")

### "Score isn't updating!"
- Use the **"G" button** (not the +1 button) for accurate tracking
- The +1 button is for quick fixes only

---

## 💡 Pro Tips

1. **Always record goals through player stats** (not +1 button)
   - This ensures proper stat tracking
   - Enables AI analysis
   - Creates accurate game reports

2. **Use the Live Feed** to verify stats
   - Shows recent events in real-time
   - Can delete mistakes quickly

3. **Pause the clock** when recording stats
   - Prevents missing action
   - Ensures accurate timestamps

4. **Record assists** when prompted
   - Builds complete player profiles
   - Improves analytics accuracy

5. **Check stats tables** periodically
   - Verify all stats are recorded
   - Catch any mistakes early

---

## 🎯 Quick Reference

| Action | How To |
|--------|--------|
| Start Clock | Click clock or ▶ button |
| Pause Clock | Click clock or ⏸ button |
| Record Goal | Click player → "G" → (optional) select assist |
| Record Shot | Click player → "SHT" |
| Record Save | Click goalie → "SV" |
| Record Faceoff | Click player → "FOW" or "FOL" |
| Add Penalty | Click player → "⚠️ PENALTY" |
| Quick Score | Click [+1] under team name |
| Next Period | Click "NEXT PERIOD" (when clock = 0:00) |
| End Game | Click "END GAME" (after final period) |
| View Stats | Scroll down to stats tables |
| Delete Stat | Click trash icon in Live Feed |

---

**Need help? The stats ARE being recorded - just scroll down to see the tables!** 📊
