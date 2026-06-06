# Sofyan's First App — Project Memory

> Geheugen-document. Lees dit eerst als je verder gaat met dit project.

## Wat is dit?

Persoonlijk PWA-dashboard voor één gebruiker (Soef — taxichauffeur in Amsterdam, Nederlandstalig, moslim).
Live op: **https://sofyanghaddari.github.io/dashboard/**
GitHub: **https://github.com/sofyanghaddari/dashboard**
Lokaal: `/Users/soef/claude code`

## Stack

- Vanilla HTML/CSS/JavaScript (ES modules), geen build
- IndexedDB voor data (DB_VERSION=3), localStorage voor settings
- Service worker voor offline + caching (CACHE versie bumpen bij wijzigingen, huidig: v24)
- Web App Manifest met shortcuts voor installeerbaarheid
- Open-Meteo voor weer (geen API key, default Amsterdam centrum 52.3676, 4.9041)
- GitHub Gist API voor encrypted auto-sync met versie-historie
- Web Crypto API voor AES-GCM versleuteling (PBKDF2 200k iter)
- WebAuthn voor Face ID/Touch ID
- Web Speech API voor voice-input
- Vibration API voor haptic feedback
- Web Share API, Notification API, Storage API

## Workflow

- Code wijzigingen lokaal in `/Users/soef/claude code`
- Commits via `git commit`
- Push naar `origin/main` — GitHub Pages bouwt binnen 1-2 min
- gh CLI staat in `~/bin/gh`, auth al ingesteld (user: sofyanghaddari)
- Bij elke commit van static assets: bump `CACHE` versie in `service-worker.js`

## Modules (7 tabs)

1. **🏠 Dashboard** — hero (mascot + shame), weer-radar Amsterdam (spitsuren ipv Schiphol), kalender+jaaroverzicht knoppen, voice-knop, vandaag/maand-stats, goal-trajectory SVG, doel-haalbaarheid kaart, patroon-insights, 30-dagen heatmap, koran/arabic/spaardoelen kaarten, top-prioriteit-taken, empty CTA bij lege data
2. **🚖 Taxi** — vereenvoudigd: alleen "+ Inkomen vandaag noteren" + maandkalender-grid waarop je per dag retroactief inkomen invult (klik dag → modal met items + add), CSV-export, jaarverloop bar-chart. **Geen** shift-tracker, source-breakdown, uitgaven of belasting-reserve meer
3. **📖 Koran** — dagelijkse hizb afvinken + streak + 30-dagen grid + streak-repair (1× per maand gemiste dag goedmaken) + reminder-instellingen
4. **📚 Arabisch** — SRS (SM-2 lite) met 4 knoppen, CSV-import (Anki tab/comma), sessies, kaarten-overzicht met search
5. **🎯 Doelen** — lange/korte termijn met taxi-koppeling (% per rit + streefbedrag), gewoontes met chains + 14-dagen-strip, spaarpotjes (Bunq-style met current/target)
6. **✅ To-do** — prioriteit/medium/waiting, smart filters (vandaag/week), tags, subtaken, herhalend, bulk-modus, undo, mark-for-later, quick-NL-input ("morgen 10:00 APK")
7. **📝 Notities** — notities + ideeën sub-tabs, lichte markdown

## Globale features

### UI & Toegang
- ⚙️ **Settings** floating top-right (met safe-area-inset-top voor Dynamic Island clearance)
- 🔍 **⌘K + zoek-knop** top-right, doorzoekt alles
- ☁️ **Sync-pill** top-center: toont "Synced 2m geleden" + tap voor handmatige sync
- 📡 **Offline-banner** bovenin (met safe-area)
- 👤 **Splash-screen** met goud "✦ Dashboard" bij openen (geen FOUC)

### Visueel
- ✦ **12 thema-presets** (alleen neutraal/professioneel):
  - **Donker:** onyx, graphite, midnight, slate, sterling, sage, espresso, ash, marble, mosque
  - **Licht:** linen, pearl, paper, ivory, stone, cloud
- 🎨 **5 accent-kleuren:** gold, blue, green, purple, red
- ⚪ **Density toggle:** Ruim / Compact
- 🔠 **Apple-vibe typografie:** serif (Georgia) voor money/big-money, uppercase card-titles met letterspacing
- 🧊 **Frosted-glass tabbar** (saturate-blur)
- 🎬 **Animaties:** card stagger-entrance, money glow pulse, bar-rise, progress-fill, ripple buttons, mascot bounce, toast bounce, gold-dust (marble/mosque), Dynamic Island pill

### Slim
- 🦁 **Mascot** reageert (🦁🔥 / 🦁 / 😌 / 🤨 / 💀) — eigen emoji instelbaar
- 🤬 **Streak shame** — 15 keiharde Nederlandse berichten (geen verzen meer in hero) — eigen lijst instelbaar
- 🎊 **Confetti + 14 taak-vieringen** ("Strijder, op naar de volgende!" etc)
- 🏆 **12 badges** (eerste rit, 10/50/100/500 ritten, streak 7/30/100, 50/200 kaarten, doel behaald, 10 diensten)
- 🔮 **Goal-trajectory SVG-grafiek** + haalbaarheid-kaart (op koers/tekort)
- 🔍 **Patroon-insights** automatisch (Op vrijdag +40%, Vergeet hizb meestal op donderdag, etc)
- 📊 **30-dagen heatmap** Dashboard, jaarverloop bar-chart Taxi, kalender-modal, jaaroverzicht modal
- 📅 **Week-overzicht** automatisch zondagavond

### Apple/iOS-tech
- 🟢 **iOS toggle-switches** (groene pills ipv checkboxes)
- 💊 **Dynamic Island-stijl** pill bovenin voor status
- 👆 **Haptic feedback** automatisch op tap (Vibration API)
- ⬅️ **Swipe-back gesture** vanaf linkerrand
- 📋 **Long-press menu** infrastructuur
- 🎛️ **Segmented control** CSS class

### Data & Backup
- 🔒 **Face ID / Touch ID** via WebAuthn (PIN als fallback)
- ⏱️ **Lock-grace-period** instelbaar (1m/5m/15m/1u/24u) — niet opnieuw vragen binnen window
- 🔐 **Encrypted GitHub backup** (AES-GCM + PBKDF2)
- 🗃️ **30 versies historie** automatisch in elke gist
- 🪞 **Multi-gist mirror** ondersteuning
- 🔍 **"Vind mijn dashboard-gists"** — lijst van gebruikers-gists om makkelijk te wisselen
- 🔄 **Real-time sync:** auto-push 8s na elke wijziging, push op tab-hide, pull op tab-show, auto-merge bij openen
- 📋 **Kopieer gist-ID knop** voor email-backup
- ✉️ **Email backup-links** knop (mailto met gist-ID's voorgevuld)
- 💾 **Lokale JSON export/import + Auto-export wekelijks**
- 🖨️ **PDF maand-export** voor administratie/boekhouder + Auto-PDF maandelijks
- 📅 **iCal export** voor Apple/Google Agenda
- 📊 **Storage-info** in ⚙️ + auto-persist op boot

### Andere
- 🎙️ **Voice-input** op Dashboard én Taxi voor inkomen
- ⚡ **NL Natural-language** quick-add op Todo ("morgen 10:00 APK", "elke maandag tanken")
- 📛 **App-icon badge** (navigator.setAppBadge)
- 🚀 **App-shortcuts in manifest** voor lang-druk op homescreen-icoon
- 📱 **iOS PWA meta-tags** (apple-mobile-web-app-capable, status-bar, splash)
- 👋 **Empty-state CTA** bij lege dashboard
- 📂 **Versie-picker** voor restore van specifieke gist-snapshot

## File structuur

```
index.html                       — html shell + splash + offline-banner
manifest.json                    — PWA manifest + shortcuts
service-worker.js                — bump CACHE bij wijzigingen
CLAUDE.md                        — dit bestand
css/styles.css                   — alle CSS, inclusief preset-themes
js/
  app.js                         — bootstrap + wiring
  router.js                      — tab navigation + staggerIn na render
  db.js                          — IndexedDB wrapper (DB_VERSION=3) met _updatedAt injection + onWrite callback
  utils.js                       — uid/fmtMoney/ymd/startOfWeek etc
  settings.js                    — localStorage helpers met defaults
  theme.js                       — dark/light/auto + accent + preset + density
  achievements.js                — 12 badges berekening
  activity.js                    — silent activity log (max 200)
  animate.js                     — countUp, staggerIn, bindRipple
  weather.js                     — open-meteo + Amsterdam spitsuur-heuristiek
  mascot.js                      — reactieve mascot + 15 shame messages + customisatie
  quotes.js                      — quote of the day (niet meer getoond in hero)
  nlp.js                         — NL natural-language parser voor todo
  voice.js                       — Web Speech voor voice-input
  srs.js                         — SM-2 lite algoritme
  lock.js                        — PIN/Face ID lock + grace-period
  biometric.js                   — WebAuthn platform authenticator
  github-sync.js                 — multi-gist sync + merge + versie-historie + find-my-gists
  auto-realtime-sync.js          — push 8s na write + push/pull op visibility
  auto-export.js                 — wekelijkse JSON auto-download
  export-ical.js                 — iCal generator
  pdf-export.js                  — PDF maandoverzicht print-venster
  insights.js                    — patroon-detectie + goal-feasibility + trajectory SVG path
  crypto.js                      — AES-GCM + PBKDF2
  haptic.js                      — vibration + autoHaptic op alle .btn/.tab clicks
  gestures.js                    — swipe-back van links
  longpress.js                   — long-press helper + context menu
  app-badge.js                   — navigator.setAppBadge
  modules/
    dashboard.js                 — home view, hero, weer, alles aggregatie
    taxi.js                      — alleen inkomen-kalender, geen shift
    koran.js                     — hizb afvinken + streak-repair
    arabic.js                    — SRS
    goals.js                     — doelen + habits chains + spaarpotjes
    todo.js                      — taken met smart filters
    notes.js                     — notes + ideas
  components/
    modal.js                     — basis modal met × close button
    settings.js                  — ⚙️ modal (groot, alle settings)
    toast.js                     — ok/err/info popup
    celebrate.js                 — confetti + popups
    swipe.js                     — swipe-to-delete on list items
    pullrefresh.js               — pull-to-refresh
    cmdk.js                      — ⌘K search palette
    undo.js                      — undo toast
    calendar.js                  — maandkalender modal
    year-review.js               — jaaroverzicht modal
    weekly-review.js             — zondagavond auto-popup
    sync-pill.js                 — top-center sync status
    island.js                    — Dynamic Island-style pills
icons/                           — placeholder PNGs
docs/superpowers/
  specs/2026-06-04-personal-dashboard-design.md
  plans/2026-06-04-personal-dashboard.md
```

## IndexedDB stores (v3)

Elke schrijfactie krijgt automatisch `_updatedAt: Date.now()` voor merge-resolution.

- `rides`: { id, date (ISO), amount, source ('daily'), km?, note? }
- `expenses`: { id, date, amount, category, note? } — UI verborgen
- `hizb_log`: { date (YYYY-MM-DD), completed, repaired? }
- `cards`: { id, front, back, note, interval, ease, repetitions, dueDate, createdAt }
- `goals`: { id, title, description, term, deadline, progress, target?, taxiPercent? }
- `todos`: { id, title, note, priority, done, dueDate?, recurring?, tags[], subtasks[], savedForLater, createdAt, completedAt? }
- `shifts`: { id, startTime, endTime?|null } — UI verwijderd maar store blijft voor data
- `notes`: { id, title, body, isIdea, createdAt, updatedAt }
- `habits`: { id, name, emoji, after?(habitId for chain), createdAt }
- `habit_log`: { id (date+habitId), date, habitId, done }
- `pots`: { id, name, emoji, target, current, createdAt }

## LocalStorage keys

**Defaults gedefinieerd in `js/settings.js`:**
- `themeMode`: dark|light|auto (default dark)
- `accentColor`: gold (default)
- `themePreset`: midnight (default), kan elk van 12 presets zijn
- `density`: comfortable|compact (default comfortable)
- `dailyIncomeGoal`: '200'
- `monthlyIncomeGoal`: '5000'
- `taxReservePercent`: '25' (ongebruikt in UI maar in defaults)
- `lockGraceMin`: '5'
- `hizbReminderTime`: '20:00'
- `hizbStartPoint`: 'Surah Al-Fath, 10 hizb'

**Auto-set tijdens gebruik:**
- `userLocation`: { lat, lon } (default Amsterdam als geen permissie)
- `weatherCache`: { ts, data } (30 min TTL)
- `ghToken`, `ghGistId`, `ghGistIds[]`, `lastGhSync`
- `pinHash` (SHA-256 hex)
- `bioCredId` (WebAuthn credential ID, base64)
- `lastUnlock` (grace-period timestamp)
- `earnedBadges` (JSON array)
- `lastGoalHitDate`, `lastAllDoneCelebrate`, `streakCelebrated-7|30|100`
- `lastWeeklyReview`, `lastAutoExport`, `lastAutoPdf`, `lastStreakRepair`
- `activityLog` (JSON array, max 200)
- `customShame[]`, `customMascot`
- `autoExport`, `autoPdf`, `autoPullOnOpen` (toggles '0'/'1')

**SessionStorage:**
- `ghEncPwd` (versleuteling-wachtwoord, niet persistent)

## Belangrijke conventies

- UI strings in **Nederlands**
- Money via `fmtMoney()` met goud-kleur (.money class) + serif font (Georgia)
- Modals hebben rechtsboven een ×-knop (`.modal-close`)
- Card-titles `.card-title` class (uppercase, small, letterspacing)
- Service worker CACHE versie bumpen bij elke wijziging van static assets
- Bij nieuwe IndexedDB store: bump `DB_VERSION` én voeg toe aan STORES lijsten in `db.js`, `github-sync.js`, `components/settings.js`
- `safe-area-inset-top` (--safe-top) voor alle floating top elementen
- `_updatedAt` automatisch via `db.js put()` — niet handmatig zetten
- Bij `onWrite` event auto-push naar GitHub na 8s debounce

## Sync gedrag

- **Auto-push:** elke schrijf → 8s debounce → push naar alle ingestelde gists
- **Push op tab-hide:** visibilitychange hidden → meteen push (geen debounce)
- **Pull op tab-show:** visibilitychange visible + autoPullOnOpen=1 → syncMerge
- **Auto-merge bij openen:** als toggle aan → eerst remote pullen + mergen, dan boot
- **Manual sync via pill:** tap op ☁️-pill = syncMerge + syncUp
- **Merge logic:** universal `_updatedAt` first, dan per-store fallback (cards: repetitions hoger wint, goals: progress hoger wint, pots: current hoger wint, todos: done wint van niet-done)

## Recente beslissingen (chronologisch, meest recent boven)

1. **Real-time sync gefixt:** _updatedAt op elke schrijfactie, auto-push 8s debounce, push op visibility hidden, pull op visible — eindelijk écht synchroon tussen Safari en PWA
2. **Find-my-gists fix:** als gebruiker per ongeluk 2x setup deed kunnen ze nu de juiste gist kiezen
3. **Safe-area-inset-top fix:** floating buttons (⚙️ 🔍 ☁️) onder Dynamic Island
4. **Gist-ID kopieer-knop** + volledige ID zichtbaar
5. **Backup veiligheid:** 30 versies historie, multi-gist mirror, email-backup-link, versie-picker met restore
6. **Sync-pill + auto-merge + smart-merge toggle**
7. **Lock-grace-period:** PIN/Face ID 1m/5m/15m/1u/24u niet opnieuw vragen
8. **Face ID via WebAuthn** met PIN als fallback
9. **Themes redesign 3x:** flashy → professional → soft Apple-vibe → 12 neutrale presets
10. **Streak shame keihard** + verzen weg uit hero
11. **Dashboard upgrades:** monthly goal, trend %, projectie, voice button, heatmap, goal-trajectory SVG, insights, doel-haalbaarheid
12. **Taxi vereenvoudigd:** alleen inkomen-kalender, geen shift/source/uitgaven/belasting meer
13. **Weer Amsterdam ipv Schiphol** (default lat/lon + spitsuur-heuristiek)
14. **Pomodoro & Shift-tracker volledig verwijderd**
15. **iOS-tech wave:** toggles, Dynamic Island, swipe-back, haptic, long-press, segmented
16. **Personalisatie:** custom mascot emoji + eigen shame-berichten
17. **Streak repair** 1x/maand op Koran
18. **Auto-PDF maandelijks** + Auto-export wekelijks toggles
19. **App badge + iOS splash meta + app shortcuts in manifest**
20. **Encrypted GitHub backup** via AES-GCM
21. **Modals krijgen × rechtsboven** (was alleen Annuleren-knop onderaan)
22. **Eerste Apple-vibe overhaul:** flat buttons, serif money, uppercase card-titles, frosted glass
23. **Density toggle Ruim/Compact**

## Wat NIET gebouwd (en waarom)

- **AI-chat met data** — vereist Claude API key + kost geld
- **OCR bonnetjes** — Vision API kost
- **Open banking** — PSD2 bureaucratie
- **Multi-device QR-sync** — GitHub-Gist sync biedt al cross-device
- **Pomodoro** — user wilde 'm uiteindelijk niet
- **Shift-tracker** — user wilde 'm uiteindelijk niet
- **Belasting-reservering** — user wilde 'm uiteindelijk niet
- **Uitgaven UI** — user wilde alleen inkomen noteren
- **Source-breakdown (Uber/Bolt/WhatsApp)** — user wilde simpeler

## User context

- **Soef Ghaddari** — taxi in Amsterdam
- Rijdt voor Uber/Bolt/WhatsApp (oorspronkelijk per-rit getrackt, nu alleen dagelijks totaal)
- Moslim, dagelijkse hizb herhaling, kent 10 hizb tot Surah Al-Fath
- Wil Arabisch leren via Anki-bulk-import van eigen kaarten
- Bijna uitsluitend mobiel gebruiker (iPhone met Dynamic Island)
- GitHub gebruikersnaam: `sofyanghaddari`
- Voorkeur: PWA op homescreen als primair, Safari als backup-view
- Email-tip: éénmalig zichzelf de gist-ID mailen als noodgeval-backup

## Hoe verder gaan

Bij nieuwe sessie:
1. **Lees deze CLAUDE.md eerst**
2. Check `git log --oneline -20` voor recente commits
3. Voor nieuwe features: check welke store/UI raakt, bump DB_VERSION als nodig, bump service-worker CACHE
4. Test in browser via `python3 -m http.server 8000` of gewoon GitHub Pages
5. Push naar main → auto-deploy
6. Werk altijd in Nederlands tegen de user
7. Respecteer dat user géén shift-tracker, pomodoro, uitgaven of belasting-features wil terug

## Veelvoorkomende user-vragen

- "Worden gegevens automatisch opgeslagen?" → Ja, direct in IndexedDB + binnen 8s naar GitHub
- "Mijn site en PWA syncen niet" → 99% kans twee verschillende gists: gebruik 🔍 Vind mijn gists
- "Wat moet ik bewaren?" → Eénmalig je gist-ID emailen naar jezelf, that's it
- "Werkt het offline?" → Ja, volledig — installeer eerst op homescreen
- "Hoe regel ik backup?" → ⚙️ → GitHub-token → klaar

## Live preview server

Voor lokaal testen: `python3 -m http.server 8000` in project root.
