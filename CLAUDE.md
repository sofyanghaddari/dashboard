# Sofyan's First App — Project Memory

> Geheugen-document. Lees dit eerst als je verder gaat met dit project.

## Wat is dit?

Persoonlijk PWA-dashboard voor één gebruiker (Soef — taxichauffeur in Amsterdam, Nederlandstalig, moslim).
Live op: **https://sofyanghaddari.github.io/dashboard/**
GitHub: **https://github.com/sofyanghaddari/dashboard**
Lokaal: `/Users/soef/claude code`

## Stack

- Vanilla HTML/CSS/JavaScript (ES modules), geen build
- IndexedDB voor data (DB_VERSION=8), localStorage voor settings
- Service worker voor offline + caching (CACHE versie bumpen bij wijzigingen, huidig: **v166** — bump óók `APP_VERSION` in `js/components/settings.js`)
- pdf.js (CDN) wordt **lazy** geladen, alléén bij PDF-import in Arabisch (`loadPdfJs()` in `js/modules/arabic.js`) — niet meer in index.html
- jsPDF (CDN) wordt **lazy** geladen door `js/modules/boekhouding.js` voor factuur-PDF generatie
- Tesseract.js v5 (CDN) wordt **lazy** geladen door `js/receipt-ocr.js` voor bonnetje-OCR — worker hergebruikt
- Google Identity Services (GSI) wordt **lazy** geladen door `js/gmail.js` voor Gmail OAuth
- Web App Manifest met shortcuts voor installeerbaarheid
- Open-Meteo voor weer (geen API key, default Amsterdam centrum 52.3676, 4.9041)
- GitHub Gist API voor encrypted auto-sync met versie-historie
- Gmail API (`gmail.send` scope) voor factuur-verzending met PDF-bijlage
- Web Crypto API voor AES-GCM versleuteling (PBKDF2 200k iter)
- Motion One (lokaal gevendord in `js/vendor/motion.min.js`, geen build/CDN) voor subtiele scroll-in reveals via `js/motion.js` — respecteert prefers-reduced-motion
- WebAuthn voor Face ID/Touch ID
- Web Speech API voor voice-input
- Vibration API voor haptic feedback
- Web Share API, Notification API, Storage API

## Workflow

- Code wijzigingen lokaal in `/Users/soef/claude code`
- Commits via `git commit`
- **Push altijd direct naar `origin/main`** — GitHub Pages bouwt binnen 1-2 min. NOOIT alleen op een feature-branch laten staan; altijd afsluiten met push naar main.
- In remote Claude Code sessies: na commits op feature-branch altijd mergen naar main en pushen (`git push origin HEAD:main` of `git push -u origin <branch>:main`)
- gh CLI staat in `~/bin/gh`, auth al ingesteld (user: sofyanghaddari)
- Bij elke commit van static assets: bump `CACHE` versie in `service-worker.js`

## Modules (10 tabs)

1. **🏠 Dashboard** — begroetingskaart met dag/nacht-lucht + kleine vandaag/maand/hizb-stats (tel-animaties, % van doel), **"Vandaag"-paneel** (`js/today-panel.js`, ná de Hadith/Woord-van-de-dag) dat taken-van-vandaag (deadline vandaag + achterstallig + open hoge-prio zonder datum) én agenda-afspraken van vandaag bundelt — met snel toevoegen (NL-parser, tijd optioneel) en afvinken van zowel taken als afspraken (verving de oude "Prioriteiten"-kaart), quick-actions (Inkomen/Taken/Koran/Arabisch met statussubtekst incl. streak), weer-radar Amsterdam, kalender+jaaroverzicht, patroon-insights, **Hadith- en Woord-van-de-dag met ‹ › dag-navigatie (vorige dagen herhalen) + 🔊 voorlees-knop** (hadith in Arabisch via `speechSynthesis` ar-SA, woord in NL nl-NL), spaardoelen-kaart, gewoontes-vandaag, empty CTA. **Géén** inkomen-hero of maandoverzicht-kaart meer (staan in Taxi-overzicht) — v137 ontdubbeld
2. **🚖 Taxi** — vereenvoudigd: alleen "+ Inkomen vandaag noteren" + maandkalender-grid waarop je per dag retroactief inkomen invult (klik dag → modal met items + add), CSV-export, jaarverloop bar-chart. **Geen** shift-tracker, source-breakdown, uitgaven of belasting-reserve meer
3. **🕌 Geloof** (`geloof.js`) — wrapper met drie sub-tabs:
   - **📖 Koran** sub-tab: dagelijkse hizb afvinken + streak + 30-dagen grid + streak-repair (1× per maand gemiste dag goedmaken) + reminder-instellingen
   - **📚 Arabisch** sub-tab: SRS (SM-2 lite) met 4 knoppen, CSV-import (Anki tab/comma), sessies, kaarten-overzicht met search
   - **📖 Stof** sub-tab (`grammatica.js`, v163): grammatica-onderwerpen uit het lesboek (Fusha niveau 3) invoeren via 📷 boekfoto of ✍️ tekst → AI (Cloudflare Worker `proxy/grammatica-worker.js`, Sonnet 4.6) zet om naar gestructureerd onderwerp met referentie-i3rab; oefensessies mixen i3rab-ontleding + eigen-woorden-uitleg, AI beoordeelt (ja/deels/nee + fouttype naamval/functie/regel/overig), licht interval-schema 1d/3d/1w/2w/1m. LOS van de vocab-SRS — geen overlap
   - Sub-tab staat opgeslagen in `container.dataset.geloofSub`; diep linken via `document.getElementById('view').dataset.geloofSub = 'koran'` vóór `navigate('geloof')`
4. **🎯 Doelen** — lange/korte termijn met taxi-koppeling (% per rit + streefbedrag), gewoontes met chains + 14-dagen-strip, spaarpotjes (Bunq-style met current/target)
5. **✅ To-do** — compacte layout (v54): header met open-teller-pill, quick-add + ＋-knop bovenaan, daaronder direct de taken; alléén niet-lege prioriteitsgroepen (geen lege placeholder-blokken), één scrollbare chip-rij (filters+tags+selecteer), horizontale actieknoppen op de kaart, afvink-animatie (check-pop + kaart glijdt uit), stagger-entree. Verder: prioriteit/medium/waiting, tags, subtaken, herhalend, bulk, undo, later-parkeren, quick-NL-input ("morgen 10:00 APK")
6. **📝 Notities** — notities + ideeën sub-tabs, lichte markdown
7. **🗓 Week** (`agenda.js`) — week-tijdrooster 06:00–24:00, dag-selector met dag-inkomen, blokken per categorie; tik een leeg tijdvak om te plannen (werkt op mobiel, geen hover nodig). Events in IndexedDB-store `agenda_events` (eenmalige migratie vanuit localStorage)
8. **📊 Stats** (`stats.js`) — inkomen-inzichten met 7d/30d/90d/Alles filter, totalen + per-week bar-chart (WIP, serif titel)
9. **🧾 Boekhouding** (`boekhouding.js`) — volledig boekhoudprogramma Moneybird-stijl:
   - **Verkoopfacturen:** maak + verstuur facturen (Taxi-administratie of Olijfolie-bedrijf), PDF-generatie via jsPDF, HTML-print versie
   - **Gmail-verzending:** OAuth2 via Google Identity Services, PDF als bijlage, CC-veld, "Stuur kopie naar mezelf" toggle (default ON → kopie naar sofyanghaddari@gmail.com)
   - **CRITICAL:** NOOIT automatisch mailen — alleen na expliciete klik op "Versturen" knop
   - **Send-modal Moneybird-stijl:** Aan / CC / Onderwerp / Bericht velden, PDF-preview chip, iOS-toggle voor zelfkopie
   - **Inkoopfacturen:** bonnetjes registreren, BTW-berekening, categorisering
   - **Bonnetje-scanner:** 📷 Foto → Tesseract.js OCR → auto-fill naam/bedrag/BTW/datum/categorie
   - **Km-registratie:** zakenritten bijhouden
   - **Klantenbeheer:** klanten CRM
   - **BIC INGBNL2A:** staat in PDF betaalvak, HTML-print betaalbox, e-mail betaalinformatie, clipboard-herinnertekst, WhatsApp tekst
   - **ADMINS object:** `{ taxi: { naam, kvk, iban, bic: 'INGBNL2A', ... }, olijfolie: { ... } }`
   - **`OWNER_EMAIL`:** `'sofyanghaddari@gmail.com'` — ontvanger zelfkopie
10. **📋 invoice-nlp.js** — NLP parser voor factuur-extractie uit tekst (los bestand, geen tab)

## Globale features

### UI & Toegang
- ⚙️ **Settings** floating top-right (met safe-area-inset-top voor Dynamic Island clearance) — modal met **5 tabs** (Profiel / Stijl / Doelen / Data / Systeem), laatst geopende tab wordt onthouden binnen de sessie
- 🔍 **⌘K + zoek-knop** top-right, doorzoekt alles
- ☁️ **Sync-pill** top-center: toont "Synced 2m geleden" + tap voor handmatige sync
- 📡 **Offline-banner** bovenin (met safe-area)
- 👤 **Splash-screen** met goud "✦ Dashboard" bij openen (geen FOUC)

### Visueel
- ✦ **3 thema-presets:** onyx, midnight (donker, default) en daylight (licht) — oudere presets zijn verwijderd; auto-thema wisselt overdag naar daylight
- 🎨 **1 accent:** gold (licht thema gebruikt donkerder goud #7A5C20 voor WCAG AA-contrast)
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
service-worker.js                — bump CACHE bij wijzigingen (huidig: v166)
CLAUDE.md                        — dit bestand
css/styles.css                   — alle CSS, inclusief preset-themes
js/
  app.js                         — bootstrap + wiring
  router.js                      — tab navigation + staggerIn na render
  db.js                          — IndexedDB wrapper (DB_VERSION=7) met _updatedAt injection + onWrite callback + STORE_NAMES (één bron van waarheid voor sync/backup/export)
  utils.js                       — uid/fmtMoney/ymd/startOfWeek/parseAmount etc
  settings.js                    — localStorage helpers met defaults
  theme.js                       — dark/light/auto + accent + preset + density
  achievements.js                — 12 badges berekening
  activity.js                    — silent activity log (max 200)
  animate.js                     — countUp, initCountUps ([data-countup] tel-animaties), (legacy) staggerIn, bindRipple
  motion.js                      — Motion One wiring: revealView() scroll-in reveals (window.staggerIn wijst hiernaar)
  vendor/motion.min.js           — lokaal gevendorde Motion One (offline-safe, in SW-cache)
  notifications.js               — browser-notificaties voor taken met deadline
  privacy.js                     — blur-toggle voor bedragen op dashboard
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
  gmail.js                       — Gmail OAuth2 via GSI + sendInvoiceEmail() + buildHtmlEmail() + preloadGSI()
  receipt-ocr.js                 — Tesseract.js OCR wrapper: ocrReceipt() + parseReceiptText()
  invoice-nlp.js                 — NLP parser voor factuur-extractie
  income-road.js                 — gedeelde incomeRoad() taxi-weg-animatie (Taxi-overzicht)
  cabman.js                      — gestileerde Cabman-taximeter (Taxi-overzicht): rolling digits + live klok
  hijri.js                       — hijri-datum via Intl islamic-umalqura + isRamadan/isEid
  icons.js                       — icon(name) inline SVG line-iconen helper
  push.js                        — web-push subscription + push-config gist (refreshPushConfig)
  qibla.js                       — qibla-kaart dashboard + volledig kompas-modal
  today-panel.js                 — "Vandaag"-paneel (taken + agenda) op dashboard
  markitdown.js                  — document→Markdown import voor Notities (lokale MarkItDown-server, valt terug op pdf.js/mammoth/Tesseract via CDN)
  modules/
    dashboard.js                 — home view, hero, weer, alles aggregatie
    taxi.js                      — alleen inkomen-kalender, geen shift
    koran.js                     — hizb afvinken + streak-repair
    arabic.js                    — SRS
    geloof.js                    — wrapper: sub-tabs Koran + Arabisch + Stof onder "Geloof" tab
    grammatica.js                — Stof-module: AI-grammatica-docent (ingest + oefenen via Worker)
    goals.js                     — doelen + habits chains + spaarpotjes
    todo.js                      — taken met smart filters
    notes.js                     — notes + ideas
    agenda.js                    — Week-tijdrooster (events in localStorage)
    stats.js                     — inkomen-inzichten + per-week bar-chart
    arabic-srs.js                — SRS-sessie helper voor arabic
    boekhouding.js               — volledig boekhoudprogramma (facturen, klanten, km, kosten, Gmail)
  data/
    arabic-words.js              — Arabische woordenlijst
    hizbs.js                     — hizb-indeling (koran voortgangskaart)
  components/
    modal.js                     — basis modal met × close button
    settings.js                  — ⚙️ modal (groot, alle settings), APP_VERSION = v166
    toast.js                     — ok/err/info popup
    celebrate.js                 — confetti + popups
    swipe.js                     — swipe-to-delete on list items
    pullrefresh.js               — pull-to-refresh
    cmdk.js                      — ⌘K search palette (Koran/Arabisch navigeren via geloof sub-tab)
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

## IndexedDB stores (v8)

Elke schrijfactie krijgt automatisch `_updatedAt: Date.now()` voor merge-resolution.

- `rides`: { id, date (ISO), amount, source ('daily'), km?, note? }
- `expenses`: { id, date, amount, category, note? } — UI verborgen
- `hizb_log`: { date (YYYY-MM-DD), completed, repaired? }
- `cards`: { id, front, back, note, interval, ease, repetitions, dueDate, createdAt }
- `goals`: { id, title, description, term, deadline, progress, target?, taxiPercent?, milestones?[{id,title,done}] }
- `todos`: { id, title, note, priority, done, dueDate?, recurring?, tags[], subtasks[], savedForLater, createdAt, completedAt? }
- `shifts`: { id, startTime, endTime?|null } — UI verwijderd maar store blijft voor data
- `notes`: { id, title, body, isIdea, createdAt, updatedAt }
- `habits`: { id, name, emoji, after?(habitId for chain), createdAt }
- `habit_log`: { id (date+habitId), date, habitId, done }
- `pots`: { id, name, emoji, target, current, createdAt }
- `invoices`: { id, number, adminId, clientId, date, dueDate, lines[], status, notes? } — boekhouding verkoopfacturen
- `purchase_invoices`: { id, adminId, vendor, date, amount, vatRate, vatAmount, category, note?, receiptText? } — inkoop/bonnetjes
- `km_log`: { id, date, from, to, km, purpose, adminId } — km-registratie
- `clients`: { id, adminId, name, email, phone?, address?, city?, kvk?, btw?, iban?, bic? } — klantenbeheer
- `taxi_expenses`: { id, name, amount, frequency ('monthly'|'weekly'|'eenmalig'), date?, note? } — taxikosten (vaste lasten + eenmalig geboekte kosten)
- `agenda_events`: { id, date, hour, minute, duration, title, cat, done? } — Week-tab afspraken (gemigreerd uit localStorage)
- `grammar_topics`: { id, titelAr, titelNl, uitleg{regel, puntenNl[], puntenAr[]}, voorbeeldzinnen[{id, zin, vertaling, i3rab[{woord, analyse}]}], status ('nieuw'|'bezig'|'beheerst'), srs{stap, laatsteHerhaling, volgendeHerhaling}, foutgeschiedenis[{datum, oefentype, fouttype, zinId}], bron, createdAt } — Stof-module

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
- `gmailClientId`, `gmailClientSecret` — Google OAuth credentials (persistent in localStorage)
- `grammarWorkerUrl` — URL van de grammatica-Worker (Stof-module); gaat mee in gist-`_settings`
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
- **Bedragvelden ALTIJD `type="text" inputmode="decimal"` + `parseAmount()` in utils.js** (komma→punt) — NOOIT `type="number"` want NL-iPhone-toetsenbord typt komma's die number-velden stilletjes leegmaken
- Modals hebben rechtsboven een ×-knop (`.modal-close`)
- Card-titles `.card-title` class (uppercase, small, letterspacing)
- Service worker CACHE versie bumpen bij elke wijziging van static assets — én `APP_VERSION` in `js/components/settings.js` gelijk houden
- Bij nieuwe IndexedDB store: bump `DB_VERSION` en voeg toe aan het `STORES`-object in `db.js` — sync/backup/export volgen automatisch via `STORE_NAMES` (géén losse lijsten meer bijwerken)
- `safe-area-inset-top` (--safe-top) voor alle floating top elementen
- `_updatedAt` automatisch via `db.js put()` — niet handmatig zetten
- Bij `onWrite` event auto-push naar GitHub na 8s debounce
- **BIC INGBNL2A** — ING Bank BIC, moet staan in: PDF betaalvak, HTML-print betaalbox, e-mail betaalinfo, WhatsApp tekst, clipboard herinnertekst. ADMINS object heeft `bic: 'INGBNL2A'` voor beide bedrijven
- **Gmail — NOOIT automatisch versturen.** E-mails alleen na expliciete klik op "Versturen" knop. Geen automatische e-mail workflows
- **Gmail iOS popup fix:** `preloadGSI()` aanroepen bij het openen van de send-modal (als achtergrond, vóór user-gesture). In `sendViaGmail()`: eerst `getGmailToken()` aanroepen (dicht bij user-gesture), daarna pas PDF genereren. `requestAccessToken({ prompt: '' })` voor stille re-auth

## Gmail OAuth setup (eenmalig door user)

1. Google Cloud Console → project aanmaken
2. APIs & Services → Enable Gmail API
3. OAuth-toestemmingsscherm → extern → scopes: `gmail.send`
4. Onder "Doelgroep": voeg `sofyanghaddari@gmail.com` toe als testgebruiker (anders 403 access_denied)
5. Credentials → OAuth 2.0 Client-ID → Web application
6. Authorized JavaScript origins: `https://sofyanghaddari.github.io`
7. Authorized redirect URIs: `https://sofyanghaddari.github.io/dashboard/`
8. Client ID + Client Secret invoeren in ⚙️ → Boekhouding tab

## Sync gedrag

- **Auto-push:** elke schrijf → 8s debounce → push naar alle ingestelde gists
- **Push op tab-hide:** visibilitychange hidden → meteen push (geen debounce)
- **Pull op tab-show:** visibilitychange visible + autoPullOnOpen=1 → syncMerge
- **Auto-merge bij openen:** als toggle aan → eerst remote pullen + mergen, dan boot
- **Manual sync via pill:** tap op ☁️-pill = syncMerge + syncUp
- **Merge logic:** universal `_updatedAt` first, dan per-store fallback (cards: repetitions hoger wint, goals: progress hoger wint, pots: current hoger wint, todos: done wint van niet-done)

## Recente beslissingen (chronologisch, meest recent boven)

+34. **🫒 AJAR v28 — nuttige animaties + functie-polish (17 juli 2026):** vervolg op de mega-ronde. **Functies:** toast-systeem `window.ajarToast` (werd al aangeroepen maar bestond nooit), fotostapel swipe vooruit/terug + pijltjestoetsen, lightbox laadt buurfoto's voor, BTW/KvK-format-validatie in de veld-vinkjes/voortgangsbalk, topbar pauzeert op hover, prefetch ook op focus, formulier-meldingen als aria-live-regions. **Animaties:** laad-shimmer op foto-placeholders (stopt via `slot-loaded`-klasse, geen `:has()`), actieve positie-dots worden pills, copy-knop-pop, FAQ-antwoord-slide. Alles getest (bestaande suites + gerichte v28-tests + EN-spotcheck). Changelog: `ajar/PROJECT.md`.

+33. **🫒 AJAR v27 — mega-audit + design-verfijning (17 juli 2026):** volledige site-audit op verzoek van user ("controleer alles, fiks alles"). **Drie échte bugs gefixt:** (1) fotostapel bevroor permanent na één tik (`stop()` killde de lopende wissel-timer → `busy` bleef eeuwig true), (2) herkomstkaart-marker bevroor na tab-wissel (visibilitychange startte nooit opnieuw), (3) reveals konden onzichtbaar blijven bij snelle scroll-sprongen (observer slaat elementen over → na-ijl-veegcheck toegevoegd). **Design-verfijning:** goud-`::selection`, tabular-nums, hairline-ring op foto's, geveegde goud-onderstreping op tekstlinks, olijf-gradient op primaire knoppen, partnerlogo's kleuren in, goudstof-deeltjes in de CTA-band, hover/touch-prefetch (instant navigatie), subpagina-hero-stagger. Alles hertest: interactie-audit (menu's/formulieren/lightbox/carrousels/taalwissel), EN/FR × 2 breedtes, screenshots alle 9 pagina's, officiële smoke-test groen. Changelog: `ajar/PROJECT.md`.

+32. **🫒 AJAR v26 — animatie-regie (17 juli 2026):** grote kwaliteitsronde over het complete bewegingssysteem van de ajar-site op verzoek van user ("chiquer, cooler, miljoenen-B2B"). Eén nieuwe CSS-sectie "ANIMATIE-REGIE v26" in `ajar/css/style.css` + verfijningen in `ajar/js/main.js`: expo-out easing-tokens, auto-stagger cascade in `initReveal` (batch-delay, na entree opgeruimd), hero/CTA-band child-choreografie, goudglans door de CTA-titel (background-clip: text), fotostapel-diepte, menu-cascades (desktop-dropdown + mobiel volscherm), editorial foto-zoom hover, marquee-pauze op hover, View-Transition-gebaar, scroll-driven footer-reveal, count-up op expo. Plus échte fix: `.mcar`-carrouselkaarten onthulden nooit (horizontaal buiten beeld) → groepsreveal zodra de carrousel in beeld komt. Reduced-motion-uitzet staat bewust ONDERAAN de sectie (latere regels winnen van het oudere reduced-blok). Volledige changelog in `ajar/PROJECT.md`. Geen SW-cache-bump nodig (ajar wordt door de SW genegeerd).

+31. **⚡ Klant snel opslaan via plakken v166 (10 juli 2026):** op verzoek van user — in Boekhouding → Klanten → "+ Klant" staat nu bovenaan een **"Snel invullen"**-plakveld: plak een blok klantgegevens (zoals van een website/e-mailhandtekening) en `parseClientText()` in `boekhouding.js` leest zelf naam, straat+nr, postcode+stad, KvK, **BTW-nummer**, **IBAN**, **BIC**, e-mail en telefoon uit (gelabelde regels zoals "Btw-nummer: …" winnen; ongelabelde regels op patroon — postcode `1431ZN Aalsmeer` wordt genormaliseerd naar "1431 ZN Aalsmeer", eerste overgebleven regel = naam). Velden worden live ingevuld met een "✓ N velden herkend"-hint (`.bk-paste-hint`), user controleert en slaat op. Klant-record heeft nu ook `btw`/`iban`/`bic` (geen DB-bump nodig); die velden staan ook in de bewerk-modal en het klant-detail. CSS: `.bk-paste-box`/`.bk-paste-hint`.

+30. **🫒 AJAR B2B-olijfoliesite in `ajar/` + SW-fixes v164-v165 (2-3 juli 2026):** aparte statische marketingsite (eigen bouwprompt van user) op `/dashboard/ajar/` — vijf pagina's + privacy, alle content in `ajar/js/content.js`, Formspree/GA4/cookiebanner/spec-sheet-PDF, animatie-pakket; beheer-gids in `ajar/README.md`, foto-shotlist in `ajar/SHOTLIST.md`. **Twee SW-lessen:** (1) v164 — de cache-first-branch cachede élke response, óók 404's (tijdens een GitHub Pages-deploystoring bleef de 404 van ajar/ permanent hangen) → alleen `resp.ok` cachen; (2) v165 — **`/ajar/`-paden worden door de SW volledig genegeerd** (early return in fetch-handler): het is een vaak-updatende marketingsite, cache-first toonde bezoekers eindeloos oude versies. Ajar-wijzigingen vereisen dus GEEN cache-bump; dashboard-wijzigingen wél, zoals altijd. Let op: GitHub Pages-deploys haperden 2x op rij ("deployment_queued" timeout / "try again later") — bij een 404 na push eerst de Pages-run checken vóór in de code te zoeken; lege commit = nieuwe deploy.

+29. **📖 Stof/grammatica-module v163 (2 juli 2026):** nieuwe, aparte module onder Geloof → Stof (bouwprompt v2; vocab-module ongemoeid).
   - **Architectuur:** onderwerpen in IndexedDB-store `grammar_topics` (DB_VERSION 7→8; bewuste afwijking van de bouwprompt-localStorage zodat gist-sync/backup/export automatisch meelopen via `STORE_NAMES`) + export/import-knop als extra vangnet. AI via **Cloudflare Worker** `proxy/grammatica-worker.js` (model `claude-sonnet-4-6`, API-key als Worker-secret, CORS-allowlist, daglimiet via KV-binding `RATE_KV`, default 100/dag). Deploy-gids: `proxy/README-grammatica-worker.md`; handmatige test: `proxy/test-grammatica-worker.mjs`.
   - **Endpoints:** `/ingest-topic` (boekfoto base64 — client-side verkleind naar max 1568px — of getypte tekst → titel/regel/uitlegpunten NL+Ar/voorbeeldzinnen met referentie-i3rab, met preview vóór opslaan) en `/check-grammar` (beoordeelt i3rab-antwoord of eigen-woorden-uitleg → ja/deels/nee + NL-feedback + fouttype naamval/functie/regel/overig).
   - **Herhaling:** licht interval-schema (1d/3d/1w/2w/1m, simpeler dan SM-2); sessie mixt per onderwerp een uitleg-check + een i3rab-oefening (random zin); slechtste resultaat telt (ja→stap+1, deels→zelfde stap+morgen, nee→stap-1+morgen); status beheerst bij stap ≥ 4. Fouttypes gelogd (max 100) → "meeste fouten: X"-chip.
   - **Integratie:** derde sub-tab in `geloof.js`, route-redirect `grammatica` in app.js, ⌘K-entry, `grammarWorkerUrl` mee in gist-`_settings`. CSS-sectie ".gram-*". E2E getest op 375px (headless, mock-worker): ingest→preview→opslaan→sessie→beoordeling→SRS-update→export, geen overflow/JS-fouten.
   - **Fase-status bouwprompt:** Fase 0-2 gebouwd; Fase 3 (validatieweek met إعراب + الأسماء الخمسة, échte boekfoto-test na Worker-deploy) ligt bij de user; Fase 4 (volledige boek-uitrol + gecombineerd overzicht) bewust NIET gebouwd tot na akkoord.

+28. **🚕📿 Cabman-meter + hijri + animatie-pakket v161 (1 juli 2026):** op verzoek van user (foto van zijn echte Cabman-meter als referentie).
   - **Cabman-taximeter** (`js/cabman.js`, Taxi-overzicht bovenaan): gestileerd donker display met **blauwe rolling digits** (per cijfer een 0-9-strip die naar positie rolt, `.cb-digit`/`.cb-col`), dagbedrag van vandaag, statusregel met datum + privacy-oogje, onderrij Doel-% / **live klok** (interval stopt zelf buiten DOM/verborgen tab) / maandtotaal, blauwe balk = "Inkomen noteren" (id `quick-today`, zelfde handler), "cabman"-woordmerk. Verving de losse add-income-knop én het dubbele hero-bedrag — de income-hero is nu puur de dagdoel-wegscène.
   - **Hijri-datum** (`js/hijri.js`, geen library): Umm al-Qura via `Intl.DateTimeFormat('nl-NL-u-ca-islamic-umalqura')`; op de begroetingskaart onder de datum in NL-transliteratie + Arabisch (leer-element, `.dagstart-hijri`). `isRamadan()`/`isEid()` sturen sfeer: **Ramadan = wiegende fanoos-lantaarns** (`.sky-fanoos`), **Eid (1-3 Sjawal, 10-13 Doe al-hizja) = stil goudvuurwerk** 's avonds (`.sky-fireworks`).
   - **Animatie-pakket** (CSS-sectie "✨ ANIMATIE-PAKKET v161", alles met reduced-motion-guard): 💰 **munt-plons** — €-munt valt in het potglas na toevoegen (`_splashPotId` in goals.js, `.pot-coin`/`.pot-splash`); ❤️ **deadline-hartslag** — doel-kaart pulseert bij deadline ≤3 dagen (`.goal-beat`), rood+sneller bij over tijd (`.goal-beat-late`); 🚕 **taxi-daklicht** op hoge-prio taken (puur CSS `::after` op `.task-card[data-priority="high"]`); ✨ **gouden Arabische letters** stijgen op bij hizb-afvinken (`spawnHizbLetters()` in koran.js, gespawnd op body dus re-render-proof); 🏁 **victory lap** — bij dagdoel 100% scheurt de Mercedes één keer de hele weg over + daklicht-flits (`.ir-win .ir-car-svg`, op de binnenste svg om niet te botsen met de bob/translate op `.ir-car`).
   - Streak-lantaarnpad bewust NIET gebouwd (user: hoeft niet).
   - **v162 hotfix:** user zag geen letters → oorzaak dubbel: (1) letters zaten alleen op de eerste afvink-knop, nu ook op "dubbel hizb" en "inhalen"; (2) **échte oude bug**: `.hizb-check-btn.done` had `pointer-events:none` waardoor de dubbel/inhaal-knop (die de done-class draagt) al die tijd ONKLIKBAAR was — fix: `#double-hizb:not([disabled]) { pointer-events:auto }`. Letters groter/feller gemaakt (9 stuks, 1.7rem, 2.4s).

+27. **🔧 Grote overhaul-ronde v160 (1 juli 2026):** volledige audit + fixronde op verzoek van user.
   - **App-iconen gerepareerd:** `icon-192/512.png` waren sinds het begin **0 bytes** (kapot homescreen-icoon, kapotte notificatie-iconen, PWA-install faalde). Nieuwe iconen gegenereerd (goud ✦ op donker, matcht de splash) + `icon-180.png` (apple-touch) + aparte `icon-maskable-192/512.png` (ster binnen safe zone) + favicon-link en meta description in `index.html`.
   - **Backup-bug:** `auto-export.js` had een verouderde stores-lijst zonder `taxi_expenses`/`agenda_events` → wekelijkse export was incompleet. Nu **`STORE_NAMES` in `db.js`** als enige bron; `github-sync.js`, `components/settings.js` en `auto-export.js` importeren die.
   - **NL-geldnotatie overal:** `fmtMoney()`, tel-animaties (`animate.js`) en `fmtMoneyCompact` gebruiken nu een komma ("€ 187,50") — was een punt, inconsistent met Boekhouding.
   - **Settings-doelvelden** dag-/maanddoel: `type="number"` → `type="text" inputmode="decimal"` + `parseAmount()` (de bekende NL-komma-bug) met validatie.
   - **Router:** `hashchange`-listener (terugknop + manifest-shortcuts werken nu terwijl de app open is); eerste navigatie via `history.replaceState` (geen redirect-penalty/extra history-entry).
   - **Lazy tabs:** alle tab-modules behalve dashboard worden via dynamic `import()` geladen (`lazyRender()` in `app.js`) — fors minder parse-werk bij boot; SW pre-cachet alles dus offline blijft werken. Lighthouse Performance 62 → hoger (zie changelog).
   - **Qibla:** geen geolocatie-prompt meer bij het laden van het dashboard — alleen stil verversen als permissie al 'granted' is (`navigator.permissions.query`). Volledige prompt pas bij openen van het kompas.
   - **iCal-export:** RFC 5545-escaping van `, ; \` en newlines in SUMMARY/DESCRIPTION.
   - **WCAG AA-contrast:** `--text-faint` donker `#85837E`, licht `#66625C`; licht goud/accent `#7A5C20` (theme.js GOLD_LIGHT mee aangepast).
   - **Doelen: mijlpalen + deadline-countdown** (zie module-beschrijving; `milestones` op het goals-record, geen DB-bump).
   - **Dead code:** `js/data/suras.js` verwijderd.

+26. **🧾 Taxi: werkelijke kosten boeken i.p.v. schatting v157 (1 juli 2026):** op verzoek van user — het kostenoverzicht toont nu **daadwerkelijk geboekte** kosten, geen projectie. `costsForPeriod()` telt alléén `frequency:'eenmalig'`-posten (gedateerd) op, gegroepeerd per categorie, met datum-string-vergelijking (tijdstip speelt niet mee). Periodekiezer kreeg **Alles** erbij. Nieuw in de Kosten-tab: **"Kosten boeken"**-formulier (datum + categorie via datalist `COST_CATS` + snelkeuze-chips + bedrag + optionele notitie → `taxi_expenses` eenmalig), een **"Geboekte kosten"**-lijst (gesorteerd op datum, per categorie-kleur `catColor()`, verwijderbaar), en een aparte **"Vaste lasten (voor break-even)"**-kaart met alleen de terugkerende maand/week-posten + presets. CSS: `.cost-book-grid`/`.cost-cat-chip`/`.cost-log-*`. (Vervangt de projectie-aanpak uit v154; de Netto-kaart op Overzicht blijft bruto − vaste lasten − eenmalig-deze-maand.)

+25. **🚖 Taxi: inkomen-knop bovenaan + kostenoverzicht per periode v154 (30 juni 2026):** op verzoek van user.
   - **"+ Inkomen vandaag noteren"** staat nu **bovenaan** het Taxi-overzicht (vóór de income-hero) i.p.v. onderaan.
   - **Kostenoverzicht** in de Kosten-tab (`costsForPeriod()`/`periodSpec()` in `taxi.js`): periodekiezer **Maand / 3 mnd / 6 mnd / Jaar** (`container.dataset.costPeriod`), groot rood totaal voor de periode, en een **uitsplitsing per post** (Brandstof, Onderhoud, Verzekering, …) met gekleurde balken (`.cost-bars`, palet `COST_COLORS`), gesorteerd op bedrag. Vaste kosten worden over de periode geprojecteerd (`amount × maanden`, weekly × ~4.348/mnd), eenmalige kosten tellen mee op hun datum. Verving de oude platte "Totaal maandkosten"-kaart; break-even/dag + eenmalig-deze-maand staan nu in de voet. CSS-sectie "💸 Kostenoverzicht".

+24. **🌈🐦✈️ Volledige levende begroetingslucht v153 (30 juni 2026):** op verzoek van user ("allemaal") acht extra sfeer-effecten toegevoegd, conditioneel op het echte weer/tijdstip (helpers `cachedWeather()`/`skyExtras()`/`moonPhase()` in `dashboard.js`, CSS-sectie "Sfeer-extra's"):
   - **🌈 Regenboog** (`.sky-rainbow`, radial-gradient-boog) bij regen/motregen overdag (zon + regen).
   - **☔ Regendruppel-rimpels** (`.sky-ripples`) bij neerslag.
   - **🐦 Vogels** overdag (helder/wisselend/bewolkt), **🦇 vleermuizen** bij schemer/nacht (`.sky-birds`/`.sky-bats`, CSS-vleugels via border-arcs).
   - **✈️ Vliegtuig + contrail** (`.sky-plane`) overdag bij helder/wisselend.
   - **🍂 Wegwaaiende bladeren** + snellere wolken bij wind ≥ 28 km/u (`.sky-leaves`/`.sky-windy`); windsnelheid nu opgehaald (`wind_speed_10m` toegevoegd aan de Open-Meteo-call in `weather.js`).
   - **🌡️ Hittegloed** (`.sky-heat`) bij ≥ 28 °C, **❄️ vorst-kristallen** in de hoeken (`.sky-frost`) bij ≤ 0 °C.
   - **🌙 Echte maanfase** in de orb (`.so-phase` terminator-schaduw via `moonPhase()`), verborgen tijdens de bloedmaan-eclipse.
   - **🎉 Confetti-regen** in de lucht (`skyConfettiBurst()`) bij een nieuwe badge (naast de bestaande badge-viering).
   - `applySkyWeather(container, cur)` ververst nu ook de extra's met code+temp+wind. Reduced-motion-guard uitgebreid.

+23. **Boekhouding-overzicht professioneler v152 + factuur-PDF-logo v154 (30 juni 2026):** eerste rondes van de "maak boekhouding perfect"-opdracht. Het Overzicht-scherm heeft nu een **financiële hero-kaart** (groot serif winstgetal met pos/neg-kleur, marge-pill, dunne omzet/kosten-ratiobalk met legenda-stippen) i.p.v. de vlakke 4-KPI-grid; daaronder een verfijnd 2-tegel-grid (BTW-kwartaal incl. "terug te ontvangen" bij negatief saldo + Openstaand bedrag). Alle inline `style="color:…"` vervangen door CSS-klassen (`.bk-kpi-val.pos/.neg/.accent`, `.bk-hero-val.pos/.neg`). Color-emoji `⚠️` overal in `boekhouding.js` vervangen door de toegestane monochrome glyph `⚠` (de overdue-alert op Overzicht gebruikt nu een line-icon SVG). Status-pills (`.bk-status`) kregen een gekleurd indicatorstipje (`::before`, currentColor) — Moneybird-stijl. CSS-sectie uitgebreid met `.bk-hero*`/`.bk-leg`/`.bk-dot*`. **Factuur-PDF — vector-logo + woordmerk v154:** `drawCompanyLogo()` tekent een afgeronde badge in accentkleur (geen afbeelding nodig) met een **taxi-silhouet** (witte body/dak, dambord-streep, zwarte wielen met witte naaf) voor de Taxi-administratie en een **blad** voor Olijfolie (`logoGlyph` op het ADMINS-object: 'taxi'/'leaf'). In de PDF-header staat de badge links + woordmerk (`bedrijf.naam`) + **tagline** in kapitalen accentkleur (`tagline` op ADMINS). Logo visueel geverifieerd via SVG-mirror + headless-chromium screenshot. **Nog te doen** (volgende rondes): lijsten (kosten/km/klanten) verder gelijktrekken; eventueel rustiger PDF-tabelkop.

+22. **🌦️ Begroetingslucht volgt het echte weer + 3 extra sky-animaties v149 (29 juni 2026):** op verzoek van user.
   - **Weer-volgen:** `skyScene()` leest de gecachte weercode (`localStorage.weatherCache`) en toont passende lagen in de begroetingslucht — **regen** (`wx-rain`), **motregen**, **onweer** (regen + bliksem `wx-flash`/`wx-bolt`), **sneeuw** (`wx-snow`), **mist** (`wx-fogband`) — plus een grijze waas + grijzere wolken bij bewolkt/nat (`.sky-overcast`). Hergebruikt de bestaande `wx-*` klassen van de weer-banner. `applySkyWeather(container, code)` ververst de lucht zodra verse weer-data binnen is (in `loadWeather`). Helpers `wxCondition()`/`cachedWeatherCode()`/`skyWeatherLayers()`.
   - **☁️ Drift-wolk** (`.sky-drift`, z-index boven de orb): een wolk die langs de zon/maan drijft en 'm af en toe half bedekt; grijzer/voller bij bewolkt.
   - **🌌 Noorderlicht** (`.sky-aurora`, `mix-blend-mode:screen`): groen→blauw→paars gloed bovenin, **alleen 's nachts bij een mijlpaal** (dagdoel gehaald óf maanddoel 100%). Vlag via `skyScene(now, { milestone })`.
   - **🌇 Warme zon** (`.so-warm`): bij dawn/dusk kleurt de zonschijf + gloed warm oranje (zonsop-/ondergang).
   - Reduced-motion-guard uitgebreid (`.sky-drift`, `.sky-aurora`).

+21. **🌒 Verberg-knop = verduistering i.p.v. nacht v148 (29 juni 2026):** op verzoek van user — i.p.v. de lucht nacht te maken bij verbergen, toont de zon nu een **zonsverduistering** (de maan `.so-shadow` schuift voor de zon, gloeiende **corona** `.so-corona` + **diamond-ring glinster** `.so-glint`) en de maan een **maansverduistering/bloedmaan** (`.so-disc` wordt koperrood + umbra). Zo blijft het **dagdeel** behouden: overdag dimt de lucht slechts subtiel (`.sky-shade` schemering .4, geen sterren geforceerd), 's nachts blijft het nacht. Extra leuke sky-animaties: **vallende ster** (`.sky-meteor`, alleen 's nachts) en de pulserende corona. De `.so-lid`/sikkel-aanpak uit v145 is vervangen. Reduced-motion-guard uitgebreid (`.so-corona`, `.sky-meteor`).

+20. **☀️→🌙 Zon = verberg-knop met zonsondergang-animatie v145 (29 juni 2026):** op verzoek van user — de blur/privacy-functie zit nu ín de zon/maan van de begroetingskaart i.p.v. een los oogje (dat is verwijderd op het dashboard; Taxi houdt de oog-knop). `skyScene()` rendert de zon/maan nu als klikbare knop `#sky-privacy` met lagen (gloed, draaiende stralen, schijf, kraters, sikkel-schaduw). Tik = bedragen verbergen met een **zonsondergang-animatie**: stralen trekken in, de schijf koelt van goud naar zilver, een sikkel-schaduw schuift in (zon → maansikkel), de lucht wordt nacht (`.sky-shade` + sterren `.sky-stars` faden in) en de bedragen blurren (`body.amounts-hidden`). Weer tikken = zonsopkomst. Gedeelde state in `privacy.js` (`setAmountsHidden`/`isAmountsHidden` + nieuwe `initSkyPrivacy(container)`), haptische tik. CSS-sectie ".so-*"/".sky-*" onderaan `styles.css`; reduced-motion-guard bijgewerkt (`.so-glow`/`.so-rays` i.p.v. oude `.sky-sun`).

+19. **Hadith/Woord compacter + volgorde v144 (29 juni 2026):** op verzoek van user. Hadith- en Woord-van-de-dag staan nu **boven** het "Vandaag"-paneel (volgorde: begroeting → hadith → woord → Vandaag → quick-actions). Beide kaarten **compacter**: kleinere tekst + krappere regelafstand/marges/padding (`.hadith-arabic` .86rem, `.hadith-text` .8rem, `.woord-word` 1.05rem, `.woord-def`/`.woord-bridge`/`.woord-zin` .75–.8rem, kaart-padding 13/15px, `.daycard-head` margin 8px) — nog goed leesbaar, neemt minder verticale ruimte.

+18. **✅ "Vandaag"-paneel op dashboard v143 (29 juni 2026):** op verzoek van user — één centrale balk hoog op het beginscherm (ná de begroeting) met "de dingen die ik vandaag wil doen". Nieuw bestand `js/today-panel.js` (`mountTodayPanel(root)` → vult `<div id="today-panel-mount">`).
   - **Bundelt** taken-van-vandaag (deadline vandaag + achterstallig "te laat" + open hoge-prio zonder datum) **én** agenda-afspraken van vandaag (uit `agenda_events`), chronologisch gesorteerd (te laat → op tijd → ongedateerd, hoge prio eerst).
   - **Snel toevoegen:** één invoerveld + ＋-knop; `parseTaskInput()` (NL-parser) → taak met `dueDate` standaard vandaag, tijd optioneel ("14:00 APK" → 14:00), prio via "prio …". Schrijft naar `todos`.
   - **Afvinken van taken én afspraken:** ronde checkbox met check-pop + uitschuif-animatie + haptische tik. Taken → `done`+`completedAt`; afspraken → nieuw `done`-veld op `agenda_events` (ook zichtbaar als doorgestreept in de Week-tab, `.agenda-chip-done`). Inklapbare "▸ N afgerond vandaag"-sectie (opnieuw tikken = ongedaan).
   - **Voortgangsbalk** (afgerond/totaal) + lege staten ("Niets gepland" / "Alles afgerond ✨"). Paneel ververst alleen zichzelf (eigen mount, geen volledige dashboard-rerender → scroll blijft staan). Verving de oude "Prioriteiten"-kaart (`highTodos` verwijderd). CSS-sectie ".tp-*" onderaan `styles.css`; reduced-motion-guard uitgebreid.

+17. **🏙️ Amsterdam grachten-skyline v142 (28 juni 2026):** unieke sfeer-animatie voor het **maanddoel** in het Taxi-overzicht, op verzoek van user ("iets unieks en gaaf"). Nieuw bestand `js/canal-skyline.js` (`canalSkyline(pct, now)`) genereert een rij van 8 grachtenpanden met variërende gevels (trap-/punt-/klok-/halsgevel via clip-path/border-radius). De panden **lichten op** naarmate je je maanddoel nadert: behaald = vol in kleur met brandende ramen, nog te verdienen = donker silhouet (`litCount = round(pct/100*8)`). Dag/nacht-lucht volgt de klok (zon/maan/sterren), een bootje vaart over de gracht (`csBoat`) met een lichtje, en de panden weerspiegelen in het water (`.cs-reflection` scaleY(-1) + masker + shimmer). CSS-sectie "🏙️ Amsterdam grachten-skyline" onderaan `styles.css`; reduced-motion-guard uitgebreid.
   - **Herschikking t.o.v. v139:** elke scène nu op zijn eigen tijdschaal — **dagdoel** = de taxi-rit door Amsterdam (`incomeRoad(goalPct)`, weer terug op de inkomen-hero i.p.v. de platte balk), **maanddoel** = de oplichtende grachten-skyline. Beide scènes benut, geen dubbeling.

+16. **Qibla op dashboard + kompas herontworpen v141 (28 juni 2026):**
   - **Qibla-kaart op het dashboard** (`qiblaCard()` + `initQiblaCard()` in `js/qibla.js`, geplaatst ná de quick-actions in `dashboard.js`): premium kaart met mini-kompas-schijf, richting (bv. "126° ZO"), afstand hemelsbreed naar Mekka en "Tik om je te richten". De naald op de schijf draait naar de qibla-peiling t.o.v. noord. Locatie via `localStorage.userLocation` (fallback Amsterdam), probeert stil een verse `getCurrentPosition`. Tik → opent het volledige kompas. De Koran-subtab-knop blijft als extra ingang.
   - **Volledig kompas (`openQibla`) opgewaardeerd v3:** warmere radiale achtergrond, en een realistische "richting Mekka"-animatie bij uitlijning — lichtstraal omhoog naar de Kaäba (`#ql-beam`), uitdijende lock-ringen (`spawnLockRings`), opstijgende gouden stofdeeltjes (`spawnSparkles` → `ql-dust`), gloeiende doeldriehoek (`.ql-aligned-tri`). Alles met `prefers-reduced-motion`-guard.
   - **CSS:** sectie "🕋 QIBLA — dashboard-kaart" onderaan `styles.css` (`.qibla-card`, `.ql-card-*`). Kompas-modal-stijlen blijven in `qibla.js` (`injectStyles`).
   - **Bulk-notities-import (v138):** "Plakken"-knop in Notities (`openBulkImport`/`parseBulk`) splitst geplakte tekst op `---`/lege regel/per regel; herkent ook door iOS auto-gecorrigeerde lange streepjes (— –). Bedoeld voor iPhone-notities-migratie via een Shortcut die alle notities met `---` samenvoegt.

+15. **NS treinverkeer — meldingen + GitHub-databron v138-v147 (28-29 juni 2026):**
   - **Dashboard NS-kaart** ("NS · treinverkeer", `loadNs()`/`renderNs()` in `dashboard.js`) toont live storingen, **stakingen** en werkzaamheden. Statische PWA → directe NS-calls kunnen niet (CORS + sleutel mag niet in client).
   - **v147 — heel Noord-Holland + achtergrond-push:** uitlichten/melden verbreed van alleen Amsterdam naar **heel Noord-Holland** via regex `NH_RE` (amsterdam|haarlem|schiphol|zaandam|alkmaar|hoorn|purmerend|hilversum|den helder|… — gedupliceerd in `dashboard.js`, `notifications.js` en `scripts/send-ns-push.mjs`). **Echte achtergrond-push** (ook als app dicht): nieuw `scripts/send-ns-push.mjs` draait in de ns-disruptions-workflow ná het ophalen, leest `ns-disruptions.json`, vergelijkt met server-side `cfg.nsSeen` in de push-config gist, en stuurt via web-push (bestaande VAPID + `PUSH_GH_PAT`). Staking → voorrang. Eerste run seedt alleen. Vereist dat de gewone push al aanstaat (subscription in gist) + secrets `VAPID_PRIVATE_KEY`/`PUSH_GH_PAT`. Workflow heeft nu `actions/checkout` + `setup-node` + push-stap (overslaan als secrets ontbreken).
   - **v144 — compacte kaart + stakingen + gzip-fix:** `renderNs()` herschreven naar één samenvatting-chiprij (`.ns-chip-strike/-alert/-work`) + alleen stakingen & Amsterdam-storingen 1-regelig uitgelicht (`.ns-row`, ellipsis), rest in `<details>` ("Alle meldingen (N)"). Staking-detectie via regex `staking|stakt|werkonderbreking` over titel+situatie+oorzaak (NS heeft geen apart type; staking = DISRUPTION/CALAMITY). `checkNsDisruptions()` meldt nu een staking **overal** (niet alleen Amsterdam) met voorrang ("NS-staking — extra drukte"). Workflow-curl heeft **`--compressed`** (NS stuurt gzip → anders ongeldige JSON).
   - **v140 — GitHub als databron (vervangt Cloudflare als standaard):** user vond een eigen Cloudflare Worker te ingewikkeld. Nieuwe workflow `.github/workflows/ns-disruptions.yml` (cron `*/10`) haalt `/disruptions/v3?isActive=true` op met repo-secret **`NS_API_KEY`** en force-pusht de JSON naar de aparte **`ns-data`**-branch (altijd 1 commit, geen history-spam). App leest `https://raw.githubusercontent.com/sofyanghaddari/dashboard/ns-data/ns-disruptions.json` (raw stuurt CORS `*`) met cache-buster, in zowel `loadNs()` als `checkNsDisruptions()`. **De user hoeft enkel het secret `NS_API_KEY` toe te voegen** — geen Cloudflare, geen URL plakken. `localStorage.nsProxyUrl` blijft als optionele override (eigen proxy/Worker).
   - **Cloudflare Worker blijft beschikbaar als alternatief:** `proxy/ns-worker.js` + `proxy/README-NS-proxy.md` (NS-sleutel via apiportal.ns.nl → Worker → secret → URL in app via `nsProxyUrl`).
   - **v138 — Meldingen** (`checkNsDisruptions()` in `notifications.js`, gewired in `checkAllNotifications`): meldt een **nieuwe** storing met "Amsterdam" in de titel = kans op ritten. Dedup via `localStorage.ns_seen_ids`; eerste run seedt alleen (geen melding-explosie). App-open/foreground check (zelfde patroon als `checkWeatherAlert`), nog géén true-background push.

+14. **Amsterdam-rit banner v139 (28 juni 2026):**
   - **Taxi-weg-banner nu voor het MAANDDOEL** (Taxi-overzicht, nieuwe "Maanddoel"-kaart met `incomeRoad(monthGoalPct, now)`). De **dagelijkse** voortgang is teruggezet naar de platte balk (`.income-hero-progress`) zoals voorheen.
   - **Zwarte Mercedes C-klasse taxi** (nieuw `MERC` SVG in `income-road.js`): sedan-silhouet met metallic body-gradient, alloy-velgen (spinnen), Mercedes-ster op de grille, verlicht **daklicht** (`.ir-taxisign`) en koplamp die 's nachts gloeien.
   - **Amsterdam-vibe:** rij **grachtenpanden** met afwisselende gevels (trap/klok/punt/hals) + ramen die 's nachts twinkelen (`canalHouses()` → `.ir-canal`/`.ir-house`/`.ir-win`), een klassieke **lantaarnpaal** (`.ir-lamp`, gloeit 's nachts) en een geparkeerde **omafiets** (`.ir-bike`). Banner hoger (96px), lucht/quay-gradient dag+nacht.
   - Alles in gedeeld `js/income-road.js`; CSS in de income-road-sectie; `prefers-reduced-motion` gedekt via `.income-road *`.

+13. **Dashboard ontdubbeld v138 (28 juni 2026):**
   - **Inkomen-hero + Maandoverzicht-kaart van het dashboard verwijderd** — die stonden dubbel met het Taxi-overzicht (dat al een inkomen-hero met dagdoel + Week/Maand/Verwacht-KPI's heeft). Vandaag + Maand zijn nu samengevoegd in de kleine begroetingskaart-stats (`dagstart-stats`: Vandaag · X% / Maand · Y% / Hizb), met de privacy-toggle verplaatst naar de begroeting-top.
   - **Taxi-weg-animatie verhuisd** van dashboard naar het Taxi-overzicht (vervangt daar de platte progressbalk in de inkomen-hero). `incomeRoad()` staat nu in een gedeeld bestand `js/income-road.js` (inclusief de v136-realisme-upgrade: wolken/uitlaat/koplampbundel). `coinMeter()` (munt-meter) is verwijderd met de maand-kaart.
   - **Koran- en Arabisch-previewkaarten verwijderd** — die dupliceerden de quick-action-knoppen. De hizb-streak is nu opgenomen in de Koran quick-action-subtekst ("Vandaag ✓ · 12d streak").
   - Netto resultaat: hoofdpagina korter en minder dubbel; alle inkomensdetails leven in Taxi/Stats.

+11. **Realistische animaties v136 (28 juni 2026):** de "levende animaties" uit v134 opgewaardeerd naar het realisme-niveau van de weer-scène (`weatherScene`), op verzoek van user (referentie = iPhone Weer-app).
   - **🔥 Streak-vlam herontworpen** (`koran.js` markup + CSS): van 2 geroteerde blokjes naar een **meerlagige vlam** — gloed-halo (`sf-glow`), oranje buitentong (`sf-outer`), gele middentong (`sf-mid`), witgloeiende kern (`sf-core`) en blauwe vlambasis (`sf-base`). Elke laag flikkert organisch en asynchroon (`sfFlick1/2/3` met skew+scaleY+drift). lvl-4 = fellere kleuren + sterkere gloed.
   - **💧 Spaarpot realistischer** (CSS): glasreflectie-overlay (`.pot-glass::after`, sheen-boog + lichtvlek), opstijgende belletjes (`.pl-fill::before/::after` → `plBubble`), iets diepere vloeistof-gradient.
   - **🚕 Taxi-weg uitgebreid** (`income-road.js` markup + CSS): draaiende zonnestralen (`.ir-sun::before`, conic-mask), drijvende parallax-wolkjes (`.ir-cloud`), uitlaatpluimpjes achter de auto (`.ir-exhaust`) en een koplampbundel 's nachts (`.ir-beam`).
   - Alles puur transform/opacity; `prefers-reduced-motion`-guard uitgebreid met de nieuwe pseudo-elementen.

+10. **Vijf extra levende animaties v136 (28 juni 2026):**
   - **🌅 Dag/nacht-lucht** (`skyScene()` in `dashboard.js`): achter de begroetingskaart een subtiele hemel die het tijdstip volgt — zon + drijvende wolkjes overdag, maan + twinkelende sterren 's nachts, dauw/schemering-gradiënt. Onder een fade-mask zodat tekst leesbaar blijft.
   - **💸 Munt-meter** (`coinMeter()` in `dashboard.js`): de platte maand-progressbalk vervangen door een groeiende gouden muntenbalk met ribbel-textuur, glans-veeg en een €-muntschijf die meeschuift op `monthGoalPct`.
   - **🌙 Echte maanfase** (`moonPhaseEl()` in `koran.js`): naast de hizb-streak een exacte maanfase-schijf (synodische berekening, terminator als ellips — crescent/gibbous correct), met label "Wassende/Volle maan · X% verlicht".
   - **📊 Stats-staven glans** (`.shbc-bar::after`): na het opkomen veegt een lichtglans over de top van elke week-staaf.
   - **🗓️ Kalender vandaag-puls** (`.cal-cell.today`): de cel van vandaag in de maandkalender pulseert zacht goud.
   - Alle puur CSS transform/opacity/box-shadow, in sectie "EXTRA LEVENDE ANIMATIES", met `prefers-reduced-motion`-guard.

+9. **UI-fixes + extra animaties v135 (28 juni 2026):**
   - **⚙️ Settings-knop op licht thema:** was een donkere blob met onzichtbaar icoon (hardcoded `rgba(22,27,34,.9)` bg). `body[data-preset="daylight"] .settings-btn` override toegevoegd (lichte bg, zichtbaar icoon).
   - **Arabisch zoekbalk overlap:** `.srs-filter-bar` flex — de globale `select { width:100% }` slokte de hele flex-basis op waardoor de `.notes-search-wrap` naar 0 kromp en de zoek-input over de "Alle typen"-select heen viel. Fix: `.notes-search-wrap { flex:1 1 auto; min-width:0 }` + `select { flex:0 0 auto; width:auto; max-width:46% }`.
   - **🏅 Verdiende badge shine-sweep** (`.badge.earned .badge-emoji::after`): trage glans-veeg over verdiende medaillons.
   - **🔆 Gewoonte-strip vandaag-cel** (`.hab-day.today`): de cel van vandaag ademt met een accent-ring tot je 'm afvinkt.

+8. **Vier levende animaties v134 (28 juni 2026):**
   - **🚕 Weg naar dagdoel** (`incomeRoad()` in `dashboard.js`): de inkomen-hero progress-bar vervangen door een geanimeerd taxi-weg-tafereel. De taxi staat op `goalPct` (inkomen van vandaag ÷ dagdoel) — user vult inkomen pas later op de dag in, dus de auto schuift mee naar de finishvlag naarmate de dag vordert. Zon/maan volgt het tijdstip (dag/nacht), draaiende wielen, wapperende vlag bij 100% (`.ir-win`).
   - **🔥 Streak-vlam** (`flameLevel()` in `koran.js`): de hizb-streak toont een levende vlam i.p.v. een statisch icoon; intensiteit schaalt met de streak (`.lvl-1..4`: 1/7/30/100 dagen).
   - **💧 Spaarpot-vloeistof** (`goals.js`): potjes-icoon vervangen door een rond glas dat zich vult met golvende vloeistof op `pct` (`.pot-glass` + `.pl-fill`/`.pl-wave`, hoogte via `--pct`).
   - **🏆 Badge-unlock cinematisch** (`celebrateBadge()` in `celebrate.js`): nieuwe badge toont nu een full-screen medaillon dat indraait met shine-sweep + confetti i.p.v. een toast. Aangeroepen vanuit `dashboard.js` `checkNewBadges()`.
   - Alle vier puur CSS transform/opacity, sectie "EXTRA LEVENDE ANIMATIES" onderaan `styles.css`, met `prefers-reduced-motion`-guard.

+7. **Design-polish + emoji → line-iconen v122 (24 juni 2026):**
   - **Kompas (`js/qibla.js`)** hertekend: elegante tapered gouden naald, verfijnd Kaäba-embleem, gelaagde hub, premium ring.
   - **Tabbalk:** 9 emoji-iconen vervangen door consistente monochrome SVG line-iconen (currentColor); actieve tab in goud-accent. In `index.html`, CSS `.tab-ic`.
   - **Badges → medaillons:** ronde disc met gouden gloed + ✓-corner (CSS `.badge*`). Dubbel-keycap `5️⃣0️⃣` emoji in `achievements.js` vervangen door schone medaille.
   - **Knoppen:** primaire `.btn` subtiele sheen-gradient (color-mix met solid-fallback). **Grafieken:** gouden drop-shadow op voortgangsringen (`.sring-circle`/`.donut-seg`), zachtere heatmap.
   - **Boekhouding netter:** factuurformulier als heldere stappen met accent-icoon-koppen (Klant / Bedrag & BTW / Nummer & datum); quick-actions + alle detail-modal knoppen van emoji naar consistente line-iconen/`.btn secondary` met semantische varianten (`.bk-act-pay`/`.bk-act-del`/`.bk-act-wide`). Verzend-modal secundaire knoppen met line-iconen.
   - **Emoji-conventie (NIEUW):** géén kleurrijke pictogram-emoji meer in UI-chrome; gebruik inline SVG line-iconen (viewBox 0 0 24 24, `stroke="currentColor"`, stroke-width 1.7, round caps). Functionele monochrome glyphs (`→ ✓ ✕ ↑ ↩ ✎ ⚠`) mogen blijven — die zijn al strak. Bij nieuwe UI: line-icon, geen emoji.

+5. **Bonnetje-scanner + Geloof-tab v85 (15 juni 2026):**
   - **🕌 Geloof-tab:** Koran en Arabisch samengevoegd onder één tab met twee sub-tabs. `js/modules/geloof.js` is de wrapper; delegeert naar `renderKoran`/`renderArabic`. Sub-tab staat in `container.dataset.geloofSub`. Oude routes `koran`/`arabic` blijven geregistreerd als redirects die `geloofSub` zetten vóór navigate. `manifest.json` shortcuts en `cmdk.js` bijgewerkt.
   - **📷 Bonnetje-scanner in Boekhouding → Kosten:** Knop "📷 Bonnetje scannen" bovenaan nieuw-kosten-modal. Selecteer foto → Tesseract.js v5 laadt lazy van CDN → OCR met progress-bar → `parseReceiptText()` extraheert vendor/datum/totaal/BTW-tarief/BTW-bedrag/categorie → auto-fill formulier. Worker wordt gecacht voor hergebruik. Nieuw bestand `js/receipt-ocr.js`.
   - **CSS:** `.geloof-subnav`/`.geloof-sub-btn` voor sub-tab nav, `.rcpt-scan-*` voor scanner UI, `.bk-send-modal`/`.bk-sf-*` voor Moneybird send-modal.
   - **SW CACHE → v85**, `APP_VERSION → 'v85'`, `receipt-ocr.js` en `geloof.js` toegevoegd aan ASSETS.

+4. **Gmail OAuth popup-fix v84 (14 juni 2026):**
   - **Probleem:** iOS PWA blokkeert `window.open()` als het te ver van de user-gesture vandaan staat (na meerdere awaits). Google's OAuth-library gebruikt intern `window.open()`.
   - **Fix:** `preloadGSI()` exportfunctie in `gmail.js` — roep aan bij openen send-modal (achtergrond). In `sendViaGmail()`: `getGmailToken()` EERST aanroepen (vóór PDF-generatie), dan `generateInvoicePDF()`. Zo is de popup dicht bij de originele klik.
   - **`requestAccessToken({ prompt: '' })`** — stille re-auth als Google-sessie al actief is.
   - Verbeterde foutmelding bij popup-blokkering: "Popup geblokkeerd — zorg dat je ingelogd bent bij Google in Safari en probeer opnieuw".

+3. **Boekhouding volledig + Moneybird send-modal v83 (14 juni 2026):**
   - **BIC INGBNL2A** toegevoegd aan: PDF-betaalvak, HTML-print betaalbox, e-mail betaalinfo, clipboard herinnertekst, WhatsApp tekst. ADMINS object heeft `bic: 'INGBNL2A'`.
   - **Moneybird-stijl send-modal** (`openSendModal()`): velden Aan/CC/Onderwerp/Bericht/type, "Stuur een kopie naar mijzelf" iOS-toggle (default ON), PDF-preview chip. Enkel één "Versturen" knop — NOOIT automatisch.
   - **Zelfkopie met PDF:** kopie naar `sofyanghaddari@gmail.com` via Gmail API met PDF-bijlage (was eerder mailto zonder bijlage).
   - `OWNER_EMAIL = 'sofyanghaddari@gmail.com'` constante.

+2. **Gmail API factuur-verzending v80-v82 (13-14 juni 2026):**
   - `js/gmail.js` — lazy laadt Google Identity Services, `getGmailToken()` via OAuth2 popup, `sendInvoiceEmail()` bouwt MIME multipart bericht met PDF-bijlage (base64), `buildHtmlEmail()` genereert HTML-factuur met BIC.
   - **Bug v80:** `tokenClient.requestToken is not a function` — GSI-methode heet `requestAccessToken()`, niet `requestToken()`. Gecorrigeerd in v81.
   - Google Auth Platform: moet in "Productie" staan OF `sofyanghaddari@gmail.com` als testgebruiker toegevoegd (anders 403 access_denied).
   - `gmailClientId`/`gmailClientSecret` persistent in localStorage (niet meer sessie-only).

+1. **Boekhouding-module v78-v79 (12-13 juni 2026):**
   - Nieuw `js/modules/boekhouding.js` — volledig boekhoudprogramma: verkoopfacturen (aanmaken, PDF, HTML-print, WhatsApp), inkoopfacturen/bonnetjes, km-registratie, klantenbeheer.
   - jsPDF lazy geladen voor factuur-PDF's.
   - Nieuwe IndexedDB stores: `invoices`, `purchase_invoices`, `km_log`, `clients` → DB_VERSION bump naar 4.
   - `js/invoice-nlp.js` — NLP parser voor factuur-extractie.
   - "Kopie naar mezelf" knop (later verbeterd naar Moneybird send-modal in v83).

-4. **Dag-kaart navigatie + voorlezen + privacy-default v55 (12 juni 2026):**
   - **Hadith/Woord van de dag** hebben nu een `.daycard-head` met ‹ (vorige dag) · 🔊 (voorlezen) · › (volgende dag, disabled op vandaag) + dag-label ("Vandaag"/"Gisteren"/datum). Offsets in module-vars `_hadithOffset`/`_woordOffset` (sessie-only, reset bij reload). Arrays `HADITHS`/`WOORDEN` worden via `_HADITHS`/`_WOORDEN` aan de nav-handlers doorgegeven; index = `((dayOfYear+offset) % len + len) % len`. Generieke helpers `dayCard()`/`_dayInner()`/`bindDayWidgets()` in dashboard.js.
   - **Voorlezen (TTS)** via Web Speech `speechSynthesis` + `speakText(text, lang, btn)`: hadith Arabisch (`ar-SA`, rate 0.8), woord Nederlands (`nl-NL`, leest "woord. definitie"). Tweede tik = stoppen; `.speaking`-puls op de knop; waarschuwt als er geen Arabische stem is.
   - **Privacy omgedraaid:** bedragen zijn nu **standaard zichtbaar** bij elke app-start; pas na tik op het oogje worden ze geblurd. privacy.js gebruikt nu een globale `body.amounts-hidden`-class (geen FOUC meer, geen `.revealed` per element). Sessie-only module-var `_hidden` (default false). CSS: `.blurred-amount` blurt enkel onder `body.amounts-hidden`.

-3. **Komma-bugfix + To-do herontwerp v54 (11 juni 2026):**
   - **DE taxi-bug:** het NL-iPhone-toetsenbord typt een KOMMA ("187,50"); `type="number"`-velden maken de waarde dan stilletjes **leeg** → "Voer een geldig bedrag in" bij inkomen noteren, en in Kosten werd invoer geruisloos genegeerd. Fix: alle bedragvelden zijn nu `type="text" inputmode="decimal"` + `parseAmount()` in utils.js (komma→punt). Toegepast in taxi (dag-modal, kosten) en goals (potje +/−, potje-modal, doel-modal). **Conventie: nieuwe bedragvelden altijd zo bouwen.**
   - **Netto-bug dashboard:** eenmalige taxikosten telden in dashboard.js als vaste maandlast mee in "netto vandaag" (taxi.js sloot ze wél uit) — nu zelfde regels.
   - **To-do volledig herontworpen** (user vond het onoverzichtelijk + te veel scrollen): zie module-beschrijving. Oude `.todo-filters`/aparte tag-row/grote knoppenrij vervangen door `.todo-head`/`.quick-add-row`/`.todo-chiprow`. Bulk-toggle zit als chip in de chip-rij. Lege-staat = notes-empty-stijl ("Alles is gedaan" ✨ / "Niets binnen dit filter" 🔍).
   - **Meer animaties:** elke tab-wissel hertriggert de viewIn fade-up (router.js), tabbar-icoon popt bij activatie (`tabIconPop`), taakkaarten stagger-in, afvinken = check-pop → kaart glijdt uit vóór re-render.
   - **KPI/dagstart-bedragen wrappen niet meer** op smalle schermen (clamp + nowrap).
   - Kosten-formulier geeft nu een err-toast bij ontbrekende naam/bedrag (was stille focus).

-2. **"Stille luxe" polish-ronde v53 (11 juni 2026):**
   - **Settings in 5 tabs:** Profiel / Stijl / Doelen / Data / Systeem (`.settings-tabs` + `.settings-pane`; Systeem bestaat uit twee pane-delen die samen togglen — Beveiliging staat fysiek vóór Sync in de template). Laatst geopende tab onthouden in module-var. Versielabel = `APP_VERSION` const ('v53') in `js/components/settings.js` — mee bumpen met SW CACHE.
   - **Tel-animaties overal:** `initCountUps()` in animate.js animeert elk `[data-countup]`-element (formaat volgt fmtMoney via data-prefix/-decimals/-suffix; respecteert prefers-reduced-motion; target 0 = direct eindwaarde). Actief op Dashboard (dagkaart, inkomen-hero, maand, KPI's), Taxi (hero, KPI's, netto, kostentotaal) en Koran (streaks). Stats had al een eigen variant.
   - **Bugfixes:** dashboard 30-dagen heatmap rendert weer (ontbrekende `;` in inline-style maakte de hele background-declaratie ongeldig); `.accent-taupe` swatch-CSS toegevoegd (default-accent was onzichtbare knop in instellingen); accent-picker wrapt nu (10 swatches werden ovaal geknepen op mobiel); html-achtergrond transparant zodat overscroll/rubber-band de preset-kleur toont (custom props op body gelden niet op html); `meta[name=theme-color]` volgt nu het actieve thema via `_syncThemeColorMeta()` in theme.js (iOS-statusbalk licht in daylight).
   - **pdf.js lazy:** CDN-script weg uit index.html (was ±350KB render-blocking + gooide offline ReferenceError); `loadPdfJs()` in arabic.js laadt het pas bij PDF-import. Preconnect naar open-meteo toegevoegd.
   - **Luxe-laag CSS (sectie "STILLE LUXE" onderaan styles.css):** statische film-grain overlay op body::before (opacity .03 donker / .045 licht), diepere gelaagde bg-gradient, zachte top-sheen op .card (in de basisregel — pas op met `background:`-shorthand overrides), eenmalige sheen-sweep over .income-hero::after, goal-trajectory-lijn tekent zichzelf (`.traj-line` + `pathLength="1"`), dagstart-statvakken licht-thema-variant.
   - **Backup-export uitgebreid:** `_settings` bevat nu ook monthlyIncomeGoal/themePreset/density/userName/autoTheme/lockGraceMin + `_taxiExpenses`/`_customShame`/`_customMascot`; import zet ze terug.

-1. **Warm-neutraal kleursysteem + content/feature-ronde (juni 2026):**
   - **Kleuren:** warm-neutraal "stille luxe" palet als CSS-tokens. Gekozen aanpak: app blijft **donker** (default), met een warm-donkere basis afgeleid van het opgegeven licht-palet; één accent = **taupe** (`#8a7e6f` licht / `#bfb09a` donker). `:root` retuned (default/midnight), `body[data-theme=light]` + `daylight` preset = warm-light, oude blauwe accent-tints (`110,201,255`) globaal vervangen door taupe. Eenmalige migratie `warmAccentV1` zet accent=taupe. De automatische dag/nacht-wissel **blijft behouden** (overdag warm-light `daylight`, 's avonds warm-dark); `warmAutoFixV2` herstelt dit voor wie op de v51-build zat. Andere 15 presets ongemoeid.
   - **Token/sync:** PAT én encryptie-wachtwoord nu **persistent in localStorage** (waren sessie-only → telkens kwijt). Gist-hergebruik: `syncUp` zoekt eerst een bestaande dashboard-gist (`findExistingDashboardGistId`) i.p.v. een nieuwe te maken. **Geen** delete-knop in de UI (bewust, user ruimt zelf op via gist.github.com).
   - **Hadith van de dag:** vertalingen herzien tot getrouwe, volledige weergaven van het Arabisch (eigen vertaling, geverifieerd tegen sunnah.com), overleveraar toegevoegd ("Overgeleverd door …"), 6467-matn gecorrigeerd, mislabel 73→71 gefixt, Koranvers uit hadith-lijst gehaald.
   - **Woord van de dag:** alle definities herschreven in gewone taal.
   - **Taxikosten:** naast maandelijks/wekelijks nu ook **eenmalig** (met datum, telt mee in netto van die maand, niet in dagelijkse break-even).
   - **Gids:** `docs/BACKUP-GIDS-iPhone.md` met echte knopnamen.
0. **Premium polish-ronde (juni 2026):**
   - **Motion One** lokaal gevendord (`js/vendor/motion.min.js`) i.p.v. npm/CDN — vanilla no-build PWA moet offline blijven werken. `js/motion.js` `revealView()` doet subtiele scroll-in (fade + 12px translate, gentle stagger, één keer, alleen transform/opacity). `window.staggerIn` wijst nu hiernaar i.p.v. de CSS-staggerIn.
   - **prefers-reduced-motion** nu globaal afgehandeld (was 1 regel); luide loops getemperd (moneyGlow/heroGlow/mascotBob niet meer infinite).
   - **Bugfixes:** SW miste 5 assets (offline breuk) → toegevoegd + CACHE v49; Week `+`-knop was hover-only → leeg tijdvak nu tikbaar op mobiel; Week event-chip tekst was zwart-op-donker (onleesbaar) → licht; "virtuale"→"virtuele" typo.
   - **Notities/Week/Doelen** opgepoetst: uniforme `.page-title`, rustige `.add-tile` i.p.v. luide blauwe knop, premium empty-states (`.section-empty`, `.day-empty-hint`, icon-in-cirkel).
   - **Let op:** preview-sandbox tikt geen requestAnimationFrame → JS-animaties (Motion) renderen niet in de preview, wél in een echte browser. CSS-animaties wél zichtbaar.
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
- **Open banking** — PSD2 bureaucratie
- **Multi-device QR-sync** — GitHub-Gist sync biedt al cross-device
- **Pomodoro** — user wilde 'm uiteindelijk niet
- **Shift-tracker** — user wilde 'm uiteindelijk niet
- **Belasting-reservering** — user wilde 'm uiteindelijk niet
- **Uitgaven UI** — user wilde alleen inkomen noteren (los van Boekhouding)
- **Source-breakdown (Uber/Bolt/WhatsApp)** — user wilde simpeler

## User context

- **Soef Ghaddari** — taxi in Amsterdam, email: `sofyanghaddari@gmail.com`
- Rijdt voor Uber/Bolt/WhatsApp (oorspronkelijk per-rit getrackt, nu alleen dagelijks totaal)
- Moslim, dagelijkse hizb herhaling, kent 10 hizb tot Surah Al-Fath
- Wil Arabisch leren via Anki-bulk-import van eigen kaarten
- Bijna uitsluitend mobiel gebruiker (iPhone met Dynamic Island)
- GitHub gebruikersnaam: `sofyanghaddari`
- Voorkeur: PWA op homescreen als primair, Safari als backup-view
- Email-tip: éénmalig zichzelf de gist-ID mailen als noodgeval-backup
- **Bankrekening:** ING, BIC INGBNL2A
- **Kritische voorkeur:** NOOIT automatisch mailen zonder expliciete klik. Alles altijd bevestigd door de user.

## Hoe verder gaan

Bij nieuwe sessie:
1. **Lees deze CLAUDE.md eerst**
2. Check `git log --oneline -20` voor recente commits
3. Voor nieuwe features: check welke store/UI raakt, bump DB_VERSION als nodig, bump service-worker CACHE
4. Test in browser via `python3 -m http.server 8000` of gewoon GitHub Pages
5. Push naar main → auto-deploy
6. Werk altijd in Nederlands tegen de user
7. Respecteer dat user géén shift-tracker, pomodoro, uitgaven of belasting-features wil terug
8. **Verificeer API methode-namen zelf voor implementatie** — niet laten falen op simpele typo's (bv. `requestAccessToken()` niet `requestToken()`)

## Veelvoorkomende user-vragen

- "Worden gegevens automatisch opgeslagen?" → Ja, direct in IndexedDB + binnen 8s naar GitHub
- "Mijn site en PWA syncen niet" → 99% kans twee verschillende gists: gebruik 🔍 Vind mijn gists
- "Wat moet ik bewaren?" → Eénmalig je gist-ID emailen naar jezelf, that's it
- "Werkt het offline?" → Ja, volledig — installeer eerst op homescreen
- "Hoe regel ik backup?" → ⚙️ → GitHub-token → klaar
- "Gmail popup geblokkeerd / mislukt" → Zorg dat je bent ingelogd bij Google in Safari, dan opnieuw proberen. Als eerste keer: Google Auth Platform → Doelgroep → voeg je email toe als testgebruiker.

## Live preview server

Voor lokaal testen: `python3 -m http.server 8000` in project root.
