# Personal Dashboard — Design Spec

**Date:** 2026-06-04
**Owner:** Soef
**Status:** Approved design, ready for implementation plan

## Doel

Een persoonlijk platform (PWA) voor mobiel om dagelijks taxi-inkomen, Koran-herhaling, Arabisch leren, doelen en taken bij te houden. Alleen voor eigen gebruik.

## Niet-doelen

- Geen multi-user / auth
- Geen cloud-sync (data leeft lokaal in browser)
- Geen native app (alleen PWA)

## Architectuur

- **Type:** Progressive Web App (PWA), installeerbaar op telefoon, werkt offline
- **Stack:** Vanilla HTML + CSS + JavaScript (geen framework)
- **Opslag:** IndexedDB (alle modules), `localStorage` voor lichte settings (thema, hizb-reminder-tijd)
- **Notifications:** Browser Notifications API + Service Worker voor dagelijkse hizb-reminder
- **Hosting:** Lokaal serveren tijdens ontwikkeling (bijv. `python3 -m http.server`); later optioneel gratis te hosten (GitHub Pages / Vercel)
- **Theme:** Dark mode standaard; toggle in instellingen
- **Doeltalen UI:** Nederlands

## Navigatie

Tabbar onderin (mobiel-first): 🏠 Dashboard · 🚖 Taxi · 📖 Koran · 📚 Arabisch · 🎯 Doelen · ✅ To-do.

## Modules

### 1. Dashboard (🏠)
Snel overzicht van alle modules:
- Vandaag's taxi-inkomen + week/maand totaal
- Hizb-status (vandaag afgevinkt of niet) + huidige streak
- Top 3 prioriteit-taken
- Aantal kaarten dat vandaag te leren is in Arabisch-module

### 2. Taxi (🚖)

**Ritten**
- Velden: bedrag (verplicht), bron (Uber / Bolt / WhatsApp), km (optioneel), notitie (optioneel), datum (default: nu)
- Snelle invoer-knop "+ Nieuwe rit" prominent bovenaan

**Uitgaven**
- Velden: bedrag, categorie (Brandstof / Verzekering / Onderhoud / Overig), notitie, datum

**Overzicht**
- Totalen per week en per maand: bruto inkomen, uitgaven, netto
- Uitsplitsing per bron (Uber/Bolt/WhatsApp absoluut + %)
- Staafdiagram: netto inkomen per maand (laatste 12 maanden)
- Lijst recente ritten + uitgaven

**Export**
- CSV-export van ritten + uitgaven over te kiezen periode

### 3. Koran (📖)

- Vandaag's hizb prominent in beeld met "Afgevinkt ✓" knop
- Huidige streak (aantal dagen achter elkaar) + grafiek laatste 30 dagen
- Voortgang: 10 hizb gekend tot Surah Al-Fath (instelbaar startpunt)
- Dagelijkse reminder-notificatie op door gebruiker gekozen tijd
- Historie: kalender-view of lijst van afgevinkte dagen

### 4. Arabisch (📚) — Spaced Repetition

- Kaart toont een woord; knop "Toon antwoord" maakt vertaling zichtbaar; daarna 4 knoppen:
  - **Opnieuw** — terug in deck, vandaag opnieuw
  - **Moeilijk** — volgende review over ~1-2 dagen
  - **Bijna** — over ~4 dagen
  - **Makkelijk** — over een week of meer (interval × ease-factor)
- Algoritme: lichte variant van SM-2 (per kaart `interval`, `ease`, `repetitions`)
- Beide richtingen (NL→AR en AR→NL) — per kaart of als aparte richtingen instelbaar
- **Import:** CSV-bestand uploaden (Anki-export, tab- of komma-gescheiden). Eerste kolom = front, tweede = back, optioneel derde = notitie
- Lijst van alle kaarten met zoek/filter, handmatig bewerken/verwijderen
- "Vandaag" view toont alleen kaarten die nu due zijn

### 5. Doelen (🎯)

- Twee secties: **Lange termijn** en **Korte termijn**
- Per doel: titel, beschrijving, deadline (optioneel), voortgang (0-100% slider of subtaken-afvinkjes)

### 6. To-do (✅)

- Drie categorieën: **Prioriteit**, **Medium**, **Waiting**
- Per taak: titel, optionele notitie, datum toegevoegd
- Afvinkbaar; afgevinkte taken verdwijnen uit hoofdview (apart "Afgerond" tabblad)

## Data Model (IndexedDB)

Stores:
- `rides` — { id, date, amount, source, km?, note? }
- `expenses` — { id, date, amount, category, note? }
- `hizb_log` — { date (YYYY-MM-DD), completed: true } (één record per dag)
- `cards` — { id, front, back, note?, interval, ease, repetitions, dueDate, createdAt }
- `goals` — { id, title, description, term: 'long'|'short', deadline?, progress }
- `todos` — { id, title, note?, priority: 'high'|'medium'|'waiting', done, createdAt }

Settings in `localStorage`:
- `theme` (default: dark)
- `hizbReminderTime` (HH:MM)
- `hizbStartPoint` (default: "Surah Al-Fath, 10 hizb")

## Errorafhandeling

- Form-validatie inline (bedrag verplicht en numeriek, datum valide)
- CSV-import: rijen die niet parsen worden overgeslagen met telling ("X geïmporteerd, Y overgeslagen")
- IndexedDB-fouten: gebruiker krijgt simpele foutmelding ("Opslaan mislukt, probeer opnieuw")

## Testen

Handmatig testen op telefoon na elke module is voldoende (persoonlijke tool, geen production-load). Belangrijke flows:
- Rit toevoegen → verschijnt in totaal van die week/maand
- Hizb afvinken → streak gaat omhoog, dashboard ververst
- Kaart "Makkelijk" → due date verspringt; "Opnieuw" → komt vandaag terug
- CSV-import van Anki-bestand
- PWA installeren op telefoon, offline openen, data nog aanwezig

## Bestandsstructuur (voorlopig)

```
/index.html
/manifest.json
/service-worker.js
/css/styles.css
/js/
  app.js          — router/tabs
  db.js           — IndexedDB wrapper
  modules/
    dashboard.js
    taxi.js
    koran.js
    arabic.js
    goals.js
    todo.js
  components/     — herbruikbare UI (kaart, knop, modal)
/icons/           — PWA icons
```
