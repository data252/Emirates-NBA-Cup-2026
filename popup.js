// ============================================================
// Countdown (America/New_York)
// ============================================================
// Each kickoff is pre-converted from its ET local time to UTC so the
// countdown is correct regardless of the viewer's own timezone or the
// US DST change on Nov 1, 2026 (EDT UTC-4 -> EST UTC-5).
const CUP_EVENTS = [
  { label: "Cup Night 1 tips off",       utc: Date.UTC(2026, 9, 30, 23, 0, 0) }, // Oct 30, 7:00 PM EDT
  { label: "Cup Night 2 tips off",       utc: Date.UTC(2026, 10, 7, 0, 0, 0) },  // Nov 6, 7:00 PM EST
  { label: "Cup Night 3 tips off",       utc: Date.UTC(2026, 10, 14, 0, 0, 0) }, // Nov 13, 7:00 PM EST
  { label: "Cup Night 4 tips off",       utc: Date.UTC(2026, 10, 21, 0, 0, 0) }, // Nov 20, 7:00 PM EST
  { label: "Thanksgiving Eve Cup Night", utc: Date.UTC(2026, 10, 25, 0, 0, 0) }, // Nov 24, 7:00 PM EST
  { label: "Cup Night tips off",         utc: Date.UTC(2026, 10, 26, 0, 0, 0) }, // Nov 25, 7:00 PM EST
  { label: "Final Group Play night",     utc: Date.UTC(2026, 10, 28, 0, 0, 0) }, // Nov 27, 7:00 PM EST
  { label: "Quarterfinals begin",        utc: Date.UTC(2026, 11, 5, 0, 0, 0) },  // Dec 4, 7:00 PM EST
  { label: "Semifinals begin",           utc: Date.UTC(2026, 11, 9, 0, 0, 0) },  // Dec 8, 7:00 PM EST
  { label: "Championship tips off",      utc: Date.UTC(2026, 11, 12, 1, 0, 0) }, // Dec 11, 8:00 PM EST
];

// Calendar dates (ET) on which balldontlie scores should be labeled as Cup games.
const CUP_GAME_DATES = new Set([
  "2026-10-30", "2026-11-06", "2026-11-13", "2026-11-20", "2026-11-24",
  "2026-11-25", "2026-11-27", "2026-12-04", "2026-12-05", "2026-12-08",
  "2026-12-09", "2026-12-11",
]);

const bannerEl = document.getElementById("countdown-banner");
const labelEl = document.getElementById("countdown-label");
const subEl = document.getElementById("countdown-sub");
const daysEl = document.getElementById("cd-days");
const hoursEl = document.getElementById("cd-hours");
const minsEl = document.getElementById("cd-mins");
const secsEl = document.getElementById("cd-secs");

const ET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
// en-CA gives an ISO-shaped YYYY-MM-DD string, which is what balldontlie expects.
const ET_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function pad(n) {
  return String(n).padStart(2, "0");
}

function todayET() {
  return ET_DATE_FORMATTER.format(new Date());
}

function updateCountdown() {
  const now = Date.now();
  const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;
  const liveEvent = CUP_EVENTS.find((e) => now >= e.utc && now < e.utc + LIVE_WINDOW_MS);

  if (liveEvent) {
    bannerEl.classList.add("live");
    labelEl.textContent = `🔴 ${liveEvent.label.replace("tips off", "is live").replace("begin", "underway")}`;
    daysEl.textContent = "--";
    hoursEl.textContent = "--";
    minsEl.textContent = "--";
    secsEl.textContent = "--";
    subEl.textContent = "See live scores below";
    return;
  }
  bannerEl.classList.remove("live");

  const next = CUP_EVENTS.find((e) => e.utc > now);
  if (!next) {
    labelEl.textContent = "🏆 The 2026 NBA Cup has concluded";
    daysEl.textContent = "--";
    hoursEl.textContent = "--";
    minsEl.textContent = "--";
    secsEl.textContent = "--";
    subEl.textContent = "See you next season";
    return;
  }

  const diff = next.utc - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  labelEl.textContent = `⏱ Countdown to: ${next.label}`;
  daysEl.textContent = days;
  hoursEl.textContent = pad(hours);
  minsEl.textContent = pad(mins);
  secsEl.textContent = pad(secs);
  subEl.textContent = `${ET_FORMATTER.format(new Date(next.utc))} ET`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================================
// Scores by date — balldontlie.io
// ============================================================
const scoresTitleEl = document.getElementById("scores-title");
const scoresBodyEl = document.getElementById("scores-body");
const refreshBtn = document.getElementById("refresh-btn");
const dateInputEl = document.getElementById("score-date");
const fetchBtn = document.getElementById("fetch-btn");

refreshBtn.addEventListener("click", () => loadScores(dateInputEl.value));
fetchBtn.addEventListener("click", () => loadScores(dateInputEl.value));
dateInputEl.addEventListener("change", () => loadScores(dateInputEl.value));

function teamLabel(team) {
  return `${team.city ? team.city + " " : ""}${team.name || team.full_name || team.abbreviation}`.trim();
}

function renderGameStatus(game) {
  // balldontlie's `status` field is already human-readable: a scheduled
  // clock time for games that haven't started, "1st Qtr" / "2nd Qtr" / etc.
  // for live games, or "Final" once it's over.
  const status = (game.status || "").trim();
  if (/final/i.test(status)) return { text: "Final", cls: "final" };

  const looksLive = /qtr|quarter|half|ot\b/i.test(status);
  if (looksLive) {
    const clock = game.time && !status.includes(game.time) ? ` — ${game.time}` : "";
    return { text: `${status}${clock}`, cls: "" };
  }

  // Anything else (e.g. "7:00 PM ET") is a scheduled, not-yet-started game.
  return { text: status || "Scheduled", cls: "scheduled" };
}

function renderGames(games) {
  scoresBodyEl.textContent = "";
  games.forEach((game) => {
    const card = document.createElement("div");
    card.className = "game-card";

    const home = game.home_team;
    const away = game.visitor_team;
    const homeScore = game.home_team_score ?? 0;
    const awayScore = game.visitor_team_score ?? 0;
    const isFinal = /final/i.test(game.status || "");

    const row1 = document.createElement("div");
    row1.className = "game-row";
    const awayName = document.createElement("span");
    awayName.className = "game-team" + (isFinal && awayScore > homeScore ? " winner" : "");
    awayName.textContent = teamLabel(away);
    const awayScoreEl = document.createElement("span");
    awayScoreEl.className = "game-score";
    awayScoreEl.textContent = awayScore;
    row1.appendChild(awayName);
    row1.appendChild(awayScoreEl);

    const row2 = document.createElement("div");
    row2.className = "game-row";
    const homeName = document.createElement("span");
    homeName.className = "game-team" + (isFinal && homeScore > awayScore ? " winner" : "");
    homeName.textContent = teamLabel(home);
    const homeScoreEl = document.createElement("span");
    homeScoreEl.className = "game-score";
    homeScoreEl.textContent = homeScore;
    row2.appendChild(homeName);
    row2.appendChild(homeScoreEl);

    const statusInfo = renderGameStatus(game);
    const statusEl = document.createElement("div");
    statusEl.className = "game-status " + statusInfo.cls;
    statusEl.textContent = statusInfo.text;

    card.appendChild(row1);
    card.appendChild(row2);
    card.appendChild(statusEl);
    scoresBodyEl.appendChild(card);
  });
}

function showScoresMessage(text) {
  scoresBodyEl.textContent = "";
  const p = document.createElement("p");
  p.className = "scores-msg";
  p.textContent = text;
  scoresBodyEl.appendChild(p);
}

function fetchGames(dateStr) {
  const url = `https://api.balldontlie.io/nba/v1/games?dates[]=${dateStr}&per_page=100`;
  return fetch(url, { headers: { Authorization: BALLDONTLIE_API_KEY } }).then((res) => {
    if (!res.ok) {
      const err = new Error("request_failed");
      err.status = res.status;
      throw err;
    }
    return res.json();
  }).then((json) => json.data || []);
}

function formatPickedDate(dateStr) {
  // Display the picked calendar date without any timezone shifting.
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dt);
}

async function loadScores(dateStr) {
  if (!dateStr) return;

  const isCupNight = CUP_GAME_DATES.has(dateStr);
  const niceDate = formatPickedDate(dateStr);
  scoresTitleEl.textContent = isCupNight
    ? `Cup Scores — ${niceDate}`
    : `NBA Scores — ${niceDate}`;

  if (!BALLDONTLIE_API_KEY || BALLDONTLIE_API_KEY === "PASTE_YOUR_BALLDONTLIE_API_KEY_HERE") {
    showScoresMessage("No API key set. Add your key in config.js to enable scores.");
    return;
  }

  showScoresMessage("Loading…");
  try {
    const games = await fetchGames(dateStr);
    if (games.length === 0) {
      showScoresMessage("No games found for that date.");
      return;
    }
    renderGames(games);
  } catch (err) {
    if (err.status === 401) {
      showScoresMessage("That API key was rejected — check the key in config.js.");
    } else {
      showScoresMessage("Couldn't load scores right now. Try again in a moment.");
    }
  }
}

// Default the date picker to today (America/New_York) and load it.
dateInputEl.value = todayET();
loadScores(dateInputEl.value);

// ============================================================
// Tab switching
// ============================================================
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".panel");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
  });
});

// ============================================================
// Teams search
// ============================================================
const TEAMS = [
  { name: "Detroit Pistons", group: "East A" },
  { name: "Toronto Raptors", group: "East A" },
  { name: "Orlando Magic", group: "East A" },
  { name: "Milwaukee Bucks", group: "East A" },
  { name: "Brooklyn Nets", group: "East A" },

  { name: "New York Knicks", group: "East B" },
  { name: "Cleveland Cavaliers", group: "East B" },
  { name: "Philadelphia 76ers", group: "East B" },
  { name: "Miami Heat", group: "East B" },
  { name: "Indiana Pacers", group: "East B" },

  { name: "Boston Celtics", group: "East C" },
  { name: "Atlanta Hawks", group: "East C" },
  { name: "Charlotte Hornets", group: "East C" },
  { name: "Chicago Bulls", group: "East C" },
  { name: "Washington Wizards", group: "East C" },

  { name: "Denver Nuggets", group: "West A" },
  { name: "Houston Rockets", group: "West A" },
  { name: "Phoenix Suns", group: "West A" },
  { name: "Dallas Mavericks", group: "West A" },
  { name: "Utah Jazz", group: "West A" },

  { name: "Oklahoma City Thunder", group: "West B" },
  { name: "Minnesota Timberwolves", group: "West B" },
  { name: "LA Clippers", group: "West B" },
  { name: "New Orleans Pelicans", group: "West B" },
  { name: "Memphis Grizzlies", group: "West B" },

  { name: "San Antonio Spurs", group: "West C" },
  { name: "Los Angeles Lakers", group: "West C" },
  { name: "Portland Trail Blazers", group: "West C" },
  { name: "Golden State Warriors", group: "West C" },
  { name: "Sacramento Kings", group: "West C" },
].sort((a, b) => a.name.localeCompare(b.name));

const teamIndexEl = document.getElementById("team-index");
const searchEl = document.getElementById("team-search");

function renderTeams(filter = "") {
  const q = filter.trim().toLowerCase();
  const matches = TEAMS.filter((t) => t.name.toLowerCase().includes(q));

  teamIndexEl.textContent = "";
  if (matches.length === 0) {
    const li = document.createElement("li");
    li.className = "no-match";
    li.textContent = "No teams match that search.";
    teamIndexEl.appendChild(li);
    return;
  }

  matches.forEach((t) => {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.className = "team-name";
    name.textContent = t.name;
    const group = document.createElement("span");
    group.className = "team-group";
    group.textContent = t.group;
    li.appendChild(name);
    li.appendChild(group);
    teamIndexEl.appendChild(li);
  });
}

renderTeams();
searchEl.addEventListener("input", (e) => renderTeams(e.target.value));
