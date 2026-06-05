# Personal Dashboard — Project Memory

> Geheugen-document. Lees dit eerst als je verder gaat met dit project.

## Wat is dit?

Persoonlijk PWA-dashboard voor één gebruiker (Soef — taxichauffeur, Nederlandstalig, moslim).
Live op: **https://sofyanghaddari.github.io/dashboard/**
GitHub: **https://github.com/sofyanghaddari/dashboard**
Lokaal: `/Users/soef/claude code`

## Stack

- Vanilla HTML/CSS/JavaScript (ES modules), geen build
- IndexedDB voor data, localStorage voor settings
- Service worker voor offline + caching
- Web App Manifest voor installeerbaarheid
- Open-Meteo voor weer (geen API key)
- GitHub Gist API voor optionele auto-sync (gebruiker plakt PAT)

## Workflow

- Code wijzigingen lokaal in `/Users/soef/claude code`
- Commits via `git commit`
- Push naar `origin/main` — GitHub Pages bouwt binnen 1-2 min
- gh CLI staat in `~/bin/gh`, auth al ingesteld

## Modules (7 tabs)

1. **🏠 Dashboard** — overzicht: mascot+quote, weer-radar (Schiphol-pieken), vandaag-inkomen+doel, koran-streak, kaarten te leren, taxi-spaardoelen, top todo's
2. **🚖 Taxi** — vereenvoudigd: 1 knop "+ Inkomen vandaag noteren", week/maand totalen, shift-tracker met live timer + €/uur, stats (beste dag), maand-grafiek, CSV-export
3. **📖 Koran** — dagelijkse hizb afvinken, streak, 30-dagen grid, reminder-instellingen
4. **📚 Arabisch** — SRS (SM-2 lite) met 4 knoppen, CSV-import (Anki tab/comma), sessies
5. **🎯 Doelen** — lange/korte termijn met taxi-koppeling (% per rit), gewoontes met chains (na X doe Y) + 14-dagen-strip, spaarpotjes (Bunq-style)
6. **✅ To-do** — prioriteit/medium/waiting, smart filters (vandaag/week), tags, subtaken, herhalend, bulk-modus, undo, mark-for-later, quick-NL-input ("morgen 10:00 APK")
7. **📝 Notities** — notities + ideeën sub-tabs, lichte markdown

## Globale features

- ⚙️ **Settings** floating top-right: thema (dark/light/auto), accent (5 kleuren), 8 sferen, dagdoel, PIN-lock, GitHub-sync, iCal-export, badges, lokale backup, print
- 🔍 **⌘K zoek** + zoek-knop top-right — doorzoekt alles
- 🍅 **Pomodoro** floating bottom-left
- 🎊 **Confetti + motivatie-popups** bij taken: 14 Nederlandse savage messages ("🪖 Strijder, op naar de volgende!")
- 🏆 **Achievement badges** (12 stuks)
- 🤬 **Streak shame** — 8 savage messages bij gebroken hizb-streak
- 🦁 **Mascot** reageert op je dag (🦁🔥/🦁/😌/🤨/💀)
- 📜 **Quote of the day** in hero
- 📅 **Kalender-view** modal
- 📊 **Jaaroverzicht** modal
- 🌤️ **Weer-radar** met Schiphol-piek-detectie + link naar live Schiphol-aankomsten
- 📡 Offline-banner, pull-to-refresh, swipe-delete, toast-notificaties
- 🖼️ **8 thema's** (alleen nog professioneel): midnight, slate, navy, bronze, marble, mosque, charcoal, sand
- ✨ **Animaties**: card stagger-entrance, money glow pulse, bar-rise, progress-fill, ripple buttons, mascot bounce, toast bounce, gold-dust (marble/mosque)

## File structuur

```
index.html
manifest.json
service-worker.js (bump CACHE versie bij wijzigingen)
css/styles.css
js/
  app.js            — bootstrap + wiring
  router.js         — tab navigation + staggerIn na render
  db.js             — IndexedDB wrapper (DB_VERSION=3)
  utils.js          — uid/fmtMoney/ymd/startOfWeek etc
  settings.js       — localStorage helpers
  theme.js          — dark/light/auto + accent + preset
  achievements.js   — badge berekening
  activity.js       — silent activity log
  animate.js        — countUp, staggerIn, bindRipple
  weather.js        — open-meteo + Schiphol-piek-heuristiek
  mascot.js         — reactieve mascot + shame messages
  quotes.js         — quote of the day
  nlp.js            — Nederlandse natural-language parser voor todo
  voice.js          — Web Speech voor voice-input
  srs.js            — SM-2 lite algoritme
  lock.js           — PIN-lock met SHA-256
  github-sync.js    — Gist-based auto-backup
  export-ical.js    — iCal generator
  modules/
    dashboard.js    — home view (geen tax-reserve meer)
    taxi.js         — VEREENVOUDIGD: 1 inkomen-knop, geen source/uitgaven
    koran.js
    arabic.js
    goals.js        — doelen + habits + pots
    todo.js
    notes.js
  components/
    modal.js        — basis modal (heeft × close button)
    settings.js     — ⚙️ modal (heeft × close)
    toast.js        — ok/err/info popup
    celebrate.js    — confetti + popups
    swipe.js
    pullrefresh.js
    cmdk.js         — ⌘K search palette
    undo.js
    pomodoro.js     — floating timer
    calendar.js     — maandkalender modal (heeft × close)
    year-review.js  — jaaroverzicht modal (heeft × close)
icons/
docs/superpowers/
  specs/2026-06-04-personal-dashboard-design.md
  plans/2026-06-04-personal-dashboard.md
```

## IndexedDB stores (v3)

- `rides`: { id, date (ISO), amount, source?, km?, note? } — nu vooral 1 entry/dag met source='daily'
- `expenses`: { id, date, amount, category, note? } — store blijft bestaan, UI verwijderd
- `hizb_log`: { date (YYYY-MM-DD), completed }
- `cards`: { id, front, back, note, interval, ease, repetitions, dueDate, createdAt }
- `goals`: { id, title, description, term, deadline, progress, target?, taxiPercent? }
- `todos`: { id, title, note, priority, done, dueDate?, recurring?, tags[], subtasks[], savedForLater, createdAt, completedAt? }
- `shifts`: { id, startTime, endTime?|null }
- `notes`: { id, title, body, isIdea, createdAt, updatedAt }
- `habits`: { id, name, emoji, after?(habitId for chain), createdAt }
- `habit_log`: { id (date+habitId), date, habitId, done }
- `pots`: { id, name, emoji, target, current, createdAt }

## LocalStorage keys

- `theme` (legacy, ongebruikt)
- `themeMode`: dark|light|auto
- `accentColor`: gold|blue|green|purple|red
- `themePreset`: midnight|slate|navy|bronze|marble|mosque|charcoal|sand
- `dailyIncomeGoal`: number
- `hizbReminderTime`: HH:MM
- `hizbStartPoint`: string
- `userLocation`: { lat, lon }
- `weatherCache`: { ts, data }
- `ghToken`, `ghGistId`, `lastGhSync`
- `pinHash` (SHA-256 hex)
- `earnedBadges` (JSON array)
- `lastGoalHitDate`, `lastAllDoneCelebrate`, `streakCelebrated-7|30|100`
- `activityLog` (JSON array, max 200)

## Belangrijke conventies

- UI strings in **Nederlands**
- Money via `fmtMoney()` met goud-kleur (.money class)
- Modals hebben rechtsboven een ×-knop (`.modal-close`)
- Service worker CACHE versie bumpen bij elke wijziging van static assets
- Bij nieuwe IndexedDB store: bump `DB_VERSION` én voeg toe aan `STORES` lijsten in `db.js`, `github-sync.js`, `components/settings.js`

## Recente beslissingen (chronologisch)

1. PWA + IndexedDB, geen backend
2. Mobiel-first, dark default
3. Uitgebreid met: shifts, belasting-reserve, spaardoelen, backup, dagdoel, stats — daarna **belasting-reserve weer weg op gebruikers-verzoek**
4. Gebruiker liet 32 features in één keer goedkeuren → opgedeeld in waves
5. Visuele themes eerst flashy (aurora/cyber/galaxy/velvet/sunset) → gebruiker vond ze **niet professioneel** → vervangen door slate/navy/bronze/charcoal/sand (behoud marble/mosque)
6. Taxi vereenvoudigd: weg met +nieuwe-rit, +nieuwe-uitgave, source-breakdown, belasting-display — enkel **dagelijks inkomen noteren**
7. Modals krijgen × rechtsboven (was alleen Annuleren-knop onderaan)

## Wat NIET gebouwd (en waarom)

- **AI-chat met data** — vereist Claude API key + kost geld, niet gebouwd
- **OCR bonnetjes** — zelfde, vereist Vision API
- **Open banking** — PSD2 bureaucratie, te zwaar
- **Multi-device QR-sync** — peer-to-peer of GitHub middleman, complex; GitHub-Gist sync biedt al cross-device
- **App-icon badge** — PWA op iOS ondersteunt dit niet betrouwbaar

## Hoe verder

- Bij nieuwe features: check welke store/UI raakt, bump DB_VERSION als nodig, bump service-worker CACHE
- Test in browser via `python3 -m http.server 8000` of gewoon GitHub Pages
- Push naar main → auto-deploy
