# NBA Cup 2026  — Firefox Extension 

A  popup extension for the 2026 Emirates NBA Cup:

1. **Countdown timer** (America/New_York time) — first thing shown, counts down to the next Cup Night or knockout round, switches to a "live" state during each round's ~4-hour window.
2. **Scores by date** — pick any date and it fetches that day's real NBA games from balldontlie.io. Defaults to today.
3. **Visit NBA Cup Live** button — the only outbound link anywhere in the extension.
4. Reference tabs: **Schedule, Groups, Teams (searchable), Standings**.

## ⚠️ Required setup: add your API key to `config.js`

There is **no in-app settings screen** — the key lives directly in source, in one file:

1. Get a free API key from balldontlie.io (create an account, copy the key from your dashboard)
2. Open **`config.js`** in this folder
3. Replace `"PASTE_YOUR_BALLDONTLIE_API_KEY_HERE"` with your actual key, keeping the quotes:
   ```js
   const BALLDONTLIE_API_KEY = "your-real-key-here";
   ```
4. Save, then reload the extension (`about:debugging` → **Reload**)

Until you do this, the Scores section will show "No API key set."

## How scores work

- The date input defaults to today in **America/New_York** and fetches on load.
- Changing the date (or clicking **Get Scores** / 🔄) calls `GET https://api.balldontlie.io/nba/v1/games?dates[]=YYYY-MM-DD` and renders each game's teams, score, and status.
- The title switches between "Cup Scores" and "NBA Scores" depending on whether the selected date is one of the 12 designated 2026 Cup Night dates (`CUP_GAME_DATES` in `popup.js`) — this is a label only; any date's real games are shown.
- balldontlie's `status` field is already human-readable — a scheduled clock time, `"1st Qtr"` / `"2nd Qtr"` / etc. while live, or `"Final"` once over. `renderGameStatus()` in `popup.js` is where to adjust this if the wording differs once you see live traffic.

## Load it in Firefox (temporary, for testing)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select the `manifest.json` file inside this folder
4. The 🏆 icon appears in the toolbar

Temporary add-ons are removed when Firefox restarts — reload the same way to test again, and again any time you edit `config.js`.


## Editing content

- **API key**: `config.js`
- **Cup dates / countdown targets**: `CUP_EVENTS` array in `popup.js` (kickoff times, pre-converted to UTC — see comments for the EDT/EST DST cutover on Nov 1, 2026)
- **Cup Night calendar dates** (used only for the Cup/NBA label): `CUP_GAME_DATES` in `popup.js`
- **Groups/teams/schedule reference text**: `popup.html` (Schedule/Groups panels) and the `TEAMS` array in `popup.js`
- **Colors**: CSS variables at the top of `popup.css`
- **Website link**: the single `nbacuplive.com` link is in `popup.html` (`.visit-btn`)

## Files

```
manifest.json     MV3 manifest — api.balldontlie.io host permission only
config.js         Your balldontlie.io API key — edit this
popup.html        Countdown hero + date-picker scores + visit button + reference tabs
popup.css         Styling using your site's navy/gold/red palette
popup.js          Countdown, balldontlie.io fetch/render by date, tab switching, team search
icons/            Toolbar and store icons (16/32/48/96/128px)
```
The live extension url is already added in the project.

Follow the action with live scores at https://nbacuplive.com

Want the full story on NBA Cup 2026? Head to https://nba-cup-2026.jimdosite.com/



