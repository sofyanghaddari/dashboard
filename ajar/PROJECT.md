# AJAR — Projectdossier

> **Lees dit eerst** bij elke nieuwe sessie over de AJAR-website. Dit is het geheugen-document:
> wat is er gebouwd, waarom, welke keuzes zijn gemaakt, wat moet nog gebeuren, en wie zijn de
> concurrenten. Werktaal met Soef = **Nederlands**.

Live: **https://sofyanghaddari.github.io/dashboard/ajar/**
Broncode: map `ajar/` in repo `sofyanghaddari/dashboard` · branch `claude/ajar-b2b-website-txirto` → merge naar `main`

---

## 1. Wat is AJAR en wat is het doel?

**AJAR** is het merk waaronder Soef Ghaddari **extra vierge olijfolie uit Marokko** naar Nederland
importeert. De olie komt van het **familiebedrijf ConservAjar SARL** in **Taourirt** (oost-Marokko),
opgericht begin jaren '90 onder de naam MOUSTAINE.

**De site is bewust GEEN webshop.** Het is een **B2B-vertrouwens- en lead-site**: horeca,
delicatessenzaken, speciaalzaken en kleine retailers overtuigen om een **gratis sample** of
**offerte** aan te vragen. Doel = leads, geen directe verkoop.

**Doelgroep:** Nederlandse zakelijke afnemers (horeca/foodservice/speciaalzaak) die nog niet weten
of ze met AJAR in zee willen en dat besluit op de site baseren.

**Toon:** "stille luxe" — rustig, professioneel, eerlijk. Crème / olijfgroen / goud. Fonts Fraunces
(serif, koppen) + Inter (tekst). Mobile-first (Soef is bijna uitsluitend mobiel).

---

## 2. Onze aanpak & harde principes

Deze principes zijn tijdens het hele project leidend geweest — **respecteer ze**:

1. **Nooit productclaims verzinnen.** Geen smaakprofiel, zuurgraad, polyfenol-getallen, prijzen,
   awards of testimonials die Soef niet heeft aangeleverd. Ontbrekende data toont de site netjes
   als *"volgt"* (cursief goud) of als een gouden line-icon-placeholder — **niet** als verzonnen feit.
   Dit is de belangrijkste regel. Liever een gat dan een leugen op een vertrouwens-site.
2. **Persoonsnaam blijft van de site af.** Alleen het merk "AJAR" + het wettelijk verplichte
   importeursadres (Jephtastraat 28H, 1055 JV Amsterdam) staan er. Geen "S. Ghaddari" als gezicht.
   **Let op (correctie 5 juli 2026, v6b):** "MOUSTAINE" is géén oude bedrijfs-/merknaam — het is de
   achternaam van Soefs opa. Eerdere sessies (t/m v6) namen abusievelijk aan dat de fabriek ooit
   onder die naam handelde en zetten 'm meermaals op de site (producer.note, het "Van MOUSTAINE
   naar AJAR"-blok, de tijdlijn). Dat was dus een schending van déze regel en is in v6b overal
   verwijderd/herschreven. Kom hier niet op terug — noem nooit meer "MOUSTAINE" op de site.
3. **Nooit automatisch mailen.** Formulieren gaan via Formspree of vallen terug op WhatsApp/mailto —
   altijd na expliciete klik van de bezoeker.
4. **Eén bron van waarheid:** alle teksten/config in `js/content.js`. Pagina's renderen zichzelf
   daaruit via `js/main.js`. Nooit tekst hardcoden in de HTML-shells.
5. **Alles met `prefers-reduced-motion`-guard.** Animaties zijn subtiel en uitschakelbaar.
6. **AVG:** GA4 laadt pas ná cookie-toestemming; EXIF uit foto's gestript; privacy-pagina `noindex`.
7. **Eerlijk over de status.** Placeholders zijn zichtbaar als placeholder, niet gecamoufleerd.
8. **Alles vanuit de zakelijke klant — geen decoratie zonder functie (v13, 12 juli 2026).**
   Elke toevoeging moet de vraag doorstaan: *"wat heeft een inkoper/horeca-eigenaar hieraan?"*
   Concreet: (a) **geen zelfgetekende natuur-illustraties** (olijftakken, blaadjes-ornamenten) —
   naast échte fabrieksfoto's oogt elke handgetekende SVG-tak amateuristisch, hoe netjes ook
   (Soef wees dit tweemaal af: de krabbel én de hertekende versie). **Uitzondering (v16):** de
   realistische gekleurde olijftak-boog in de CTA-band is door Soef expliciet gekozen uit zes
   voorgelegde varianten — die blijft; (b) **geen puur decoratieve
   lijnen/golven** tussen secties (de "olie-scheidingslijn" las als storende gouden streep);
   (c) sier-elementen die wél mogen: typografie op bestaande content (initialen, Nº-nummering,
   colofon) — die dragen informatie-hiërarchie. Twijfel je → weglaten en iets nuttigs bouwen
   (zoals de `ctaFacts`-zekerhedenrij).

---

## 3. Techniek & architectuur

- **Vanilla HTML/CSS/JS, geen build.** GitHub Pages, deploy door naar `main` te pushen.
- **`ajar/js/content.js`** — alle copy + config (`gaId`, `formspreeId`, `email`, `whatsappNumber`,
  `kvk`, `domain`, `showPartners`, PDF-paden). Enige plek om tekst te wijzigen.
- **`ajar/js/main.js`** — renderers per pagina (`renderHome/About/Product/B2b/Contact/Privacy/Sample`),
  header (topbar + fullscreen mobiel menu), footer, formulieren (`submitLead` met Formspree →
  WhatsApp/mailto-fallback + honeypot `_gotcha`), cookiebanner+GA, JSON-LD, `initReveal`,
  `initCountUp`, `initFaq`, `initEnhancements` (scroll-progress, back-to-top, page-transition,
  blur-up). `imgSlot()` = lazy foto met `.imgok`-fade + icon-fallback bij ontbreken.
- **`ajar/css/style.css`** — volledige styling incl. Ken-Burns hero, blur-up, form-focus, reduced-motion.
- **HTML-shells** (`index/over-ons/product/zakelijk/contact/sample/privacy.html`) — dun; `data-page`
  stuurt de rendering.
- **Assets:** `assets/logo/` (favicon-set, og-image, header-SVG, wordmark-SVG),
  `assets/images/` (foto's), gegenereerde PDF's (`ajar-specsheet.pdf`, `ajar-presentatie.pdf`).
- **PDF's** worden uit `content.js` gegenereerd via `tools/specsheet.html` en `tools/presentatie.html`
  (in browser → afdrukken → bewaar als PDF, A4, achtergronden aan).
- **Service worker (dashboard `service-worker.js`):** negeert **alle** `/ajar/`-paden (early return).
  → **Ajar-wijzigingen vereisen GÉÉN cache-bump.** Alleen dashboard-wijzigingen bumpen de CACHE.
  Lessen: v164 cachet alleen `resp.ok` (anders blijven 404's hangen), v165 bypasst `/ajar/` volledig.
- **Deploy-hobbels:** GitHub Pages hikte een paar keer ("deployment_queued"/"try again later").
  Bij een 404 ná een push eerst de Pages-run checken (mcp__github__actions_*) vóór in de code te zoeken;
  een lege commit forceert een nieuwe deploy.

---

### v27 — Mega-audit + design-verfijning: hele site nagelopen, 3 échte bugs gefixt (17 juli 2026)

Vervolg op v26, opdracht Soef: "mega update, controleer ALLES grondig — elke pagina, elke animatie,
elke functie, ook wat ik vergeten ben". Volledige audit (interacties, EN/FR, code, visueel, print,
reduced-motion) + een design-verfijningslaag. Alle bevindingen gefixt en hertest.

**Drie échte bugs gevonden en gefixt:**
1. **Fotostapel bevroor permanent na één tik** (over-ons): de klik-handler doet `advance(); stop();
   start()`, maar `stop()` clearde óók de `leaveTimer` die `advance()` net gezet had → de bovenste
   foto bleef onzichtbaar (`stack-leaving`) hangen, `busy` bleef eeuwig `true`, en tik/dots/auto-
   rotatie deden daarna niets meer. Fix: `stop()` cleart alleen nog de auto-rotatie; een lopende
   wissel (480ms) maakt altijd af. Getest: tikken, dots, auto-rotatie — alles wisselt weer.
2. **Herkomstkaart bevroor na tab-wissel** (product): `visibilitychange` stopte de marker maar
   startte nooit opnieuw (de IntersectionObserver vuurt niet opnieuw als de kaart al in beeld
   staat). Fix: bij terugkeer naar het tabblad weer starten als de kaart in de viewport staat.
3. **Reveal-elementen konden permanent onzichtbaar blijven bij snelle scroll-sprongen**
   (momentum-veeg, anker-link): de observer kan een element tussen twee checks overslaan. Fix:
   na-ijl-veegcheck op scroll (200ms debounce) die alles onthult dat inmiddels in beeld staat.
   Getest met 1800px-sprongen over alle 9 pagina's: geen enkel element blijft meer hangen.

**Design-verfijning (CSS-sectie "✨ DESIGN-VERFIJNING v27"):**
- Typografisch materiaal: goudgetinte `::selection` (aparte variant op donkere vlakken),
  `text-wrap: pretty`, `tabular-nums` op tellende cijfers (geen breedte-jitter).
- Foto-afwerking: hairline-ring + subtiele toplicht-lijn op elke foto (op de bestaande sheen-laag,
  geen extra element) — gedrukte-editorial gevoel.
- Tekstlinks: geveegde goud-onderstreping (vaste lichte lijn; hover vult een gold-ink-lijn van
  links) i.p.v. statische border.
- Primaire knop: olijf-materiaal-gradient in dezelfde taal als de CTA-band (de gouden band-knop
  wint op specificiteit en blijft goud) + iets meer letterspacing.
- Partnerlogo's: grayscale kleurt in bij hover.
- **Goudstof in de CTA-band**: zeven trage deeltjes stijgen op ("stof in avondlicht"), per stuk
  eigen baan/tempo via nth-child; alleen `animation-play-state` toggelt op `.in` zodat de
  nth-child-tempo's blijven gelden. Reduced-motion: display none.
- **Hover/touch-prefetch** (`initPrefetch`): interne pagina's laden vóór de klik → navigatie voelt
  instant. Zelfde link-filter als de fade-navigatie; slaat over bij Data Saver.
- Subpagina-hero's: subregel + knoppen komen ná de gemaskerde titel op (zelfde choreografie-taal
  als de home-hero) — met print- en reduced-motion-vangnetten.

**Audit-resultaten (alles groen):**
- Interacties: mobiel menu + sub-accordeons, fotostapel (tik/dots/auto), FAQ open/dicht,
  lightbox (open/pijlen/Escape, lazy-load-activatie klopt), mobiele carrousels (reveal-groep +
  swipe + dots), footer-accordeon, formulieren (contact 3 verplichte velden, sample incl. KvK-veld
  + voortgangsbalk vult), copy-knoppen, to-top, anchor-flash, desktop-dropdown + cascade,
  nav-underline, custom cursor, magnetische knoppen, taalwissel NL→EN→FR→NL.
- EN/FR: sleutel-diff NL/EN/FR — vertalingen compleet (de 39 "ontbrekende" sleutels zijn bewust
  taalonafhankelijk: config/URL's/afbeeldingen); alle 9 pagina's × 2 talen × 2 breedtes zonder
  fouten/overflow.
- Count-up heeft momenteel géén live gebruik (kwaliteitscijfers staan nog op "Volgt" — content-todo
  van Soef, geen codefout).
- Volledige-pagina-screenshots van alle 9 pagina's op 375px + 1440px visueel gecontroleerd.
- Officiële CI-smoke-test (ajar/tools/smoke-test.mjs, 10 pagina's incl. 404) lokaal groen.

---

### v26 — Animatie-regie: chique kwaliteitsronde over het hele bewegingssysteem (17 juli 2026)

Opdracht van Soef: "maak de kwaliteit van alle animaties netter, chiquer, cooler — grote upgrade,
kijk als professionele designer van een miljoenen-B2B-site". Geen nieuwe effecten-hagel, maar
**regie en verfijning** bovenop de bestaande lagen (v8/v9/luxe-laag). Alles in één nieuwe
CSS-sectie "✨ ANIMATIE-REGIE v26" onderaan `style.css` (vóór het print-blok) + twee JS-verfijningen.

- **Eén dure easing-taal:** nieuwe tokens `--ease-out` (expo-out, `cubic-bezier(.16,1,.3,1)`) en
  `--ease-io`. Reveals, titel-maskers en foto-wipes landen nu tergend zacht i.p.v. de kortere v8-curve.
- **Auto-stagger in `initReveal`:** elementen die in dezelfde observer-batch binnenkomen (drie kaarten
  naast elkaar, de hele eerste viewport) krijgen een oplopende inline delay (70ms/stuk, max 420ms) die
  ná de entree weer wordt weggehaald (anders vertraagt hij hover-overgangen). Secties komen nu als
  gedirigeerde cascade op i.p.v. tegelijk te ploppen.
- **Hero- en CTA-choreografie:** kicker → titel → subregel → knoppen komen ná elkaar op (child-stagger
  in CSS; de container beweegt zelf niet meer). Zelfde cascade in de CTA-band; de olijftak houdt z'n
  eigen teken-entree (expliciete override, anders dubbel geschoven).
- **Goudglans dóór de CTA-titel:** éénmalige lichtveeg door de letters via `background-clip: text`
  (achter een `@supports`-guard; print-safe want print verbergt `.cta-band` al volledig).
- **Mobiel-carrousel-reveal-fix (échte bug):** kaarten in `.mcar`-carrousels lagen horizontaal buiten
  beeld en kwamen vroeger pas bij het swipen op (oogde als hapering). Nu onthult de hele rij zich als
  cascade zodra de carrousel in beeld schuift. In een `setTimeout(0)` — `.mcar` wordt pas ná
  `initReveal` gezet (bootvolgorde).
- **Fotostapel met échte diepte:** onderliggende kaarten iets kleiner + donkerder (`scale`/`brightness`
  per `data-pos`), wissel landt op de expo-curve, wegglijden versnelt juist (`--ease-io`).
- **Menu-choreografie:** desktop-dropdownitems druppelen na elkaar binnen (45ms/stuk); het mobiele
  volscherm-menu laat de grote serif-items als cascade omhoog glijden (`navItemIn`, 50ms/stuk).
- **Verfijnde hovers:** editorial foto-zoom (3,5% over 1,4s) op split/spec-foto's (desktop),
  kaart-goudlijn groeit 34→52px + rand warmt op, kwaliteitstegels liften + goudstreepje tekent zich
  onder het cijfer bij reveal.
- **Klein maar voelbaar:** marquee pauzeert op hover (lezen), scroll-voortgangslijn kreeg een gloeiende
  punt, pagina-overgangen (View Transitions) zijn nu een gebaar (oud wijkt omhoog, nieuw landt van
  onder), footer daagt op via scroll-driven `animation-timeline: view()` (progressive enhancement,
  geen JS), count-up-cijfers op expo-out met 1,5s.
- **Reduced-motion:** eigen uitzet-blok ONDERAAN de v26-sectie — bewust ná alle nieuwe regels, want die
  zouden anders het oudere reduced-blok halverwege het bestand overrulen (cascade-les!).
- **Getest** (headless Chromium, 375px + 1440px, alle 7 pagina's): alle reveals triggeren, geen
  horizontale overflow, geen JS-fouten, reduced-motion toont alles direct, inline delays worden
  opgeruimd. Screenshots van hero/CTA/menu visueel gecontroleerd.

---

### v25 — SIAL Paris 2024 op de tijdlijn + VIES-adrescontrole + toegankelijkheidsaudit (13 juli 2026)

Drie dingen in één ronde ("doe alles wat jij kan doen").

- **SIAL Paris 2024 in de tijdlijn (Over ons).** Soef leverde een kaartscreenshot (Paris Nord
  Villepinte) + datum 23 oktober 2024. Geverifieerd via websearch: **SIAL Paris 2024 = 19–23
  oktober 2024, Paris Nord Villepinte** — 's werelds grootste voedingsvakbeurs. Dat past exact, dus
  een tijdlijn-item "Oktober 2024 · AJAR op SIAL Paris" toegevoegd (vóór het 2026-item) in NL/EN/FR.
  Sterk, verifieerbaar B2B-vertrouwenssignaal. De maps-screenshot + het genoemde filmpje zijn niet
  bruikbaar als site-beeld (screenshot = kaart-UI met een minuscule productthumbnail; video = zwaar
  + aparte hosting-beslissing) — een echte standfoto kan er later bij.
- **VIES-adrescontrole afgemaakt.** De Worker gaf het geregistreerde adres al terug; de front-end
  zet het nu in de sample-lead (`geregistreerdAdres`) náást het ingetikte bezorgadres, zodat je in
  één oogopslag ziet of iemand naar een ánder adres laat sturen (anti-fraude — nog een oogtoets, geen
  harde blokkade; adresnotatie verschilt te veel om automatisch te matchen). `registeredAddress`-label
  toegevoegd (fallback, EN/FR erven NL).
- **Toegankelijkheidsaudit (axe-core) + fixes.** Alle 9 pagina's × 3 talen gescand, in normale én
  reduced-motion-staat. Gevonden en gefixt:
  - *link-in-text-block* (serious): de "Privacyverklaring"-link in `.form-note` leunde alleen op
    kleur → onderstreping toegevoegd (`.form-note a`).
  - *region* (alle pagina's): de promo-topbar viel buiten alle landmarks → in een
    `<aside aria-label>` gewikkeld (scrolt nog steeds mee weg zoals voorheen).
  - *heading-order* (contact + sample): h1→h3-sprong → onzichtbare `<h2 class="sr-only">`
    sectiekoppen toegevoegd (+ nieuwe `.sr-only`-helper).
  - *color-contrast* (serious): de flauwe gouden stapnummers (`.process-num`, ~2:1), de
    actieve-stap-highlight, de "volgt"-cert-badge, het cursieve "formaat volgt"-label en twee labels
    op de fles-mockup zaten onder de norm → allemaal naar `--gold-ink`/donkerder gebracht zodat ze
    3:1 (grote tekst) resp. 4.5:1 (kleine tekst) halen, met behoud van de gouden toon. **Eén bewuste
    non-fix:** een hero-sub-melding bleek een axe-timingartefact (scan mídden in de fade-in-reveal);
    in ruststand haalt `--ink-soft` op crème ~6.5:1 — dus terecht niet aangepast.
  - Eindresultaat: **nul axe-violations** op alle pagina's/talen, beide bewegingsstaten.

Geverifieerd: front-end sample-test 30/30 (incl. dat het geregistreerde adres in de lead komt),
axe-audit volledig schoon, tijdlijn toont SIAL correct tussen ISO en 2026, stapnummers visueel
gecontroleerd (leesbaar goud, ontwerp intact), volledige smoke-test groen.

---

### v24 — Automatische sample-verificatie via VIES (fase 2, gratis) (13 juli 2026)

Fase 2 van het sample-verificatieplan, gebouwd nadat Soef koos voor de **gratis** route ("ik wil
alleen gratis"). Onderzocht: de KvK-API kost ~€6,40/mnd, **VIES** (BTW-validatie van de Europese
Commissie) is volledig gratis en geeft voor NL óók naam + adres terug. Correctie op een eerdere
bewering van mij: VIES gééft voor NL wél het adres (eerder ten onrechte gezegd van niet). Dus:
verificatie via **BTW-nummer + VIES**, dedup op het BTW-nummer.

- **Cloudflare Worker** `proxy/sample-verify-worker.js` (+ deploygids `README-sample-verify-worker.md`
  + unit-test `test-sample-verify-worker.mjs`, 15 checks, mockt VIES/KV). Eén POST-endpoint:
  normaliseert een NL-BTW-nummer (soepel op notatie, streng op `\d{9}B\d{2}`), valideert live bij
  VIES, en dedupt in **Cloudflare KV**. Antwoordt met één status: `verified` (+ naam/adres) /
  `invalid` / `duplicate` / `unavailable`. **Nooit gokken:** bij een onbekende VIES-respons of
  fout → `unavailable` (niet fout-positief goedkeuren of fout-negatief weigeren). **AVG:** in KV
  komt alléén een **SHA-256-hash** van het BTW-nummer + datum — niet het nummer zelf, niet de
  VIES-naam/-adres. Origin-allowlist + daglimiet (default 300) als vangnet. Zonder KV gebonden:
  verifieert nog wél, dedupt niet (fail-open, met `warning`).
- **Formulier-koppeling, uit-by-default:** nieuw `config.sampleVerifyUrl` (leeg = niets verandert,
  formulier werkt als voorheen). Zodra de Worker-URL is ingevuld, controleert het sample-formulier
  elke aanvraag: geldig+nieuw → door (met de VIES-bedrijfsnaam in de lead), ongeldig/duplicaat →
  nette foutmelding + géén verzending, **VIES onbereikbaar → tóch door** naar Formspree met een
  "handmatig controleren"-notitie (nooit een echte lead verliezen door VIES-downtime).
- **Sample-formulier gewijzigd:** het **BTW-nummer** is nu het verplichte, gevalideerde veld;
  het **KvK-nummer uit v23 is optioneel** geworden (VIES kan geen KvK checken, maar handig voor
  de eigen administratie). Client-side dezelfde BTW-normalisatie als de Worker. Voorwaarden
  (artikel 8) + privacyverklaring (welke gegevens / wie verwerken) in NL/EN/FR bijgewerkt: BTW
  i.p.v. KvK als verificatiemiddel, VIES als verwerker, en de hash-only-opslag expliciet benoemd.
- **CSP:** `https://*.workers.dev` toegevoegd aan `connect-src` op alle 9 pagina's, zodat de
  fetch naar de Worker mag zodra de URL gezet is. Custom-domein-Worker → dat domein zelf toevoegen
  (staat in de deploygids). Inert zolang `sampleVerifyUrl` leeg is.

**Deploystappen liggen bij Soef** (eenmalig, gratis): Worker plakken bij Cloudflare, KV-namespace
`ajar-samples` binden als `SAMPLES`, testen met `dryRun`, en de URL in `content.js` zetten. Alles
staat in `proxy/README-sample-verify-worker.md`.

**Nog buiten scope (fase 3, betaald):** automatisch verzendlabel printen (Sendcloud/PostNL) — deze
Worker doet alleen verifiëren + dedup.

Geverifieerd: Worker-unit-test 15/15 (verified/invalid/duplicate/unavailable/format/dedup/hash-only/
dryRun/origin) met mock-VIES; front-end 29/29 in headless Chromium met een gemockte workers.dev-
Worker + gemockte Formspree — alle vier de statussen correct afgehandeld, KvK optioneel, geen-URL-
pad gedraagt zich als voorheen, ongeldig BTW-formaat blokkeert lokaal zonder VIES-call, nul
CSP-violations; volledige smoke-test groen.

---

### v23 — KvK-nummer verplicht bij sample-aanvraag (fase 1 van sample-verificatie) (13 juli 2026)

Soef wil op termijn de gratis-sample-afhandeling **automatiseren** (verzendlabel printen zonder
zelf te checken wie de aanvrager is), maar dan moet wél vaststaan dat (a) de aanvrager een écht
bedrijf is en (b) datzelfde bedrijf niet al een fles heeft gehad. Uitgebreid met hem besproken;
het **KvK-nummer** is de sleutel die beide eisen tegelijk oplost (uniek per bedrijf → geschikt als
"is dit een bedrijf?"-check én als dedup-sleutel voor één-sample-per-bedrijf). De volledige
automatisering (validatie + dedup + label) vereist een backend (Cloudflare Worker + opslag, zoals
de NS-proxy/grammatica-worker) en is bewust **nog niet gebouwd** — dit is fase 1: de data-invoer
en de spelregel goed neerzetten, zodat de latere automatisering erop kan bouwen.

- **KvK-nummer verplicht veld** op het sample-formulier (`sample.html`), full-width tussen de
  contactgegevens en het bezorgadres. `type="text" inputmode="numeric"` (projectconventie — nooit
  `type=number`), placeholder legt uit waarom ("8 cijfers — verplicht voor zakelijke afnemers").
  Validatie: notatie-soepel, inhoud-streng — punten/spaties worden gestript en dan geldt een
  harde lengte-check op 8 cijfers; het genormaliseerde nummer (bijv. `7775 5170` → `77755170`)
  gaat mee in de Formspree-inzending, zodat je later schoon op KvK-nummer kunt dedupliceren.
- **"Één gratis sample per bedrijf" expliciet in de voorwaarden** (artikel 8, 3 talen): was al
  "één per zaak", nu aangescherpt naar "één gratis sample per bedrijf" + de zin dat we daarvoor
  bij een sample-aanvraag het KvK-nummer vragen. De **"alleen verzenden naar het bij de KvK
  geregistreerde adres"**-regel is bewust NOG NIET in de voorwaarden gezet — dat is een
  fase-2-controle die pas operationeel wordt met de automatisering; een niet-gehandhaafde regel in
  de voorwaarden zetten zou oneerlijk zijn.
- **Privacyverklaring bijgewerkt** (3 talen): KvK-nummer toegevoegd aan de opsomming van welke
  formuliergegevens we ontvangen (met "bij een sample-aanvraag"), zodat de verklaring blijft
  kloppen met wat het formulier nu uitvraagt.
- Vertaalsleutels `kvkLabel`/`kvkPlaceholder` (sample.form) en `kvk` (ui.lbl, voor het
  WhatsApp-/e-mailbericht) in NL/EN/FR; `errSample` in 3 talen aangevuld met het KvK-vereiste.

**Nog te beslissen door Soef (fase 2, backend):** verificatiebron — **BTW-nummer via VIES**
(gratis EU-dienst) óf de **KvK API** (levert ook het officiële adres, maar pricing/free-tier moet
ik nog uitzoeken — geen bedragen gegokt). Daarna pas: Worker + KV/D1 voor dedup + Sendcloud/PostNL
voor labels.

Geverifieerd: KvK-veld in NL/EN/FR met correcte labels/placeholders; lege én te-korte invoer
worden geweigerd met de juiste gelokaliseerde foutmelding; een geldig nummer mét opmaak
("7775 5170") wordt genormaliseerd naar 8 cijfers en komt zo (zonder spatie) in de
Formspree-POST; volledige smoke-test groen.

---

### v22 — Vier kleine B2B-vertrouwenssignalen + externe vindbaarheid (13 juli 2026)

Vervolg op een "wat kunnen we nog verbeteren voor een zakelijke klant"-ronde; Soef koos 1/2/3/4
("in het klein en kort") + 8/9 uit die lijst, en bevestigde beursaanwezigheid (Parijs e.a.) voor
punt 10 — details daarvoor nog navragen, niet gebouwd om geen feiten te verzinnen.

- **Reactietijd + stappenplan samengevoegd** tot één compacte regel onder de "Verstuur
  aanvraag"-knop (`c.nextSteps` in content.js): "Zo gaat het verder: Aanvraag bij de importeur
  zelf → Reactie, meestal dezelfde werkdag → Sample of offerte volgt." Bewust geen concreet
  aantal uren verzonnen (geen SLA die niet hard te maken is) — "meestal dezelfde werkdag" is een
  realistische belofte voor WhatsApp-first, één-op-één contact. Hergebruikt de bestaande
  `.form-note`-stijl, geen nieuwe CSS nodig.
- **Referentie/PO-nummer-veld** (optioneel) in het offerteformulier — sommige inkoopafdelingen
  moeten intern al een ordernummer meesturen; komt nu automatisch mee in het WhatsApp-/
  e-mailbericht i.p.v. achteraf nagestuurd te moeten worden.
- **KvK-nummer klikbaar** naar het officiële, openbare Handelsregister (`kvk.nl/zoeken/`) — een
  inkoper kan nu in twee klikken verifiëren dat het bedrijf echt bestaat i.p.v. alleen platte
  tekst te vertrouwen. Bewust géén diepe deeplink met kvknummer-queryparameter gebruikt: kon de
  exacte werkende URL-vorm niet verifiëren (kvk.nl en openkvk.nl blokkeerden de fetch-poging),
  en een gegokte/kapotte link op een vertrouwens-pagina is erger dan geen link. De algemene
  zoekpagina is wél bevestigd bereikbaar.
- **Vindbaarheid buiten de site:** twee nieuwe README-secties (geen code, Soef moet de accounts
  zelf aanmaken) — een Google Bedrijfsprofiel-stappenplan (weegt voor een lokale B2B-leverancier
  vaak zwaarder dan de site zelf: reviews, "olijfolie leverancier Amsterdam"-vindbaarheid) en een
  LinkedIn-bedrijfspagina-stappenplan, met een verwijzing naar het al bestaande `socials`-array
  in content.js zodra de LinkedIn-URL er is.

Geverifieerd: smoke-test groen op alle 10 pagina's; PO-veld/KvK-link/stappenplan-tekst met
Playwright gecontroleerd (inclusief dat het referentienummer daadwerkelijk in de Formspree-POST
terechtkomt); KvK-link computed style gecontroleerd (was onzichtbaar als link tussen platte tekst
— alsnog een underline toegevoegd).

---

### v21 — GoatCounter i.p.v. GA4, foto's als WebP, CI-smoke-test, monitoring (13 juli 2026)

Op verzoek van Soef ("doe alles wat handig is") na een ronde algemene-verbetersuggesties. Vier
dingen gebouwd:

- **Analytics: Google Analytics 4 → GoatCounter.** GA4 stond toch nog leeg (`gaId: ''`, nooit
  ingevuld) en vereiste een cookiebanner; GoatCounter is gratis, plaatst geen cookies en verzamelt
  geen persoonsgegevens (de bezoekersteller draait server-side op een dagelijks geroteerde
  IP+UA-hash, niets op het apparaat van de bezoeker) — dus **de cookiebanner is volledig
  verwijderd**, niet alleen verborgen (CSS/JS/content voor `.cookie-banner`, `initConsent()`,
  `CONSENT_KEY`, de footer-"Cookie-voorkeuren"-knop en de bijbehorende content-sleutels
  weggehaald). Nieuw config-veld `goatcounterCode` in `content.js` (leeg = niets geladen, zelfde
  patroon als `gaId` had). `gaEvent()`/`loadGA()` blijven qua functienaam bestaan (25+
  `data-ga-event`-attributen verspreid over main.js verwijzen ernaar) maar sturen nu naar
  GoatCounter's event-API i.p.v. gtag — zie de code-comment bij de definitie. CSP `script-src`/
  `connect-src` bijgewerkt naar `gc.zgo.at`/`*.goatcounter.com`. **Privacyverklaring herschreven**
  in alle 3 talen (NL/EN/FR): de cookies-sectie legt nu uit dat er geen enkele trackingcookie
  meer geplaatst wordt, en dat de enige lokale opslag functioneel is (taalkeuze +
  formulier-geheugen uit v19, blijft op het apparaat). README + LANCERING-CHECKLIST.md
  bijgewerkt.
- **Foto's: WebP met JPG-fallback.** `imgSlot()`/`processMedia()` laden nu eerst
  `assets/images/NAAM.webp`; faalt die (bv. een net toegevoegde foto zonder webp-versie), dan
  schakelt de al-bestaande foutafhandeling (`wireImgSlots()`, v20) automatisch over op de
  `.jpg` — geen `<picture>/<source>` nodig (die kiest vóór het laden op MIME-support, niet op of
  het bestand echt bestaat, en zou dus een 404'ende webp nooit naar jpg terugvallen). Alle 15
  daadwerkelijk gebruikte foto's kregen een `.webp`-versie (Pillow, kwaliteit 78, één uitzondering
  op 65 voor een korrelige foto die anders groter uitpakte dan het jpg-origineel); drie foto's die
  extreem groot waren zijn ook teruggeschaald naar max 1600px lange zijde vóór het webp'en.
  **Correctie tijdens het werk:** in een eerste, te haastige pas had ik ook `hero-01.jpg`,
  `story-02.jpg` en `stock-hero-orchard.jpg` verkleind — bleken bij nader inzien drie bewust
  losgekoppelde "wees-bestanden" te zijn (nul keer gerefereerd in `content.js`, expliciet
  gedocumenteerd in LANCERING-CHECKLIST.md C4 als "bewaren-of-weg, Soefs keuze"). Teruggezet naar
  hun originele, ongewijzigde bytes — geen enkele diff op die drie bestanden in de commit. Les:
  bestandsgrootte op disk zegt niets over paginagewicht als een bestand nergens gerefereerd wordt;
  altijd eerst controleren of iets daadwerkelijk geladen wordt vóórdat je het "optimaliseert".
  Netto resultaat op de 15 échte site-foto's: ~8,4 MB aan JPG → ~3,2 MB aan WebP wat browsers nu
  daadwerkelijk laden.
- **CI-smoke-test.** Nieuw `.github/workflows/ajar-smoke-test.yml` (push naar main + PR's die
  `ajar/`/`404.html` raken) draait `ajar/tools/smoke-test.mjs`: laadt alle 9 pagina's + de
  gedeelde 404.html headless onder een `/dashboard/`-subpath-mirror (zelfde layout als GitHub
  Pages — anders 404'en de absolute `/dashboard/...`-paden in `404.html` in een lokale test),
  scrollt om lazy-loaded foto's te forceren, en faalt op: JS-console-fouten, CSP-violations, een
  HTTP-fout op wat dan ook behalve de bekende webp→jpg-fallbackketen voor nog-ontbrekende foto's,
  een foto-slot dat noch de foto noch de placeholder-staat bereikt, of een offerteformulier
  waarvan de client-side validatie of de tijdvak-chips (v19) kapot zijn. Getest op zowel het
  groene pad als een opzettelijk kapotgemaakte CSS-link (ving de fout correct af) vóórdat het de
  repo in ging. Er is geen build-stap voor deze site, dus dit is het enige vangnet vóór een
  vergissing live staat.
- **Uptime-monitoring + domein-CSP-notitie in README.** Stappenplan voor een gratis UptimeRobot-
  monitor (README, geen code — vereist een account dat ik niet voor Soef kan aanmaken) + een regel
  bij de bestaande domein-koppel-sectie dat de CSP (v20) bij een domeinwissel niet aangepast hoeft
  te worden (gebruikt overal `'self'`, geen hardcoded domeinnaam).

Geverifieerd: smoke-test lokaal groen op alle 10 pagina's (met een subpath-mirror-server die de
GitHub Pages-layout nabootst) én bewezen dat hij een echte breuk (verwijderde CSS-link) correct
laat falen; alle 15 geoptimaliseerde foto's handmatig gecontroleerd op zowel de webp-laadpad als
de jpg-fallback; privacyverklaring in 3 talen doorgelezen op consistentie met de nieuwe
GoatCounter-opzet; git diff gecontroleerd om te bevestigen dat de 3 wees-foto's ongewijzigd
teruggezet zijn.

---

### v20 — Content-Security-Policy + tijdvak-chips (13 juli 2026)

Op verzoek van Soef een beveiligingsronde: volledige doorlichting op XSS/injectie, dataverlies en
lekken. Geen echte kwetsbaarheden gevonden (alle dynamische tekst loopt door `esc()`, alle
`target="_blank"`-links hebben `rel="noopener"`, geen geheimen in de repo, gist-backups staan al
op `public: false`). Twee dingen gekozen om te bouwen, plus een correctie:

- **Content-Security-Policy als vangnet:** `<meta http-equiv="Content-Security-Policy">` op alle
  9 AJAR-pagina's + het gedeelde `404.html`. `script-src 'self' https://www.googletagmanager.com`
  — geen `'unsafe-inline'`, dus een eventueel geïnjecteerd `<script>`- of `onerror=`-payload wordt
  door de browser zelf geblokkeerd, ook als er ooit ergens een escape-fout zou insluipen.
  `style-src` staat wél `'unsafe-inline'` toe (één stagger-delay-stijl + de `<noscript>`-fallback;
  CSS-injectie is een véél kleiner risico dan script-injectie). `connect-src` staat alleen
  Formspree + Google Analytics toe, `object-src`/`frame-src` staan op `'none'` (geen embeds nodig).
  **Voorwaarde om dit zónder `'unsafe-inline'` voor scripts te kunnen doen:** de twee foto-
  placeholders (`imgSlot()`/`processMedia()`) gebruikten inline `onload=`/`onerror=`-attributen
  om te wisselen tussen foto/lege-staat — dat telt als inline script en zou een strikte CSP
  breken. Herschreven naar `wireImgSlots()`: één `addEventListener`-pass ná elke render die
  `img.complete` afvangt (voor afbeeldingen die al uit cache kwamen vóór de listener draaide).
  Gedraaid met een `securitypolicyviolation`-listener in headless Chromium over alle 9 pagina's +
  het contactformulier (indienen, Formspree-fetch) + de cookiebanner/GA-laadpad + de WhatsApp-QR
  (v19) — nul violations.
  **Bewust buiten scope:** het dashboard zelf (root `index.html`) niet meegenomen — dat laadt
  CDN's (Tesseract.js, jsPDF, pdf.js, Google Identity Services) en heeft een eigen, grotere
  CSP-oefening nodig; dit is puur de AJAR-site.
- **"Schikt een moment?" — chips i.p.v. vrij tekstveld:** het `belmoment`-veld in het
  offerteformulier was een open tekstinvoer ("Bijv. doordeweeks na 15:00"); nu vijf keuze-chips
  (Geen voorkeur / Ochtend 9–12u / Middag 12–15u / Na 15:00u / Weekend, `callTimeOptions` in
  content.js, ook vertaald in EN/FR) in dezelfde `.choice-field`-stijl als het bestaande
  contactkanaal-keuzeveld — sneller op mobiel, en levert een gestructureerd antwoord op i.p.v.
  vrije tekst. De WhatsApp-/e-mailtekst gebruikt de bestaande `labelOf()`-helper zodat de volledige
  label ("Na 15:00u") in het bericht komt, niet de interne waarde.
- **Correctie:** de derde gekozen suggestie (vCard-downloadknop "Bewaar onze gegevens") bleek al
  volledig gebouwd en werkend — `saveCard()`/`initSaveShare()` bestonden al, inclusief een
  domeinonafhankelijke `URL:`-regel (leest `cfg.domain` uit content.js, dus geen handmatige
  update nodig zodra het eigen domein er is). Geen wijziging nodig, niet dubbel gebouwd.
- **Voor het moment dat het eigen domein er is:** met opzet niets gebouwd dat dan zou vervallen.
  `cfg.domain` is al de enige plek waar de URL vandaan komt (vCard, canonical, OG-tags, JSON-LD) —
  domeinwissel = één regel aanpassen in `content.js`, verder niets hier hoeft opnieuw.

Geverifieerd: alle 9 AJAR-pagina's + 404.html geladen in headless Chromium met een CSP-
violation-listener (nul violations), formulier-indienen getest (fetch naar formspree.io correct
toegestaan door `connect-src`), foto-placeholder-wiring gecontroleerd op alle pagina's (elke
`.img-slot img` krijgt `imgok`/`empty`/`noimg` via JS, geen inline handlers meer over), tijdvak-
chips visueel + functioneel getest (select, submit, correcte label in bericht).

---

### v19 — Zeven kleine functies vanuit inkoper-perspectief (13 juli 2026)

Op vraag van Soef: een lijst van 15 animatie-/functie-suggesties voorgelegd, hij koos er 8
(#4/5/6/7/9/10/13/14). Alles gebouwd en geverifieerd (Playwright headless + echte QR-decode via
`zbarimg`), geen van de bestaande, al goedgekeurde features aangeraakt.

- **CTA-tak zelf-tekenende entree:** de olijftak-boog in de CTA-band (v16, blijft ongewijzigd qua
  SVG) krijgt nu een `clip-path`-wipe erbij zodra de sectie in beeld scrollt — de tak "tekent
  zichzelf" in plaats van alleen te faden. Geen wijziging aan de SVG zelf, dus geen risico op de
  eerder afgeronde vallende-olijven-animatie.
- **Tel-moment op de tijdlijn (Over ons):** het jaartal 1990 telt op naar 2026 zodra de tijdlijn-
  sectie in beeld komt (`.timeline-counter`, `counterFrom`/`counterTo` in `content.js`). Als
  sibling van `<ol class="timeline">` geplaatst (niet erin — anders ongeldige HTML).
- **WhatsApp-QR op desktop:** desktop-bezoekers hebben WhatsApp op hun telefoon, niet op hun pc —
  naast elke WA-knop (hero-CTA + footer) een "Toon QR-code"-trigger die een echte scanbare QR
  rendert (SVG, geen `<img>`/canvas). QR-encoding = lokaal gevendorde
  `js/vendor/qrcode.js` (davidshimjs/qrcodejs, MIT, wrapt Kazuhiko Arase's QR Code Model 2),
  lazy geladen bij eerste klik — geen CDN, geen extra gewicht voor wie 'm niet gebruikt.
  **Echt geverifieerd, niet alleen visueel:** gegenereerde QR's (NL/FR voorgevulde WhatsApp-tekst
  + kale nummer-link) gedecodeerd met `zbarimg` — byte-exacte round-trip, inclusief de uiteindelijk
  op de pagina gerenderde versie.
- **Formulier-geheugen:** sample-, contact- en presentatie-formulier bewaren hun invoer live in
  localStorage (debounced) en herstellen 'm bij een volgende bezoek — met een melding + "wis
  concept"-link, en automatisch gewist na succesvolle verzending. AVG-veilig: het zijn dezelfde
  gegevens die de bezoeker toch al op het punt stond te versturen, puur client-side.
- **Kopieerknopjes zakelijke gegevens:** KvK, btw-nummer en e-mailadres (colofon + contactblok)
  krijgen een kopieer-icoon — een inkoper typt deze gegevens toch over naar zijn eigen
  crediteurenadministratie, dan is klikken sneller dan selecteren.
- **Print-stylesheet productpagina (en de rest van de site):** inkoopafdelingen printen dit soort
  B2B-dossiers daadwerkelijk uit. `@media print`-blok verbergt nav/footer-chrome/knoppen, forceert
  zwart-wit met kaderlijnen om kaarten, klapt FAQ-`<details>` open, en zet de URL achter elke link
  (`a[href]::after`) zodat een geprinte pagina nog bruikbaar is zonder de site erbij.
- **Breadcrumb structured data:** `BreadcrumbList` JSON-LD toegevoegd aan `injectJsonLd()` voor
  elke pagina behalve home (met expliciete fallback-namen voor sample/privacy/voorwaarden, die niet
  in `C.nav` staan) — kan een breadcrumb-pad opleveren in Google-resultaten.
- **#13 (eigen 404-pagina) bleek al gebouwd** — een eerdere sessie (commit 9eb8d9e, 3 juli 2026)
  had `404.html` al volledig AJAR-gebrand. De oorspronkelijke suggestie was gebaseerd op een
  onvolledige check (alleen bestandsnaam, niet inhoud); geen wijziging nodig, niet dubbel gebouwd.

Geverifieerd: alle 7 functies end-to-end getest in headless Chromium (QR-decode met zbarimg,
clipboard-permissies voor copy-knoppen, localStorage-cyclus voor formulier-geheugen inclusief wis,
print-media-emulatie voor de stylesheet, JSON-LD-parse voor de breadcrumbs) — geen JS-fouten,
geen regressie op bestaande features.

---

### v18 — Footer-logo: origineel behouden, wit, zónder de olijf-slagschaduw (12 juli 2026)

Iteratie in drie stappen: (1) footer-olijfje eerst hertekend als eigen inline-SVG — Soef wilde
dat NIET, het **originele logo moet blijven, alleen wit voor de footer**; teruggedraaid. (2) Bij
het wit maken (`brightness(0) invert(1)`) van het originele logo werd de zachte **slagschaduw
onder de olijf** een witte waas rondom, waardoor de olijf anders oogde dan het origineel.
- **Oplossing:** het logo bestaat uit twee raster-lagen (letters + losse olijf-twijg). Nieuw
  bestand **`assets/logo/ajar-footer.svg`** = exacte kopie van `ajar-header.svg`, maar in de
  olijf-afbeelding is de zachte schaduw weggehaald (alpha < 200 → transparant; olijf-/blad-vorm
  én letters onaangeroerd). Footer wijst hiernaar; header blijft `ajar-header.svg` mét schaduw
  (op crème hoort die er juist bij). CSS-filter `brightness(0) invert(1)` ongewijzigd.
- Gemaakt door de olijf-WebP uit het logo te decoderen, alpha te thresholden en terug te
  base64-embedden (eenmalige bewerking; geen generator nodig).
- **Correctie (zelfde dag):** de eerste drempel (alpha<200→0) haalde de vage grondwaas weg maar
  liet het dichtste deel van de **slagschaduw van de olijf zelf** (alpha 200–244) staan — dat
  werd bij het wit maken een lelijke uitstulping onderaan de olijf. De vrucht+bladeren zijn
  volledig ondoorzichtig (alpha 245–255), de schaduw is semi-transparant → drempel verhoogd naar
  **246** haalt álle schaduw weg en houdt alleen de echte olijf over; binnenste gaatjes in de
  vrucht dichtgevuld (flood-fill vanaf de rand). Olijf is nu een strak wit ovaal.
- Geverifieerd: footer-olijf strak wit zonder schaduw/waas, header ongewijzigd, geen JS-fouten.
- **Vervolg (zelfde dag):** Soef vond de olijf-vrucht nog te groot t.o.v. de tekst (twijg/blad
  waren wél goed). Aanpak: in `ajar-footer.svg` de vrucht volledig uit de olijf-afbeelding gewist
  (harde verticale snede x<84 = puur vruchtgebied; steel+blad rechts blijven exact) en de olijf
  opnieuw getekend als een strak, kleiner `<ellipse>` (rx37/ry25, -14° gekanteld, aangesloten op
  de steel). Onder het `brightness(0) invert(1)`-filter wordt de ellips vanzelf wit, net als de
  rest. Alléén de vrucht is nu kleiner; twijg/blaadjes ongewijzigd. Verticale-snede-methode
  vermeed de spookrandjes van de eerdere kleur-gebaseerde pixelseparatie. Header onaangeroerd.

### v17 — Compact op mobiel: swipe-carrousels + inklapbare footer (12 juli 2026)

Op verzoek van Soef (met twee gkazas.com-screenshots als referentie): te veel tekst om
doorheen te scrollen op mobiel — liever horizontaal swipen door tekstblokken, en de footer
was te lang.

- **Swipe-carrousels (≤700px, `initMobileCarousels()`):** alle processtappen-rijen
  (Product "Van boom tot fles", Zakelijk + Sample "Hoe het werkt") én de 3-kaarts USP-rijen
  (`.grid-3`: Product "Waarom deze olie", Zakelijk "Voor wie"/"Waarom nu") worden op mobiel
  één kaart tegelijk met een piek van de volgende (scroll-snap), plus ‹ ›-knoppen en dots
  (gkazas-stijl). De scrollytelling-rij: het gesnapte kaartje = de actieve stap (nummer-accent
  volgt de dot; `initProcessJourney()` doet op mobiel niets meer). Grid-2-rijen en het
  documentatieblok (bevat een formulier) bewust NIET — 2 kaarten zijn geen carrousel waard.
  Desktop: exact het oude grid, geen carrousel-DOM.
- **Footer-accordeon (≤819px):** footer herbouwd in 4 blokken met grid-areas (desktop
  onveranderd 3 kolommen). Mobiel: logo + intro + **Contact altijd zichtbaar** (WhatsApp/
  telefoon/e-mail = de B2B-levensader), daaronder "Navigatie +" en "Op de hoogte blijven? +"
  als inklapbare groepen tussen haarlijnen (+ draait naar × bij openen, max-height-transitie).
  De nieuwsbrieftitel is de accordeonkop geworden (newsletter-title-regel opgeruimd).
- i18n: `ui.prev/next` in NL/EN/FR voor de carrouselknoppen; koppen hergebruiken bestaande
  vertaalde strings. Reduced-motion: geen smooth-scroll, geen transities.
- Geverifieerd (iPhone + desktop, alle 9 pagina's): carrousel-state klopt (dot=stap, 0 overflow),
  3 carrousels op Zakelijk, 0 carrousel-DOM op desktop, footer klapt correct, geen JS-fouten.

### v16 — Olijftak-boog live in de CTA-band + vallende-olijven-animatie (12 juli 2026)

Soef koos variant D (boog) uit de zes kandidaten, met twee aanwijzingen: de olijven leken
op kersen, en hij wilde een realistische val-animatie.

- **Olijven hertekend:** eivormig (smaller bij het kroontje, voller onderin, `olivePath()` met
  rek-factor 1.16–1.32 per vrucht) i.p.v. ronde "kersen"; korte steeltjes; onregelmatige
  verdeling 3+2+1 met verschillende maten/rotaties; één olijf met rode rijpingsblos, één
  donker half achter het loof. Generator: `tools/gen-olijftak-boog.mjs`; statische versie
  `assets/art/olijftak-boog.svg`; de inline-markup zit in `ctaTak()` in main.js.
- **Val-animatie (`olvDrop`):** twee olijven (.olv-a 13s, .olv-b 17s + 6s offset — priemachtige
  periodes, dus het patroon herhaalt niet zichtbaar) laten periodiek los: kort wiebelen →
  versnellende vrije val (per-keyframe cubic-bezier als zwaartekracht) met lichte rotatie/drift →
  uitfaden vlak boven de titel → na een poos rijpt zachtjes een nieuwe aan. Start pas bij
  `.cta-band.in`; volledig uit bij reduced-motion. De vallende groep is een binnenste `<g>`
  zonder eigen transform-attribuut (CSS-transform zou anders de positionering overschrijven).
- Staat op alle 5 pagina's met een CTA-band. Geverifieerd: desktop + iPhone (0 overflow),
  val-moment via Web Animations API vastgelegd, reduced-motion → 0 lopende olvDrop-animaties,
  geen JS-fouten. GIF van de val + live-screenshots naar Soef gestuurd.

### v15 — Mega-audit: 3 parallelle agent-audits + volledige browser-inspectie, alles gefixt (12 juli 2026)

Op verzoek van Soef ("controleer de site grondig, spawn verschillende agents, elke pagina,
óók de telefoonversie, maak hier een mega-update van"). Aanpak: drie parallelle audits
(JS-correctheid / vertaal-pariteit / CSS-responsive) + eigen headless-browser-inspectie van
alle 9 pagina's × desktop + iPhone-viewport × 3 talen, mét interactietests (menu, submenu,
taalwissel, formulieren, fotostapel, lightbox) en automatische checks (overflow, kapotte
ankers, 404's, dubbele ID's, console-fouten). Alles wat gevonden is, is gefixt:

**Mobiel zichtbaar (de "telefoon ziet er anders uit"-klachten):**
- **Menu-caret zweefde los bóven het label** (Over ons/Product/Zakelijke klanten): de
  basisregel gaf de toggle een vaste hoogte van 24px waardoor `align-self: stretch` niets
  deed en de pijl bovenaan de 79px-rij plakte. Fix: `height: auto` in de mobiele override.
- **Fotostapel gaf elke ~4s een horizontale scrollbalk**: de wegglijdende kaart
  (`translateX(58%)`) stak buiten de viewport. Fix: `overflow: hidden` op `.factory-gallery`;
  geverifieerd 0px overflow tijdens de animatie.
- **Contrast (WCAG):** klein goud op crème was ~2,6:1 → nieuw token `--gold-ink: #7A5C20`
  voor alle kleine functionele goudtekst (kickers, fmt-labels, cert-badges, "volgt"-teksten,
  tijdlijn-jaartallen, colofon-kop); `--ink-faint` verdonkerd #8A8578 → #6F6B60 (~3,3 → ≥4,5:1,
  raakt o.a. de Supermarkt-vergelijkingskolom en alle veldlabels); footer-crème alphas omhoog
  (.5/.55 → .72/.75 voor AVG-notitie, copyrightregel en cookievoorkeuren-knop).
- `.specs-row` labelkolom 130px → 96px onder 420px (zeer smalle toestellen).

**JS-bugs (agent-audit, allemaal geverifieerd):**
- `initConsent()` las/schreef localStorage zonder try-catch — bij geblokkeerde storage
  (Safari lockdown/embedded webview) zou de héle boot afbreken zodra er een GA-ID staat
  (alle content blijft dan opacity:0). Nu overal try-catch, zoals i18n.js al deed.
- Footer-nav injecteerde `n.href` ongeëscaped in het href-attribuut → `esc()` zoals overal.
- Lightbox-race: snel ›› klikken verloor een klik en desyncte de teller → tijdens een
  overgang worden kliks nu genegeerd i.p.v. met verouderde index geschilderd.
- Hero-parallax zette een inline transform die de reveal-entree overrulede → wacht nu op `.in`.
- Topbar-rotatie: de `tb-enter`-klasse werd synchroon verwijderd waardoor de entree-animatie
  nooit speelde → verwijdering in `requestAnimationFrame`.
- Fotostapel: `stop()` ruimt nu ook de lopende overgangs-timeout op.

**i18n (agent-audit: EN/FR-structuurdiff + hardcoded-string-scan):**
- **`config.tagline`/`payoff` ontbraken in EN/FR** → de footer-copyrightregel was op élke
  EN/FR-pagina Nederlands. Nu vertaald (footer toont "Huile d'olive extra vierge · …").
- **Alle opgebouwde WhatsApp-/e-mailberichten waren hardcoded NL** (labels Naam/Bedrijf/
  Bezorgadres/…, subjects "Aanvraag bedrijfspresentatie", sample-WA-prefill op de knop):
  nieuw `ui.lbl{}`-blok in 3 talen + `L()`-helper; `sample.waPrefill` per taal; nieuwsbrief-
  "Privacy"-linktekst via `T()` (FR: "Confidentialité").
- JSON-LD: `availableLanguage: ['nl','en','fr']`, prijsomschrijving vertaalbaar.
- noscript-tekst in alle 9 shells nu tweetalig NL/EN.
- Bewust NIET "gefixt": ontbrekende URL-/afbeelding-/eigennaam-sleutels in EN/FR (terugval
  naar NL is daar correct) en de NL title/meta-tags (bekende beperking client-side switch).

**CSS-opruiming (agent-audit):** reduced-motion-gaten gedicht (`omDash`-stippellijn,
volscherm-menu-entree, naar-boven-knop, lightbox-pijlen; stale `.process::before`-selector
gecorrigeerd); duplicaten weg (dubbele `:focus-visible`, dubbele FAQ-caret-regel — kleur
behouden —, dubbele anchor-flash in reduce); dode `.pricing-card` verwijderd; `!important`
op `.sample-usp` vervangen door specifieke selector; dode `hero-title-anim`-class uit de markup.

- Eindverificatie: volledige her-audit (9 pagina's × 2 viewports): 0 overflow, 0 kapotte
  ankers, 0 dubbele ID's, 0 JS-fouten (ook met reduced-motion aan), alle interacties werken;
  FR/EN-lekken dicht (footer + WA-prefill gecontroleerd), menu- en contrastfix visueel bevestigd.

### v14 — Realistische olijftak (kandidaat) + kwaliteitsronde: performance & i18n-gaten (12 juli 2026)

Vervolg op v13: Soef vond de olijftak als idee wél mooi, alleen niet realistisch genoeg — en wil
eerst een voorbeeld zien vóór iets live gaat. Daarnaast: "werk met uiterste effort aan de overige
kwaliteit, bekijk het vanuit de zakelijke klant".

- **🌿 Olijftak — keuzeronde loopt (12 juli, avond):** Soef vindt de tak "best mooi" en wil
  varianten zien. Zes kandidaten gegenereerd (`assets/art/varianten/variant-A..F.svg`,
  generator `tools/gen-olijftak-varianten.mjs`): A origineel · B voller/rijker (8 olijven) ·
  C rustig/minimaal · D boog (welft over de titel) · E hangende tak · F goud-duotone.
  Vergelijkingsafbeelding naar Soef gestuurd — **wacht op zijn keuze; nog niets live.**
- **🌿 Olijftak v3 — KANDIDAAT, staat nog NIET op de site:** volledig nieuwe, realistische
  vector-illustratie naar Soefs referentiefoto — gekleurde lansvormige blaadjes met askromming
  (sage-groen boven, zilvergrijze onderkant, middennerf), gelaagd loof (gedimde dieptelaag),
  taps toelopende steel met zijtwijgen, hangende olijfclusters met spotlicht. Gegenereerd uit
  data via `tools/gen-olijftak.mjs` (blad/olijf-posities als arrays — makkelijk itereren);
  het resultaat staat klaar als `assets/art/olijftak.svg`. **Pas inzetten (CTA-band boven de
  titel, ±210px) na expliciet akkoord van Soef** — voorbeeld is hem als afbeelding gestuurd.
- **⚡ Performance (grootste meetbare tekortkoming):** alle gebruikte foto's gedownscaled naar
  max 1600px + opnieuw gecomprimeerd (q78, progressive, **EXIF-copyright behouden** — zie v9):
  totaal ±775 KB lichter. De home-hero (`sfeer-09.jpg`, de LCP) extra: 1800px/509 KB →
  1200px/254 KB. Visueel gecontroleerd: geen zichtbaar verlies. `decoding="async"` op alle
  foto's. NB: `hero-01.jpg`, `story-02.jpg`, `stock-hero-orchard.jpg` (samen 4,3 MB) zijn
  ongebruikt — bewust niet aangeraakt/verwijderd (staat in LANCERING-CHECKLIST als Soefs keuze).
- **🌐 i18n-gaten gedicht (EN/FR lekte Nederlands):** nieuw `ui{}`-blok in content.js/en/fr +
  `T()`-helper in main.js voor alle hardcoded UI-teksten: footer-kopjes (Navigatie/Contact),
  "WhatsApp — snelste route", skip-link, formulier-foutmeldingen (contact/sample/nieuwsbrief/
  presentatie), "Privacyverklaring"-linkjes, "Link gekopieerd", lightbox/naar-boven/fotostapel
  aria-labels. NL blijft overal de fallback.
- Geverifieerd: EN-footer toont "NAVIGATION/fastest route", EN-formulier geeft Engelse
  foutmelding + veld-shake, hero scherp na compressie, geen JS-fouten op alle 9 pagina's.

### v13 — Decoratie eruit, zekerheden erin (12 juli 2026)

Correctie na feedback van Soef (met foto van een échte olijftak): de getekende
CTA-olijftak bleef amateuristisch ogen — een echte tak is vol en gelaagd, dat haalt een
lijn-SVG nooit — en de gouden "olie-scheidingslijn" las niet als olie maar als een storende
streep. Nieuw hard principe vastgelegd (zie §2, regel 8): **alles vanuit de zakelijke klant,
geen decoratie zonder functie.**

- **Verwijderd:** het olijftak-ornament in de CTA-band (`branchSvg()` + `.cta-branch`-CSS),
  de olie-scheidingslijn (`oilDivider()` + `.oil-*`-CSS, stond op home/product/over-ons/zakelijk)
  én het v12-fleuron (zelfde getekende-blaadjes-stijl, zelfde bezwaar).
- **Nieuw — zekerheden-rij in de CTA-band:** onder de knoppen staan nu drie ✓-feiten
  (`ctaFacts` in content.js/en/fr): "Gratis en zonder verplichtingen · Vanaf één doos ·
  Direct contact met de importeur". Precies de laatste-twijfel-wegnemers voor een inkoper
  op het beslismoment; alle drie stonden al elders op de site (geen nieuwe claims).
  Gestaggerde fade met de band mee, reduced-motion gedekt.
- Geverifieerd in NL/EN/FR (headless Chromium, 375px + 1280px): rij netjes op alle formaten,
  geen restanten van de verwijderde elementen in de DOM, geen JS-fouten op alle 9 pagina's.
- De typografische v12-laag (initiaal, lead, Nº-nummering, grote cijfers, manifest, colofon,
  dubbele haarlijnen) blijft staan — die draagt informatie en is geen tekening.

### v12 — Klassieke luxe-laag: boek- en tijdschrifttypografie (12 juli 2026)

Op verzoek van Soef ("meer klassieke manieren om de site een luxe draai te geven, met de dingen
die al op de site staan") — zeven klassieke typografische ingrepen op bestaande content, géén
nieuwe claims of teksten. CSS-sectie "📖 KLASSIEKE LUXE-LAAG v12" onderaan `style.css` (de
hernummerde cijfers/jaartallen/manifest staan bij hun eigen secties); kleine hulpfuncties in
`main.js` (`fleuron()`, `pad2()`, `initKickerNumbers()`). Alles statisch — geen beweging, dus
geen nieuwe reduced-motion-regels nodig.

1. **Initiaal (drop cap):** de eerste letter van het familieverhaal op Over ons ("Onze opa
   vertrok…") staat als klassieke boekopening drie regels hoog in goud-serif (`::first-letter`
   op `.story-item:first-child p`).
2. **Lead-alinea's (standfirst):** de eerste alinea van home-intro, het eerste Over ons-blok en
   de kennis-intro in groter serif-zetsel (`.lead`, 1.16rem Fraunces) — tijdschrift-hiërarchie.
3. **Nº-nummering (Product + Zakelijk):** `initKickerNumbers()` zet vóór elke sectiekicker een
   serif-cursief "Nº 01/02/…" met middot — apothekers-/dossierstijl. Alleen op de twee
   dossier-pagina's; verhaalpagina's blijven nummerloos. Taalneutraal (Nº werkt in NL/EN/FR).
4. **Grote gedempte serif-cijfers:** de kleine cirkel-badges op processtappen (Product/Zakelijk/
   Sample) en herkomststappen vervangen door groot editorial "01"-zetsel in transparant goud
   (`pad2()`); het scrollytelling-actief-effect werkt nu via kleur/schaal i.p.v. badge-vulling.
   **Tijdlijn-jaartallen** ("Begin jaren '90", "2026") groot in serif-goud i.p.v. klein sans-label.
5. **Manifest-moment:** de eerlijke-prijzen-zin op Zakelijk (`.pricing-fair`) als gecentreerd
   statement — groot serif op 38ch met klein goudlijntje erboven (luxemerk-stijl). Bewust déze
   zin: staat al op de site, feitelijk, geen zelfprijzing (het familiecitaat blijft weg, zie v5).
6. **Fleuron:** klein statisch olijftak-ornament (haarlijnen + blaadjespaar + olijfje) als
   klassiek hoofdstuk-slot onder het familieverhaal, de kennisbank-FAQ en de juridische pagina's.
7. **Dubbele haarlijnen:** boven de footer, en het importeursblok op Contact is nu een klassiek
   **colofon** — gecentreerd tussen dubbele gouden haarlijnen, als een stempel op briefpapier
   (geen kaart meer, dus ook geen 3D-tilt erop).

- Geverifieerd (headless Chromium, 375px + 1280px): drop cap, jaartallen, Nº-kickers, grote
  stapcijfers, manifest, colofon, fleurons en footer-lijn allemaal visueel gecheckt; geen
  JS-fouten op alle 9 pagina's.

### v11 — Animatie-kwaliteitsronde: lelijke effecten hersteld (12 juli 2026)

Op verzoek van Soef ("sommige animaties zien er lelijk en amateuristisch uit") — volledige audit
van alle animaties met headless-Chromium-screenshots, daarna gerichte fixes. CSS-comment-sectie
"✨ ANIMATIE-KWALITEITSRONDE v11" onderaan `style.css`; de meeste fixes zitten bij hun eigen secties.

**Hersteld (zag er goedkoop/amateuristisch uit):**
1. **Olijftak in de CTA-band hertekend** (`branchSvg()` in `main.js` + `.cta-branch`-CSS): de oude
   SVG rendeerde als een onherkenbare krabbel/handtekening. Nieuw: échte takvorm — rustige steel,
   zes slanke lansvormige blaadjes afwisselend boven/onder, twee olijfjes aan korte steeltjes.
   Choreografie: steel tekent eerst, blaadjes één voor één (nth-of-type-delays) met zachte
   goudvulling, olijfjes verschijnen als laatste. Prototype eerst los geverifieerd vóór inbouw.
2. **Oneindige glans-vegen weg** — het klassieke "goedkope shine"-effect: de goudglans over álle
   foto's (elke 14s) is nu één veeg bij de scroll-reveal ("het licht vangt de foto"); de sheen op
   primaire knoppen (elke 8s) reageert nu alleen op hover/focus; de spec-sheet-kaart veegt éénmalig
   bij reveal.
3. **Verdwaalde gouden streep** boven de 3-stappenrij (Zakelijk/Sample) weg: de proceslijn is nu
   beperkt tot `.process-journey` (Product), waar hij als voortgangsspoor betekenis heeft.
4. **3D-tilt getemperd**: ±7° → ±4° (7° oogde speelgoedachtig op grote kaarten), glare zachter
   (.5 → .32). **Ken Burns** hero: 24s → 40s en 1.08 → 1.06 — het omkeerpunt ("terugpompen") was
   zichtbaar. **Flesglans** rustiger (alpha .32 → .22, 6,5s → 9s).
5. **Dode code opgeruimd**: `.cta-band-drop` (stond op `display:none` maar draaide wél dropGlow +
   dropSway) volledig verwijderd uit JS + CSS; dubbele `anchorFlash`-keyframes ontdubbeld.

**Nieuw (kwaliteitsupgrades):**
6. **Home-hero-entree**: h1 onthult zich uit een masker (zelfde stijl als de sectietitels elders),
   subtekst en knop volgen zacht gestaggerd (.35s/.5s) — verving de vlakke alles-tegelijk-fade.
7. **Ghost-knoppen vullen zich vloeiend** van links met olijfgroen bij hover (`background-size`-
   veeg, tekst wordt crème); `.btn-ghost-light` op de donkere CTA-band vult crème-transparant.

- Geverifieerd (headless Chromium, 375px + 1280px, alle 9 pagina's): tak leesbaar als olijftak op
  beide formaten, streep weg op Zakelijk, hero netjes gesetteld, geen JS-fouten. Reduced-motion
  voor alle gewijzigde effecten bijgewerkt (blaadjes/vulling direct in eindstand, geen vegen).

### v10 — Animatie-pakket: 8 kwaliteitsanimaties (11 juli 2026)

Op verzoek van Soef ("doe ze allemaal, verhoog de uitvoeringskwaliteit, neem je tijd") — de acht
opties uit het aangeboden menu gebouwd. CSS-sectie "✨ ANIMATIE-PAKKET v9" onderaan `style.css`
(intern v9 genoemd in de CSS-comment; in dit dossier v10 om botsing met de copyright-v9 te
vermijden), nieuwe init-functies in `main.js`, alles reduced-motion-geguard en getest.

1. **Scrollytelling "Van boom tot fles"** (`initProcessJourney()`): de 4 processtappen op Product
   (`.process-journey`) worden een scroll-verhaal — de stap bij de "focuslijn" (52% schermhoogte)
   is actief (opgelicht, gouden gevulde nummerbadge, foto op volle kleur, lichte lift), gehad =
   zachtjes aan, nog-te-komen = gedimd (opacity .62 + gedempte foto). De desktop-verbindingslijn
   vult mee via `--journey` (0→1). rAF-throttled scroll. Reduced-motion → alles actief, lijn vol.
2. **Gyroscoop-diepte op de hero-foto (mobiel)** (`initHeroTilt()`): tegenhanger van de desktop-
   muisdiepte (init3d) — de hero kantelt héél licht (±4°/±3°, gedempt via lerp) met
   `deviceorientation`. iOS 13+ vraagt eenmalig toestemming bij de eerste `touchend`; geweigerd/
   niet-beschikbaar → stil overgeslagen. Hergebruikt de bestaande `.hero-3d` `--hrx/--hry`-vars.
3. **Lightbox-galerij** (`initLightbox()` herschreven): procesfoto's groot bekijken en dan
   **vegen/pijltjes/‹›-knoppen** naar de volgende/vorige, met teller (`2 / 4`) en vloeiende
   schuif-overgang. Galerij = alle procesfoto's die echt laadden (icoon-tegels doen niet mee).
   Touch-swipe (>40px horizontaal), ArrowLeft/Right, Escape. Achtergrond/✕ sluit; knoppen niet.
4. **Vloeiende olie-scheidingslijn** (`oilDivider()`): een zachte golf (SVG) met een kort feller
   goud-lichtsegment dat er via `stroke-dashoffset` doorheen "stroomt" — `non-scaling-stroke` +
   `pathLength=1` zodat het naadloos schaalt van mobiel tot desktop. Spaarzaam ingezet: één per
   pagina op een sterke overgang (home, product, over-ons, zakelijk).
5. **Glans over de concept-fles** (`.bm-shine`): traag strijkend licht over het flesglas op
   Zakelijk (`.bm-body` kreeg `overflow:hidden` als clip). Puur CSS, `bmShine` 6,5s.
6. **Menu-indicator die meeglijdt** (`initNavIndicator()`, desktop): één goudlijntje onder het
   actieve menu-item dat bij hover naar het item onder de cursor glijdt (en terugkeert), én bij
   paginawissel via de al-actieve MPA View Transition naar het nieuwe actieve item schuift (eigen
   `view-transition-name: navind`). Vervangt de losse hover-underline + het actief-randje
   (`body.has-nav-underline`). Mobiel: uit (volscherm-menu heeft al een actief-markering).
7. **WhatsApp-tik-bevestiging** (`initWhatsappFeedback()`): tik op een `wa.me`-link → korte groene
   ripple + oplichtend vinkje (los in de body op vaste positie bij het tikpunt, dus geen
   knop-layout/overflow-gedoe; werkt voor knoppen én tekstlinks). Tekstloos → i18n-vrij.
8. **Succes-vinkje met gouden gloed-puls** (`.form-success::before`): na een gelukte
   formulierverzending één zachte radiale goud-puls achter het getekende vinkje (`okGlow`).

- E2E geverifieerd (headless Chromium, 390px + 1280px, alle 9 pagina's mét volledige scroll):
  scrollytelling actief-index −1→0→1→2→3 + journey 0→1; lightbox teller 1/2→2/2, next/Escape;
  nav-indicator onder actief item + verschuift bij hover; flesglans-animatie draait + `overflow:hidden`;
  WhatsApp-fx spawnt ripple+tick; succes-gloed `okGlow`. Geen JS-fouten (m.u.v. de bekende bewuste
  404's proces-06/07.jpg), geen kapotte beelden, geen overflow. Reduced-motion: alle acht in
  rusttoestand (journey vol, oil/shine/glow uit).
- Testles: de site heeft `scroll-behavior:smooth`; bij het verifiëren van scroll-gedreven animaties
  in headless eerst `html{scroll-behavior:auto}` injecteren, anders meet je midden in een trage
  smooth-scroll (eerste testronde toonde daardoor ten onrechte activeIdx −1).

**Geparkeerd voor later (bewust NIET gebouwd — wachten op assets/akkoord):**
- **Voor/na-kleur-sleepslider** (AJAR vs supermarktolie) — vereist échte foto's van de eigen olie.
- **360°-fles / cinemagraph-hero** — pas zodra de fles + beeldmateriaal er zijn.
- **Vallende olijfblaadjes in de hero** — schuurt tegen kitsch; alleen op expliciet verzoek.
- **Count-up op kwaliteitscijfers** — bestaat al (`initCountUp`), gaat vanzelf "aan" zodra de
  labcijfers (zuurgraad/polyfenolen/oogstjaar) in `content.js` staan.

### v9 — Copyright/intellectueel eigendom (11 juli 2026)

Op verzoek van Soef ("copyright voor de ajar site").

- **Nieuw artikel "12. Intellectueel eigendom"** in de Algemene voorwaarden (NL/EN/FR): alle
  site-inhoud, foto's, logo, merknaam, spec-sheets en offertes zijn eigendom van AJAR en
  auteursrechtelijk beschermd; kopiëren/commercieel gebruik alleen met schriftelijke toestemming.
  Bewuste uitzonderingen: afnemers mógen beeldmateriaal/productinfo gebruiken om AJAR-producten
  in eigen zaak/menukaart/webshop te presenteren, en kort citeren met bronvermelding mag.
  Oude artikelen 12/13 (Wijzigingen/Bedrijfsgegevens) hernummerd naar 13/14; `terms.updated`
  → versie 1.1. LANCERING-CHECKLIST-vermelding "12 artikelen" bijgewerkt naar 14.
- **Footer-copyrightregel uitgebreid**: "© <jaar> AJAR · <tagline> · Alle rechten voorbehouden"
  via nieuwe sleutel `footer.rightsLine` in alle drie de contentbestanden (main.js laat 'm weg
  als de sleutel ontbreekt). EN "All rights reserved", FR "Tous droits réservés".
- **Vervolgronde (zelfde dag)**: `<meta name="copyright">` op alle 9 pagina's; **WebSite JSON-LD**
  met `copyrightHolder`/`copyrightYear`/`copyrightNotice`/`license` (→ voorwaarden.html) naast de
  bestaande Organization/Product-blokken; **EXIF-copyright ingebed in alle 14 eigen foto's**
  ("(c) 2026 AJAR, Amsterdam …" + Artist "AJAR", via piexif — alleen metadata, beelddata onaangetast,
  elk +110 bytes). Stockfoto's (stock-*, proces-05) bewust NIET geclaimd — auteursrecht ligt daar
  niet bij AJAR. Zie de copyright-sectie in `assets/images/LEES-MIJ.txt` voor nieuwe foto's.
  Géén zichtbaar watermerk — dat zou de marketingsite schaden; EXIF + voorwaarden-artikel volstaan.
  Alles geverifieerd: alle 14 JPEG's decoderen (naturalWidth-test headless chromium), JSON-LD
  parseert, meta aanwezig op alle pagina's.

### v8 — Uitklapmenu, B2B-features, meertalig NL/EN/FR, Formspree live (10 juli 2026)

Losse sessie op verzoek van Soef ("de pagina's zijn te lang, maak overzichtelijker" + "wat is er
nog meer nuttig voor een zakelijke klant"), parallel aan v7 ontwikkeld op een feature-branch en
achteraf samengevoegd (rebase, geen functionaliteit uit v7 verloren — zie hieronder).

- **Uitklap-submenu's**: Over ons/Product/Zakelijke klanten krijgen een dropdown (`nav[].children`
  in content.js) waarmee een klant direct naar een sectie springt i.p.v. de hele pagina te lezen.
  Desktop hover-paneel, mobiel accordeon. Klik op dezelfde pagina = soepel scrollen + kort oplichten
  (geen herlaad); vanaf een andere pagina = navigeren en op de sectie landen (`scroll-margin-top`).
- **Herkomst-/traceerkaart** (Product): geanimeerde route Taourirt/Debdou → Amsterdam met een
  reizende marker (SVG `getPointAtLength`, IntersectionObserver-gestuurd, reduced-motion-safe).
- **"Zo bestelt u"** (Zakelijk): concrete voorwaarden op een rij (minimale afname, levertijd,
  betaling, prijs) zodat een inkoper niet door de FAQ hoeft te zoeken.
- **Inkoopdossier** (Zakelijk): "Documenten & certificaten"-checklist met beschikbaar/op-aanvraag-
  status per document + WhatsApp-opvraagknop.
- **Slimmer offerteformulier**: velden type zaak, leverfrequentie, contactvoorkeur (incl. "bel me
  terug" + gewenst belmoment) — gaan mee in de mail/WhatsApp-aanvraag.
- **WhatsApp per onderwerp**: voorgevulde snelknoppen (offerte/sample/proeverij/relatiegeschenk) op
  de contactpagina, naast de bestaande algemene WhatsApp-knop.
- **Bewaar/deel**: vCard-download (`.vcf`, gaat in Contacten op iPhone/Android), Web Share (valt
  terug op link kopiëren) en een QR-code (`assets/qr-site.svg`). Een echte Apple Wallet-pass kan
  niet op een statische site (vereist Apple-certificaten + ondertekening) — de vCard is het
  praktische equivalent.
- **Meertalig NL/EN/FR**: globe-schakelaar in het menu (desktop dropdown, mobiel pill-rij).
  `content.js` = NL-basis, `content.en.js`/`content.fr.js` overschrijven diezelfde structuur,
  `i18n.js` kiest de taal (localStorage, standaard NL, **geen** browsertaal-auto-detectie) en valt
  per ontbrekende sleutel terug op NL. Volledig vertaald, inclusief de v7-toevoegingen (uitgebreide
  privacyverklaring, alle 12 voorwaarden-artikelen) na het samenvoegen.
- **Formspree live**: `formspreeId` ingevuld (`mbdvnykk`) — alle vier formulieren (offerte, sample,
  presentatie, nieuwsbrief) versturen nu echt i.p.v. terug te vallen op mailto/WhatsApp.
- **Samenvoegronde met v7**: v7 werd rechtstreeks op `main` gepusht terwijl deze branch nog openstond
  (beide raakten `content.js`/`main.js`/`css/style.css`/alle HTML-shells). Opgelost via rebase +
  handmatige merge — niets van beide kanten verloren: v7's algemene-voorwaardenpagina, uitgebreide
  AVG-tekst, lokale fonts en foto-optimalisatie staan naast de v8-features hierboven. Dubbele
  `theme-color`/`canonical`-tags die de auto-merge opleverde zijn opgeschoond; de eerder gekozen
  per-pagina `theme-color` (olijfgroen bij topbar-pagina's, crème alleen op `sample.html`, dat had
  v7 uniform crème) is behouden. E2E geverifieerd (headless Chromium, 390/1280px, NL/EN/FR, alle
  9 pagina's): geen JS-fouten, geen overflow, Formspree/vCard/dropdowns/herkomstkaart werken.

### v8 — Nuttige micro-animaties + FAQ-bugfix (10 juli 2026)

Op verzoek van Soef ("nuttige simpele animaties met tekst of foto's"). Zelfde lat als v6d:
alleen functioneel/oriënterend, geen extra sfeer. Eerst gecheckt wat er al was (proceslijn,
Ken Burns, timeline-cascade en nav-underline bestonden al uit de parallelle sessie) — vier
nieuwe effecten gebouwd, alle tekstloos (dus géén EN/FR-vertaling nodig), CSS-sectie
"✨ NUTTIGE MICRO-ANIMATIES v8" onderaan style.css met eigen reduced-motion-blok:

1. **Foto-onthulling** — grote editorial foto's (hero, split-secties, specs, sample) onthullen
   met een zachte clip-path-wipe van boven + kleur die "aan" gaat (saturate .55 → 1). Bewust
   NIET op de fotostapel (eigen wissel-animatie) en de kleine procestegels. Werkt samen met de
   bestaande blur-up (opacity-transition behouden in de override) en de scroll-drift (animation
   op transform, geen conflict).
2. **Formulier-voortgangsbalk** — dunne gouden balk boven het formulier vult per geldig
   verplicht veld; vol = olijfgroen (`.form-progress`/`.fp-fill`/`.fp-done`). Automatisch op elk
   formulier met 3+ verplichte velden (sample/offerte/presentatie; nieuwsbrief bewust niet).
   `initFieldChecks()` herschreven: per-form, gedeelde `valid()`, bar via JS ingevoegd vóór de
   `.form-grid`. Tekstloos → i18n-vrij.
3. **Vergelijkingstabel goud-sweep** — op Product veegt een gouden glans rij-voor-rij (cascade
   .35–.8s) over de AJAR-kolom zodra de tabel in beeld komt, en er blijft een héél lichte
   goudtint achter (`.compare-a::before`, `cmpSweep`). Trekt het oog naar de verschil-kolom;
   werkt ook in de mobiele gestapelde weergave.
4. **Kicker-streepje** — klein goudlijntje (26px) groeit onder elke `.section-head .kicker` als
   de sectiekop in beeld komt (na de titel-maskeranimatie, delay .45s). Absolute positionering,
   geen layout-shift; paginahero's bewust niet (hebben de titel-animatie al).
5. **FAQ-antwoord scrolt in beeld** ná het uitklappen (`scrollIntoView block:'nearest'` — scrolt
   alleen als het antwoord echt onder de vouw valt).

**Echte bugfix onderweg gevonden (pre-existing):** de FAQ open/dicht-animatie zette start- en
eindhoogte zonder geforceerde reflow ertussen → de transitie startte (in elk geval in headless
Chromium) nooit, `transitionend` vuurde nooit en **`data-busy` bleef permanent hangen — het item
kon daarna nooit meer dicht/open**. Fix: `void body.offsetHeight` reflow tussen start- en
eindwaarde + een `settle()`-helper met 500ms timeout-vangnet dat altijd opruimt, en filtering op
`propertyName === 'height'`. Regressie-getest: open → dicht → opnieuw open werkt nu.

E2E geverifieerd (headless Chromium, 390px + 1280px, alle 9 pagina's mét volledige scroll):
geen JS-fouten (behalve de bekende bewuste 404's van proces-06/07.jpg), geen kapotte beelden,
geen overflow; voortgangsbalk 0→50→100% + fp-done; wipe eindstand correct; compare-sweep
opacity 1; kicker scaleX(1); EN-taalvariant gecheckt (balk aanwezig, geen tekst te vertalen).

### v7 — Volledige overhaul: bedrijfsteksten compleet + AVG/performance-ronde (10 juli 2026)

Grote audit-ronde op verzoek van Soef ("bekijk de hele site, schrijf alle teksten die een bedrijf
nodig heeft, noteer alles wat mist"). Nieuw overzichtsdocument: **`LANCERING-CHECKLIST.md`** —
dé plek waar nu alles staat wat Soef nog moet aanleveren/beslissen (incl. juridische punten als
NVWA-registratie, etiket-eisen, btw-id, verzekering). Wijzigingen:

- **Algemene voorwaarden** — nieuwe pagina `voorwaarden.html` (`data-page="voorwaarden"`,
  `C.terms` in content.js, gedeelde `renderLegal()` met privacy). 12 artikelen B2B-voorwaarden in
  gewone taal. **Drie bewuste standaard-aannames die Soef moet checken** (staan in de checklist):
  betaaltermijn 14 dagen, samples "één per zaak", levergebied Nederland. `noindex,follow` net als
  privacy; gelinkt in footer-nav + footer-bottom. Niet in de hoofdnav (bewust) en niet in sitemap.
- **Privacyverklaring herschreven/uitgebreid**: nieuwsbrief-verwerking, e-mail als contactkanaal,
  KvK-nummer, GitHub Pages-hosting, dataportabiliteit, beveiligingsparagraaf, fiscale bewaartermijn,
  cookie-voorkeuren-link. Datum → 10 juli 2026.
- **Google Fonts → lokaal gehost** (AVG: het CDN lekte bezoekers-IP's naar Google vóór consent;
  in DE al beboet). 4 woff2-bestanden in `assets/fonts/` (variabele fonts, latin + latin-ext,
  OFL-licentie), `@font-face` bovenin style.css, `preload` in alle shells i.p.v. de
  preconnect/CSS-links. **Let op:** de sandbox-consolefout "Google Fonts geblokkeerd" is hiermee
  ook definitief weg.
- **Foto's geoptimaliseerd**: alle in gebruik zijnde beelden naar max 1800px lange zijde,
  JPEG q72–80 progressive (Pillow). Van ~16 MB totaal naar ~4 MB; Over ons laadde eerst ~10 MB.
  Originelen staan in de git-historie. Wees-bestanden (hero-01/story-02/stock-hero-orchard)
  bewust ongemoeid gelaten.
- **Cookie-voorkeuren heropenen**: `.footer-link-btn` in de footer-bottom (alleen gerenderd als
  `gaId` gezet is) wist de consent-keuze en toont de banner opnieuw.
- **Contact completer**: telefoonnummer als klikbare `tel:`-link in footer + Contact-zijkaart
  (`contact.direct.phoneDisplay`), e-mail nu ook op de Contact-pagina, KvK in de importeur-kaart.
- **Presentatie-tekstfix**: "u ontvangt de presentatie zodra die beschikbaar is" → "download de
  presentatie direct" (de PDF bestaat al; de succes-flow toonde de downloadlink al).
- **Succesmelding scrollt in beeld** na formulier-verzending (`showMsg` → `scrollIntoView`,
  reduced-motion-safe) — op mobiel stond de bevestiging vaak buiten beeld.
- **SEO/tech**: `rel=canonical` + `theme-color` op alle 9 shells; JSON-LD Organization uitgebreid
  met email/telephone/contactPoint/taxID.
- **Toegankelijkheid**: skip-link "Direct naar de inhoud" (`.skip-link`, alleen zichtbaar bij
  toetsenbord-focus) als eerste element via `renderHeader()`.
- **Nieuwsbrief-privacynotitie** (`newsletter.privacyNote` + `.newsletter-note`).
- Mobiele CTA-balk ook onderdrukt op de voorwaarden-pagina.
- E2E geverifieerd (headless Chromium, 390px + 1280px, alle 9 pagina's): geen JS-fouten, geen
  kapotte beelden, geen overflow; fonts laden lokaal; voorwaarden-pagina rendert 12 artikelen.

**v7-vervolg — Soefs antwoorden op de C7-vragen verwerkt (10 juli 2026, zelfde dag):**
Betaaltermijn (14 dagen) en de sample-aanname ("één per zaak") bevestigd, geen wijziging nodig.
Twee content.js-aanpassingen: **levergebied** in de voorwaarden (art. 4) van "Nederland" naar
**"Nederland of België"**; **nieuwsbrief-tekst** herschreven — ging nog uit van "zodra AJAR
leverbaar is" (pre-launch-toon), maar de olie is er al, alleen de site wordt nog niet actief
gepromoot. Nu een gewone "blijf op de hoogte"-tekst zonder leverbaarheids-belofte.
`LANCERING-CHECKLIST.md` sectie C1/C7 bijgewerkt (aannames afgevinkt, beantwoorde vragen gemarkeerd).

**v7-vervolg 2 — btw-nummer + Formspree-ID ingesteld (10 juli 2026, zelfde dag):**
`config.btw = 'NL003042226B35'` (nieuw veld) en `config.formspreeId = 'mbdvnykk'` in content.js.
Btw-nummer verschijnt nu naast KvK in het footer-legal-blok, de Contact-importeurskaart en de
JSON-LD (`vatID`) — stond al langer in het dashboard zelf (Boekhouding → `ADMINS`), dus facturen
waren al goed. Met een echte `formspreeId` posten alle 4 formulieren (offerte/sample/presentatie/
nieuwsbrief) nu daadwerkelijk naar Formspree i.p.v. terug te vallen op mailto/WhatsApp — **nog te
controleren door Soef: staat het juiste ontvanger-e-mailadres ingesteld op formspree.io.**

### v6g — Kennisbank-pagina + nieuwsbrief-inschrijving (5 juli 2026)

Uit een verbeter-menu koos Soef "verder gaan" met de items die ik volledig zonder aangeleverde
assets kon bouwen. Twee opgeleverd (het derde, per-pagina OG-afbeeldingen, bewust NIET gedaan —
de OG-teksten zijn al per pagina uniek, alleen de deel-afbeelding is gedeeld, wat prima standaard-
praktijk is; 7 bijna-identieke share-images maken was lage-waarde-werk).

- **Nieuwe pagina Kennis** (`kennis.html`, `data-page="kennis"`, `renderKnowledge()` +
  `C.knowledge` in content.js). Doel: autoriteit + SEO + koper-vertrouwen. 8 accordion-entries met
  **algemene, verifieerbare olijfolie-vakkennis** (extra vierge, zuurgraad, polyfenolen, koud
  geperst/eerste persing, single-origin, bewaren, houdbaarheid, proeven) — **GEEN productclaims
  over AJAR zelf** (geen eigen cijfers/smaak; die horen op Product). Vraag-vormige titels →
  hergebruikt de bestaande `.faq`-accordion + krijgt **FAQPage-JSON-LD** (rich results, zelfde
  patroon als de zakelijk-FAQ). Compact gehouden (Soefs strak-houden-voorkeur): antwoorden 2-4
  zinnen. Toegevoegd aan de hoofd-nav (nu 6 items — "Kennis" tussen Product en Zakelijke klanten),
  aan de sitemap (prio 0.7) en met eigen OG-tags/`<title>`/description. Sluit af met een CTA
  ("zelf proeven zegt het meest") naar sample + product.
- **Nieuwsbrief-inschrijving** in de footer (`C.newsletter` + `newsletterBlock()`/`initNewsletter()`):
  e-mailadres-veld onder de merkkolom, in élke footer. Gebruikt dezelfde `submitLead()`-fallback
  als de formulieren (Formspree indien `formspreeId` gezet, anders voorgevulde mailto). Succes toont
  hetzelfde getekende ✓. **Kanttekening voor Soef:** zonder `formspreeId` opent het een mailtje
  i.p.v. de adressen ergens te verzamelen — de echte waarde komt zodra Formspree (of iets anders)
  is ingesteld. `newsletter.enabled: false` verbergt het blok volledig.
- Geverifieerd (headless, 390px + 1100px desktop): kennispagina rendert 8 entries, "Kennis" in top-
  én footer-nav, FAQPage-JSON-LD aanwezig, nieuwsbrief verstuurt met ✓, alle 7 pagina's zonder
  overflow/JS-fouten, desktop-nav met 6 items past netjes.

### v6f — Pending-claims (Fairtrade/Duurzaam/100% natuurlijk) alsnog toegevoegd (5 juli 2026)

Na v6e wees ik Soef erop dat "Fairtrade"/"Duurzaam"/"100% natuurlijk" ongefundeerde claims zijn
zonder certificering. Soef koos er bewust voor ze tóch alvast in de topbar-rotatie te zetten: de
site wordt pas echt gelanceerd/gepromoot als de certificaten binnen zijn, dus tot die tijd is het
risico beperkt. Dat is zijn beslissing te maken — verwerkt met een vangnet:

- `content.js`: `topbar.pendingItems` (Fairtrade/Duurzaam/100% natuurlijk) + `topbar.showPending`
  (default `true`). Nieuwe helper `topbarItems()` in main.js voegt `items` + (als `showPending`
  niet expliciet `false` is) `pendingItems` samen — gebruikt door zowel de eerste render als
  `initTopbarRotate()`.
- **Vóór de echte lancering: zet `topbar.showPending = false`** als de certificaten er dan nog
  niet zijn — dat is de enige plek die moet veranderen, de rest van de topbar-logica blijft gelijk.
- Geverifieerd: alle 8 teksten (5 bevestigd + 3 pending) rouleren na elkaar, geen JS-fouten, geen
  overflow op alle 7 pagina's.

### v6e — Fotostapel-galerij + roulerende topbar (5 juli 2026)

Twee verzoeken van Soef in één ronde:

- **Fotostapel op Over ons** (`.stack-gallery`, verving de vlakke 2×2-grid van de factory-gallery):
  de 4 ajar.ma-fabrieksfoto's liggen nu overlappend op elkaar als losse foto's op tafel (subtiele
  rotaties/offsets, kaart onderop steekt eronderuit) en komen **om de beurt bovenop** — vanzelf
  elke 4,2s (bovenste kaart glijdt opzij en schuift achteraan), of direct bij een tik op de stapel.
  Dots eronder tonen welke foto bovenligt en zijn klikbaar om direct te springen. Pauzeert buiten
  beeld (IntersectionObserver) en in een verborgen tabblad; toetsenbord: Enter/spatie = volgende.
  **Let op:** tik = volgende foto, dus deze 4 foto's zitten bewust niet meer in de lightbox
  (de selector `.factory-gallery-item .img-slot` matcht niet meer; procesfoto's houden de lightbox).
- **Roulerende topbar** (`topbar.items` in content.js + `initTopbarRotate()`): de dunne balk
  bovenaan wisselt nu elke 3,8s van tekst met een zachte fade-omhoog. **Belangrijk — teksten
  bewust aangepast t.o.v. Soefs voorbeeldlijstje** (dat lijstje was 1-op-1 Olyfia's merkpijlers):
  "Fairtrade" NIET overgenomen (beschermd keurmerk, AJAR heeft het niet — claimen zonder
  certificaat is misleidend), "Duurzaam" NIET (ongefundeerde milieuclaim, ACM handhaaft daarop),
  "100% natuurlijk" NIET (lege kreet, categorie die Soef zelf bant). Wel: gratis-sample-CTA,
  "Eigen boomgaarden in Marokko", "100% Marokkaanse extra vierge olijfolie", "Koudgeperst in de
  eigen perserij", "ISO 22000-gecertificeerd (SGS)" — allemaal bevestigde feiten. Zodra echte
  certificering binnen is, kan die als extra regel worden toegevoegd.
- Beide met reduced-motion-gedrag: stapel wisselt direct zonder glijden en zonder auto-rotatie
  (alleen op tik), topbar staat stil op de eerste tekst.
- Geverifieerd (headless, 390px): topbar wisselt na ~4s naar de volgende tekst, stapel roteert bij
  tik (posities 0,1,2,3 → 3,0,1,2) én automatisch daarna, actieve dot volgt, geen overflow, geen
  JS-fouten.

### v6d — Nuttige micro-animaties in formulieren + navigatie (5 juli 2026)

Op verzoek van Soef: alleen animaties toevoegen die iets functioneels doen (feedback/oriëntatie),
niet nog meer sfeer — dezelfde lat als bij het verwijderen van de film-grain en de hero-word-reveal.
Gekozen uit een lijst van 7 voorstellen: 1, 2, 3, 4, 6, 7 (niet: groen vinkje per veld tijdens
typen als los puntje — bleek achteraf juist heel nuttig dus toch meegenomen als #4).

- **Zelf-tekenend succes-vinkje** (`.ok-check`, stroke-draw via `pathLength`, zelfde techniek als de
  olijftak in de CTA-band) vervangt de oude "gouden druppel" (`dropCelebrate()`/`.drop-fall`
  volledig verwijderd) bij een gelukte form-submit. Cirkel + vinkje tekenen zich na elkaar met een
  korte delay — leesbaarder én duidelijker "gelukt"-signaal dan een druppel die wegvalt.
- **Schud + focus bij een onvolledige aanvraag** (`shakeFirstMissing()`): zodra de bestaande
  foutmelding verschijnt, schudt het eerste ontbrekende/ongeldige veld kort en krijgt het focus —
  op de langere formulieren (sample, 6+ velden) was het anders niet meteen duidelijk wélk veld mist.
- **Spinner in de verstuurknop** (`.btn-loading::after`, CSS-only conic-achtige ring via
  `border-color`-truc) naast de bestaande tekstwissel naar "Versturen…" — voorkomt dubbel klikken
  op trage verbindingen.
- **Groen vinkje per geldig ingevuld veld** (`initFieldChecks()`, luistert op `input`/`blur`):
  e-mailvelden via regex, telefoon op cijferaantal, overige verplichte tekstvelden op lengte.
  Optionele lege velden krijgen bewust geen vinkje (zou onterecht "compleet" ogen).
  Verlaagt de drempel op het langste formulier (sample-pagina, 8 velden).
- **Eénmalige puls op de sticky mobiele "Gratis sample"-knop** (`.mob-cta-hello`) bij de allereerste
  verschijning na scrollen — niet-herhalend (`greeted`-vlag in `initMobileCta()`), trekt de aandacht
  precies één keer zonder irritant te worden.
- **Anker-highlight** (`initAnchorFlash()` + `.anchor-flash`): kom je binnen via een link met
  `#faq` of `#documentatie` (bijv. een WhatsApp-link die Soef zelf doorstuurt naar een specifieke
  vraag), dan licht die sectie 1,6s zacht goud op zodat meteen duidelijk is waar je moet kijken.
  IDs toegevoegd aan de FAQ- en documentatie-secties op de Zakelijke-klanten-pagina (enige plekken
  waar dit nu zinvol is).
- Alles met reduced-motion-guard (eindstand direct tonen, geen beweging).
- Bewust NIET gedaan (met opzet buiten scope, zelfde categorie als de verwijderde film-grain):
  extra sfeer-/loop-animaties, hover-effecten uitbreiden (doelgroep zit vrijwel uitsluitend op
  mobiel, hover bestaat daar niet).
- Geverifieerd (headless Chromium, 390px): leeg formulier → foutmelding + schudden + focus op eerste
  ontbrekende veld; geldige invoer → groene vinkjes per veld (optionele velden blijven leeg); submit
  → succes-vinkje tekent zich, tekst klopt; `#faq`-anker → `.anchor-flash`-class direct aanwezig;
  sticky mobiele CTA → `.mob-cta-hello`-class na eerste verschijning. Geen JS-fouten, geen overflow
  op alle 7 pagina's.

### v6c — Correctie: "MOUSTAINE" is een persoonsnaam, geen bedrijfsnaam (5 juli 2026)

Soef corrigeerde direct na v6b: **"MOUSTAINE" is de achternaam van zijn opa** (een persoonsnaam),
géén voormalige handels-/bedrijfsnaam zoals eerdere sessies hadden aangenomen en herhaaldelijk op
de site hadden gezet. Dat is dus al die tijd een schending geweest van de eigen kernregel #2 ("geen
persoonsnamen"). Overal verwijderd/herschreven, zonder nieuwe feiten te verzinnen:
- `producer.note`: "opgericht begin jaren '90 onder de naam MOUSTAINE" → "opgericht begin jaren '90"
  (jaartal-feit blijft, naamsvermelding weg).
- `about.blocks[0].text`: dezelfde clausule verwijderd uit de lopende tekst op Over ons.
- `about.timeline`: item 1 "Oprichting als MOUSTAINE" → "Oprichting van het familiebedrijf"; item 2
  "Groei tot ConservAjar SARL" (impliceerde een naamswijziging vanaf iets dat nooit een naam bleek
  te zijn) → "Formeel geregistreerd als ConservAjar SARL" — een neutrale, niet-verzonnen aanname
  (klein begonnen, later formeel geregistreerd) die geen persoonsnaam nodig heeft.
- Uitgebreide waarschuwing toegevoegd bij kernprincipe #2 hierboven zodat dit niet terugkomt.
- Beide PDF's (spec-sheet + presentatie) opnieuw gegenereerd — de presentatie trekt de tijdlijn
  direct uit `about.timeline`, dus de correctie liep automatisch door.
- Geverifieerd: hele site (7 pagina's) doorzocht op de rendered DOM-tekst — "moustaine" komt nergens
  meer voor (case-insensitive), 0 gebroken beelden/JS-fouten/overflow.

**Bredere tekst-audit (zelfde ronde, op verzoek "bekijk alle teksten, wat kan beter/wat ontbreekt"):**
Volledige `content.js` doorgenomen op clichés, dingen die niet op een serieuze B2B-site horen, en
ontbrekende vertrouwenselementen. Bevindingen: geen bruikbare clichés aangetroffen (gecheckt op
"passie/beleving/toonaangevend/innovatief/dromen/reis/avontuur"-type marketingtaal — komt niet voor
behalve een bewuste, contrasterende ontkenning "niet uit avontuur" in het familieverhaal). Geen
resterende persoonsnaam-lekken buiten dev-comments en het eigen e-mailadres/domein (bewust, al
goedgekeurd). KvK staat al zichtbaar in de footer. Geen wijzigingen nodig gebleken buiten de
MOUSTAINE-correctie hierboven.

### v6b — Kopteksten, minder zelfprijzing, familieverhaal fors ingekort, hero-bugfix (5 juli 2026)

Vervolgronde na het nieuwe logo, op basis van directe feedback van Soef:

- **"Van MOUSTAINE naar AJAR" herschreven** naar **"Een familiebedrijf met diepe wortels"** —
  Soef noemde de oude titel terecht "lelijk, slaat nergens op" (een bezoeker kent de naam
  MOUSTAINE nog niet op dat punt in de tekst). Nieuwe titel is meteen begrijpelijk + een lichte
  woordspeling (wortels = familie én olijfbomen), zonder een boodschap te herhalen die al elders
  op de pagina staat (vgl. "Drie generaties in jaartallen" verderop).
- **Zelfprijzing eruit:** het uitgelichte citaat "Hij verkocht nooit iets waar hij zelf niet
  achter stond — diezelfde eerlijkheid zit vandaag in elke fles AJAR" is volledig verwijderd
  (content + CSS `.family-quote`) — te veel zelfprijzing volgens Soef. Ook het "reputatie"-blok
  van het familieverhaal (dat dezelfde soort claim maakte: "nooit knoeien, altijd zuiver... die
  reputatie is de brug naar de olie van vandaag") is vervallen bij het inkorten hieronder.
- **Familieverhaal drastisch ingekort:** van 6 uitgebreide blokken (Vertrek/Arbeidersjaren/
  Terugkeer/Reputatie/Voortzetting/Vandaag) naar **2 korte alinea's** ("Een nieuw begin" en "Van
  winkeltje tot AJAR") — Soef: "niemand heeft daar tijd voor". Mag nu expliciet **"opa"/
  "kleinzoon"** gebruiken i.p.v. de omslachtige "de oprichter"/"zijn oudste kleinzoon" — voelt
  warmer en menselijker. Nog steeds geen namen, geen onbevestigde jaartallen, geen ziektenaam/
  oorzaak-gevolg-claim bij de gezondheid.
- **"Waarom AJAR" op de homepage** — in plaats van een 5e sectie toe te voegen (zou de bewust
  ingestelde "max 4 secties, geen enkele herhaling"-regel doorbreken), heeft de bestaande
  kernpunten-rij nu een kicker "Waarom AJAR" gekregen (`home.kernpunten.kicker` in content.js,
  nieuwe CSS `.kernpunten-kicker`). Zelfde 3 korte, feitelijke punten als voorheen (familiefabriek
  sinds jaren '90 / koudgeperst single-origin / direct contact met de importeur) — bewust geen
  superlatieven toegevoegd, dat zijn dingen die zichzelf al bewijzen.
- **Bugfix — hero-titel "sprong" na het laden:** de homepage-hero gebruikte `heroWords()`, een
  woord-voor-woord masker-onthulling (elk woord schuift apart omhoog met eigen delay, bovenop de
  al bestaande fade+translateY van de hele hero-tekst-wrapper). Die twee animaties tegelijk gaven
  precies het effect dat Soef meldde: de titel "verandert/verplaatst kort na het laden". Volledig
  verwijderd (`heroWords()`-functie, `.hw`/`.hw-in`-CSS, reduced-motion-regel) — de hero-titel
  gebruikt nu dezelfde simpele, enkele fade+up-reveal als de rest van de site. Dit is ook weer in
  lijn met de oorspronkelijke animatie-regel uit de masterprompt ("geen typewriter-effecten").
- **"Ribbelige letters" verwijderd:** het pagina-brede film-grain-overlay (`body::after`,
  feTurbulence-SVG, opacity .026) liet tekst — vooral grote serif-koppen — ruw/geribbeld aanogen.
  Volledig verwijderd uit `style.css` (was onderdeel van de LUXE-laag-ronde); geen vervanging,
  gewoon weg.
- Geverifieerd (headless Chromium, 390px): hero-titel blijft nu stabiel op dezelfde positie na
  laden (alleen nog de standaard site-brede fade+up-reveal, geen aparte woord-cascade meer), 0
  gebroken beelden/JS-fouten/overflow op alle 7 pagina's, "Waarom AJAR"-kicker en het ingekorte
  familieverhaal renderen correct.

### v6 — Nieuw logo: Cardo-kapitalen + verpakkings-olijfje op de J (5 juli 2026)

Soef wilde het logo opnieuw: een mix van het huidige wordmark en het ajar.ma-bliketiket — "het
olijfje als punt op de J", maar netter/professioneler, en zonder de rood/gele kleuren van de fabriek.
Na een lange iteratieronde (kleine-j-varianten → blokletters → 6 fonts vergeleken → olijfje meermaals
verfijnd op basis van een close-upfoto van het blik) is dit het goedgekeurde eindresultaat:

- **Woordmerk:** AJAR in **Cardo** (klassieke renaissance-boekletter, Google Fonts) — alle letters
  even groot (kapitalen), ruime spatiëring (.055em). Letters als vectorpaden (fontTools+harfbuzz
  shaping, script `gen_final_assets.py` in de sessie-scratchpad — niet in de repo), dus geen
  font-afhankelijkheid in de SVG's.
- **Olijfje** (gecentreerd bóven de J, met wat lucht): zwarte olijf met radiale diepte + glans-sikkel
  die linksboven de ronding volgt, tak die **dun aan de zijkant van de olijf begint** en heel
  geleidelijk aandikt naar een zachte punt rechts-onder (3D naar de kijker), twee slanke blaadjes
  naast elkaar (smalle V, licht schuin) met fijne nerf en groene gradiënten. Expliciete keuzes van
  Soef tijdens de ronde: GEEN witte keyline/streep in de olijf (te druk), blaadjes NIET los van
  elkaar (vlieg-effect), tak niet te dik en niet door het midden van de vrucht.
- **Vervangen bestanden** (zelfde namen, dus geen HTML/JS-wijzigingen): `assets/logo/ajar-header.svg`
  (header + footer; hele mark in `<g class="hdr-twig">` zodat de bestaande hover-sway blijft werken;
  footer kleurt 'm wit via de bestaande `brightness(0) invert(1)`-filter), `ajar-wordmark.svg`
  (nu mét gepade subtitels "EXTRA VIERGE OLIJFOLIE" goud / "TAOURIRT · MAROKKO" grijs — geen
  <text>, dus rendert ook goed in PDF/img), `favicon.svg` (crème tegel + olijfje), `favicon-32.png`,
  `apple-touch-icon.png`, `favicon.ico`, `og-image.png` (1200×630, wordmark op crème).
- **PDF's hergenereerd** (specsheet + presentatie) met het nieuwe wordmark erin.
- Geverifieerd: alle 7 pagina's 0 gebroken beelden, geen JS-fouten, geen overflow (390px);
  header/footer/flesmockup-etiket screenshots gecontroleerd; PDF-headers gecontroleerd.
- **Let op bij volgende sessies:** het logo bestaat alleen als gegenereerde SVG's in
  `assets/logo/` — wijzigingen aan het olijfje = SVG's opnieuw genereren (de bron-scripts staan in
  de scratchpad van deze sessie; bij een nieuwe sessie: het olijfje is gewoon met de hand aan te
  passen in de SVG, de vormen zijn kleine losse paden met commentaarloze maar leesbare structuur).

### v5 — "Onze familie": persoonlijk verhaal op Over ons (5 juli 2026)

Nieuwe formele masterprompt-ronde gaf voor het eerst het volledige, gedetailleerde familieverhaal
aan (eerder ontbrak dit — de tijdlijn had alleen "namen/jaartallen volgen na overleg"). Toegevoegd
op **Over ons**, precies zoals de opdracht voorschrijft: **ná** het vertrouwensblok (ISO 22000) en
**vóór** "De eerste officiële importeur in Nederland" (vertrouwen eerst, emotie als verdieping).

- **Nieuw content.js-veld `about.familyStory`** (kicker/title/quote + 6 blokken), los van het
  bestaande `about.blocks`-array zodat de PDF-generatie (`tools/presentatie.html`, trekt alleen uit
  `about.blocks`) ongewijzigd blijft — dit persoonlijke verhaal hoort op de site, niet in een
  zakelijk factsheet.
- **Zes bouwstenen, exact de opgegeven structuur:** Vertrek (offer, armoede, gezin achtergelaten,
  rond zijn 25e-30e) → Arbeidersjaren (2-3 jaar fabriekswerk NL, niet geromantiseerd) → Terugkeer &
  eerste stap (winkeltje met familielid, olijven) → De reputatie (eerlijke handelaar, nooit
  gesjoemeld — brug naar de olie van nu) → De familie zet voort (vijf zonen: boekhouding, logistiek,
  fabrieksleiding, landbouw, oudste bewaakt de grote lijnen) → Vandaag (gezondheid liet het niet meer
  toe — géén ziektenaam/oorzaak-gevolg-claim; sluit af met de oudste kleinzoon die het product naar
  Nederland brengt). **Geen namen, geen niet-vaststaande jaartallen**, conform kernprincipe #1/#2.
- **Uitgelicht citaat** (eigen formulering, niet letterlijk uit de opdracht overgenomen): "Hij
  verkocht nooit iets waar hij zelf niet achter stond — diezelfde eerlijkheid zit vandaag in elke
  fles AJAR." Groot, goud, Fraunces-cursief, gecentreerd.
- **Nieuwe render-functie `familyStorySection()`** in main.js + helper `aboutBlock()` (bestaande
  block-render-logica ontdubbeld uit `renderAbout()` zodat de blocks-array vóór/ná het verhaal kan
  worden gesplitst zonder duplicatie). CSS-sectie "Onze familie (persoonlijk verhaal)": genummerde
  lijst met dunne olijfgroene lijn + open bolletjes (`.story`/`.story-item`/`.story-dot`) — bewust
  een andere kleur dan de gouden `.timeline` verderop (die staat voor de bevestigde jaartallen-
  tijdlijn) zodat de twee lijst-stijlen niet als herhaling aanvoelen.
- **Animaties strikt volgens sectie 4 van de opdracht** ("niets meer"): elk blok krijgt alleen de
  standaard `.reveal`-fade+translateY met 100ms-stagger per item (inline `transition-delay`, geen
  zelf-tekenende lijn of andere extra toegevoegd — bewust anders dan de bestaande LUXE-laag op de
  rest van de site, omdat déze opdracht expliciet "niets meer" voorschrijft voor animaties).
- Geverifieerd (headless Chromium, 390px en 1280px): sectie rendert tussen ISO-blok en
  importeur-blok, 6 items met juiste titels, geen horizontale overflow, `prefers-reduced-motion`
  toont alles direct (opacity 1), geen nieuwe JS-fouten. `about.blocks` ongewijzigd dus PDF's
  hoeven niet opnieuw gegenereerd te worden.

## 4. Wat is er gebouwd (v1, af)

- **8 pagina's:** Home, Over ons, Product, Kennis (v6g), Zakelijke klanten, Contact, Sample-landingspagina, Privacy.
- **Sample-landing (`sample.html`)** als QR-doel met UTM-per-kanaal + "tip een collega"-veld.
- **Formulieren** (offerte/sample + presentatie-aanvraag) met honeypot, Formspree- of WhatsApp-fallback.
- **B2B-inhoud:** hoe-werkt-het-stappen, FAQ (eerlijke antwoorden, geen dode "volgt"-placeholders meer),
  spec-sheet-download, en het blok **"Waarom nu instappen"** (`b2b.assurance`: direct contact met de
  importeur zelf, leverafspraken vooraf, meegroeien als vroege afnemer) — draait zwakte (nog klein,
  geen klanten) om in kracht (persoonlijke aandacht, vroeg instappen).
- **Design/afwerking:** favicon-set + og-image + vector-logo (gouden olijf/tak op olijfgroen),
  Ken-Burns hero, scroll-progress-balk (goud, bovenaan), back-to-top, blur-up foto's, count-ups,
  reveal-on-scroll. iOS-fixes: zichtbare hamburger (header solid bovenaan, frosted pas bij scrollen),
  klikbaar fullscreen-menu.
- **SEO/tech:** JSON-LD (Organization + Product), OG-tags per pagina, `sitemap.xml`, `robots.txt`,
  `noindex` op privacy, root `404.html` in AJAR-stijl.
- **Foto's aanwezig:** hero-01 (land+berg+bassin), story-02 (boom in bloei), product-03 (olijftak,
  verscherpt), proces-04 (oogst, verscherpt), overons-08, sfeer-09. Van Soef's eigen grond/oogst.
  Laag-res originelen lokaal verscherpt (Lanczos + UnsharpMask); AI-upscale was geblokkeerd.
- **Docs:** `README.md` (beheer), `SHOTLIST.md` (18-shot fotoplan), `LEES-MIJ.txt` (fotostatus),
  `CNAME.example` (custom-domein-route).

### v4b — bugfix mobielmenu + concept-flesmockup (4 juli 2026, zelfde dag)

**Bug (gemeld door Soef: "het menu balkje doet het niet") — gevonden en gefixt:** de v4-toevoeging
"slimme header" zette een permanente `transform: translateY(0)` op `.site-header` als baseline-
regel. Een `transform` op een ouder-element maakt dat element het containing block voor
`position:fixed`-kinderen — `.site-nav` (het volscherm-mobielmenu) werd daardoor opgesloten in de
~90px hoge headerbalk i.p.v. het hele scherm te vullen (rect ging van 390×844 naar 390×138). Het
menu "opende" dus technisch (nav-open werd gezet), maar was onbruikbaar. **Fix:** transform alleen
zetten wanneer `hdr-hide` daadwerkelijk actief is, nooit als permanente baseline, plus een
`body.nav-open .site-header { transform: none !important }`-vangnet. Geverifieerd met een echte
touch-tap-test (iPhone 13-emulatie): menu opent volledig scherm, tik op een link navigeert
succesvol. Volledige audit op alle 7 pagina's (mobiel+desktop): geen gebroken beelden/overflow/
JS-fouten. **Les voor volgende sessies:** een `transform`-eigenschap NOOIT als permanente
CSS-regel op een voorouder van een `position:fixed`-element zetten, ook niet als "no-op"-waarde
zoals translateY(0) — altijd conditioneel via een class.

**Concept-flesmockup toegevoegd** (Soef: "pak een voorbeeldfoto en zet ons logo erop"): geen echte
productfoto gemaakt (fles/etiket bestaan nog niet) — in plaats daarvan een CSS-getekende fles
(zelfde stijl als de bestaande kleine `.fmt-bottle`-silhouetten, nu uitvergroot) met het echte
wordmark-logo als etiket erop, een gouden "CONCEPT"-lint in de hoek, en een cursieve onderschrift-
tekst: "Ontwerprichting — geen productfoto. De definitieve fles en het etiket volgen zodra de
verpakking klaar is." Geplaatst op Zakelijke klanten, direct onder de Formaten-rij (`b.formats.
mockup` in content.js, `bottleMockup()` in main.js, CSS-sectie ".bottle-mockup-*"). Bewust NIET als
gewone foto getoond — dat zou tegen kernprincipe #1 ingaan (nooit iets tonen dat als feit kan
worden aangezien). Geverifieerd op 390px en 1280px: geen overflow, rendert netjes gecentreerd.

### v4 — LUXE-LAAG: agency-niveau animatie-mega-update (4 juli 2026, zelfde dag)

Soef: "Geef alles van heel de site een mega update, animaties alles erop en eraan, groots aanpakken,
je mag toevoegen/veranderen zonder toestemming." Volledige premium-polish over de hele site, allemaal
vanilla (geen libraries), mobile-first, en 100% gedekt in het reduced-motion-blok. CSS-sectie
"LUXE-LAAG" onderaan style.css + `initLuxe()`/`initLightbox()`/`heroWords()`/`marqueeBand()`/
`branchSvg()` in main.js. Wat er nieuw is:

- **MPA View Transitions** (`@view-transition { navigation: auto }`): native cross-fade tussen
  pagina's in moderne browsers; de oude JS-fade (.leaving) draait alleen nog als fallback wanneer
  de browser het niet ondersteunt (anders dubbel effect + onnodige 260ms vertraging).
- **Film-grain** (body::after, SVG-feTurbulence data-URI, opacity .026): maakt de crème-vlakken
  "papier" i.p.v. flat — zelfde stille-luxe-truc als het dashboard.
- **Hero-titel woord-voor-woord masker-onthulling** (`heroWords()` wrapt elk woord in .hw/.hw-in
  met oplopende transition-delay; getriggerd door de bestaande .reveal.in op .hero-text).
- **Sectietitel-maskers**: `.section-head .section-title` en `.page-hero h1` schuiven uit een
  clip-path-masker omhoog zodra hun sectiekop in beeld komt.
- **Fluister-marquee** (home onder de beeldsectie + Product boven het proces): trage lopende band
  (48s) met ALLEEN bevestigde feiten (content.js `marquee`), edge-fade via mask-image, twee
  identieke helften voor naadloze loop; reduced-motion → staat stil.
- **Olijftak die zichzelf tekent** in élke CTA-band (branchSvg(): steel + 3 blaadjes + 2 olijfjes,
  stroke-draw via pathLength=1 bij .cta-band.in) — vervangt de losse druppel (.cta-band-drop nu
  display:none, markup blijft voor evt. terugdraaien). Plus traag ademende gouden gloed
  (.cta-band::before, 11s alternate).
- **Footer-wordmark**: reusachtige outline-"AJAR" (transparent + -webkit-text-stroke, opacity-arm)
  als stille achtergrondlaag onderin de footer.
- **Custom cursor** (desktop/pointer:fine): gouden stip + zachte volg-ring (lerp-follow 0.16), ring
  groeit op links/knoppen. Bewust GEEN `cursor:none` — de native cursor blijft, de ring is een aura
  (veiliger + minder agressief dan de agency-standaard).
- **Magnetische knoppen**: .btn-primary/.nav-cta trekken max ~7px naar de cursor, veren terug.
- **Slimme header**: verbergt zich bij omlaag scrollen (>240px), verschijnt direct bij omhoog —
  werkt óók op mobiel (daar de meeste winst), pauzeert wanneer het volscherm-menu open is.
- **Lightbox** voor fabrieks- en procesfoto's: klik/Enter → fullscreen met blur-backdrop + caption
  (uit alt-tekst), sluit op klik/Escape. Bindt pas ná succesvolle image-load, zodat de icon-tegels
  (proces-06/07, 404-by-design) géén zoom-cursor krijgen.
- **Scroll-gedreven beeld-drift** (CSS `animation-timeline: view()`, @supports-guard): split-media-
  foto's driften subtiel mee met de scroll — 0 JS. Bewust NIET op de factory-gallery (zou daar de
  hover-zoom van de lightbox overschrijven; animation wint van transition op transform).
- **Kernpunten-rij**: gestaggerde entree + scheidingslijnen die vertraagd "aangroeien" (desktop).
- **FAQ**: de bestaande +-marker draait nu vloeiend naar een goud kruis bij openen.
- **Focus-visible**: gouden outline bij toetsenbordnavigatie (toegankelijkheids-luxe).
- E2E-geverifieerd (headless Chromium): 6 hero-woorden onthullen, marquee loopt (en staat stil bij
  reduced-motion), smart header verbergt/toont correct, tak tekent, wordmark aanwezig, lightbox
  opent+sluit (Escape), cursor+magnetic actief op desktop, geen overflow, geen JS-fouten.
- **Let op bij volgende sessies:** de .leaving-JS-fade wordt geskipt als
  `CSS.supports('view-transition-name: none')` — test pagina-overgangen dus in een moderne browser
  vóór je concludeert dat de fade "kapot" is.

### v3b — echte ajar.ma-fabrieksfoto's aangeleverd (4 juli 2026, zelfde dag)

Direct na v3 leverde Soef 5 echte foto's van de moederfabriek in Taourirt aan (rechten in orde,
géén olijfolie maar andere ConservAjar/AJAR-producten: tafelolijven, abrikozenconserven). Alle 5
AI-opgeschaald naar UHD (zelfde stapsgewijze Lanczos+unsharp-methode als eerder — Higgsfield-
upscaler weer geblokkeerd op een goedkeuringsstap).

- **`fabriek-taourirt.jpg`** (de sterkste van de 5: medewerkers die olijven sorteren op de
  fabrieksvloer) vult nu de placeholder die in v3 was klaargezet — op **Over ons** bij "Van
  MOUSTAINE naar AJAR" én in de **home-beeldsectie**. Geen placeholder meer, dit is een echte foto.
- **4 overige foto's** (magazijn met pallets, tafelolijven in emmers, verpakte conserven, verpakte
  olijven) zijn **bewust niet** op de Product-pagina gezet (die gaat alleen over de olie) en
  **bewust niet** als productgrid/aanbod gepresenteerd (harde regel uit de v3-brief: "geen
  opsomming van jam en specerijen als aanbod"). In plaats daarvan: een nieuwe, stille fotostrip-
  sectie op Over ons (`about.factoryGallery` in content.js, `factoryGallery()` in main.js) — alleen
  een korte kicker + 1 zin + 4 rustige foto's zonder namen/prijzen/aanbod-taal, direct onder de
  bestaande 3 tekstblokken en vóór de tijdlijn. Dit is de fotografische tegenhanger van de ene
  toegestane assortiment-zin uit v3, niet een nieuwe verkoopsectie.
- CSS: `.factory-gallery-row` (2×2 op mobiel, 4-op-een-rij vanaf 700px, vierkante crops).
- Geverifieerd: alle 5 bestanden laden (200), geen gebroken images, geen overflow op zowel iPhone-
  als desktopformaat, screenshots bevestigen correcte plaatsing op zowel Over ons als home.
- **Nog openstaand:** `proces-05.jpg` (Persing-stap) is nog een stockfoto van een vorige ronde —
  deze 5 nieuwe foto's tonen conserven-productie, niet specifiek de olieperserij, dus vervangen die
  slot niet automatisch. Zie LEES-MIJ.txt voor de volledige, actuele foto-routekaart.

### v3 — verbeterronde: homepage naar max 4 secties + fabrieksverhaal ajar.ma (4 juli 2026)

Grote, formeel gebriefde verbeterronde ("Verbeter de bestaande AJAR-website" — geen herbouw, gerichte
verandering op specifieke punten). Kernopdracht: **homepage radicaal inkorten** + het fabrieksverhaal
van de moederfabriek ajar.ma verwerken. Geen foto's bijgevoegd in deze ronde ("worden aangeleverd") —
alleen tekst/structuur; foto-slots wel al klaargezet met de juiste bestandsnamen.

**Homepage: van ~7-8 secties naar strikt 4.**
Hero (merk/positionering + 1 zin + 1 CTA — sample) → drie kernpunten (max 6 woorden elk: "Familie­
fabriek sinds jaren '90" · "Koudgeperst, single-origin Marokko" · "Direct contact met de importeur",
géén kaarten/uitleg) → één beeldsectie (fabriek/bomen + 1 zin + link naar Over ons) → slot-CTA
(andere formulering dan de hero, zelfde doel). **Volledig verwijderd:** hero-badges, de losse USP-
kaartenrij, de Taourirt→Amsterdam route-kaart-animatie (SVG+JS, hele feature), de mood-band/sfeer-
band, en de product-splitsectie. Geen van die stukken bevatte een uniek feit — de route-kaart
herhaalde bijvoorbeeld exact wat Product's 4-stappen-proces al toont, de USP's (eerste importeur/
ISO 22000/korte keten) staan al op Over ons en Product. Alleen de plek is opgeschoond, niets aan
informatie is verloren gegaan. Dode CSS/JS opgeruimd (`.route-*`, `.mood-*`, `.hero-badges`,
`testimonialsOrTrust()`, `.quote-card`/`.quote-empty`, het `init3d()`-route-blok).
**Bug gevonden tijdens het opruimen:** `injectJsonLd()` in main.js verwees nog naar het inmiddels
verwijderde `C.home.product.text` (had een runtime-crash gegeven op elke paginaload) — gefixt naar
`C.product.hero.sub`. Les: bij het verwijderen van content.js-velden altijd site-breed grepen op
`home.<veld>`, niet alleen de renderfunctie zelf nakijken.

**Fabrieksverhaal ajar.ma verwerkt (Over ons):**
- Nieuwe zin over het bredere assortiment van de fabriek (tafelolijven, abrikozenpulp, specerijen)
  toegevoegd aan "Van MOUSTAINE naar AJAR" als bewijs van schaal/ervaring — bewust geen productgrid
  of opsomming-als-aanbod, de NL-site verkoopt uitsluitend olijfolie. Paragraaf tegelijk ingekort
  naar 2 zinnen (leesbaarheidsregel: max 2-3 zinnen per alinea).
  De feiten ConservAjar SARL/Taourirt, MOUSTAINE/jaren '90, eigen merk AJAR binnen-en-buitenland en
  ISO 22000/SGS stonden al op de site van een vorige ronde — dit keer alleen de assortiment-zin
  nieuw, en de ISO 22000-formulering nogmaals gecontroleerd: consequent "de productie/fabriek is
  gecertificeerd", nooit gekoppeld aan de NL-import. Geen wijziging nodig, was al eerlijk.
- **Nieuwe fabrieksgevel-foto-slot:** `fabriek-taourirt.jpg` (nog aan te leveren) krijgt de
  prominente plek bij "Van MOUSTAINE naar AJAR" én in de nieuwe home-beeldsectie (zelfde foto/
  verhaal op beide plekken). Het echte, al aanwezige `overons-08.jpg` (berg+bassin) is niet
  weggegooid maar verhuisd naar het blok "De eerste officiële importeur in Nederland".
- Spec-sheet- en presentatie-PDF opnieuw gegenereerd (presentatie.html trekt `about.blocks`
  rechtstreeks uit content.js, dus de nieuwe assortiment-zin staat er nu automatisch in; ISO 22000
  stond al in beide PDF's).

**Nog open (foto's ontbreken nog):** `fabriek-taourirt.jpg` toont een nette placeholder tot Soef 'm
aanlevert. `proces-05.jpg`/`stock-cultivar-olives.jpg` zijn nu nog stockfoto's van een vorige ronde —
zodra de ajar.ma-productie-/olijfbeelden er zijn, die filenames overschrijven (zie LEES-MIJ.txt voor
het volledige overzicht van welke foto waar moet komen). `stock-hero-orchard.jpg` is wees geworden
door het verwijderen van de mood-band — mag weg of ergens anders hergebruikt worden, ligt bij Soef.

**Oplevercheck (uit de opdracht) — status:**
1. Elke boodschap één keer, juiste pagina — ✅ homepage introduceert alleen, subpagina's houden de
   diepgang die er al was.
2. Homepage in 10 seconden te begrijpen zonder alinea's te lezen — ✅ geverifieerd, 4 korte secties.
3. Feiten buiten de tabel — ✅ geen nieuwe feiten toegevoegd behalve de expliciet goedgekeurde
   (ConservAjar/Taourirt, MOUSTAINE/jaren '90, AJAR binnen-buitenland, ISO 22000/SGS, assortiment-
   zin als bewijs van schaal).
4. ISO 22000/MOUSTAINE op Over ons én in de PDF's — ✅.
5. Fabrieksfoto's + niet-olijfolie-beeld weg — ⏳ foto's nog niet aangeleverd; geen niet-olijfolie-
   productbeeld ergens toegevoegd (assortiment blijft tekst, geen grid).
6. iPhone-eerst, elke knop werkt — ✅ mobile-first geverifieerd (headless Chromium 390px, daarna
   1280px), WhatsApp-fallback op formulieren ongewijzigd/intact.

### v2e — hero/mood-band omgewisseld: brede foto hoort niet in een smal kader (4 juli 2026, zelfde dag)

Direct na v2d gaf Soef terecht feedback: de nieuwe olijfgaard-foto is een panorama (2,7:1) en stond
in de hero, die een smal `.img-hero`-kader gebruikt (aspect-ratio 4:5, portret!) — daardoor was in de
praktijk nog maar zo'n 35% van de breedte zichtbaar (in feite bijna maar één boom). Opgelost door de
foto's van rol te laten wisselen i.p.v. het kader te verbouwen:
- **Hero** toont nu **sfeer-09.jpg** (Soefs eigen, al bevestigde foto) — een echte AJAR-foto hoort
  toch al liever op de meest prominente plek dan een stockfoto, dus dit is ook inhoudelijk een
  verbetering, niet alleen een compositie-fix.
- **Mood-band** (de full-bleed sfeerstrook, vaste hoogte/volle breedte, `aspect-ratio:auto`) toont nu
  **stock-hero-orchard.jpg** — precies het kader waar een brede panoramafoto ongecropt tot zijn recht
  komt, in plaats van in een smal portret-kader.
- Alt-teksten meegedraaid: hero heeft nu de eerlijke, specifieke tekst ("Olijfgaard in noordoost-
  Marokko", want een echte AJAR-foto), mood-band de generieke ("Olijfboomgaard, sfeerbeeld", want
  stockfoto — zie ook de opmerking bij v2d over géén "eigen land"-claims op stockfoto's).
- Les voor volgende sessies: **check altijd het aspect-ratio van de doelplek** (`.img-hero`=4:5,
  mood-band=vrij/breed, `.img-tall`=3:4, standaard `.img-slot`=4:3) tegen de daadwerkelijke
  pixelverhouding van de foto, vóórdat je 'm ergens neerzet — een brede foto in een smal kader
  verliest het grootste deel van de compositie.

### v2d — 4 nieuwe sfeerfoto's (UHD) + hero-bergfoto verwijderd (4 juli 2026, zelfde dag)

Soef leverde 4 nieuwe foto's aan (olijfgaard-landschap, olie die in een bak wordt gegoten/persing,
close-up olijven met blad, brood met een lepel olie) en vroeg ze "in ultra HD" te zetten en op de
juiste plek te plaatsen, plus de oorspronkelijke hero-foto (berg + bassin, `hero-01.jpg`, Soefs eigen
foto) van de site te halen.

- **Belangrijk voor volgende sessies: dit zijn AI-opgeschaalde stockfoto's, geen eigen AJAR-beeld.**
  Bronbestanden waren klein (steilste opschaling 768×768 → 3840×3840, 5×); opgeschaald met stapsgewijze
  Lanczos-resampling + UnsharpMask tussen de stappen (de eerdere Higgsfield-upscale-tool bleek in deze
  sessie geblokkeerd op een goedkeuringsstap die niet doorkwam — vandaar de lokale methode). Op
  weergaveformaat (~800–1600px, zoals ze nu op de site staan) ogen ze scherp; alleen de olijven-close-up
  had al zachte bokeh in het origineel en blijft op 100%-inzoom iets zachter.
- **Alt-teksten bewust generiek gehouden** — geen "eigen boomgaard"/"eigen pers in Taourirt"-claims op
  déze specifieke foto's, want dat zou een verzonnen feitelijke claim zijn (zie het kernprincipe
  bovenaan dit dossier). In content.js staat bij elk veld een `/* ... */`-notitie dat het een stockfoto
  is, zodat een volgende sessie ze niet per ongeluk aanziet voor Soefs eigen shotlist-foto's.
- **Plaatsing:**
  1. `home.hero.image`: `hero-01.jpg` (berg+bassin) → **losgekoppeld** (niet meer gerefereerd in
     content.js) en vervangen door `stock-hero-orchard.jpg` (olijfgaard-landschap, brede compositie
     past goed als hero). **Het oude bestand is niet verwijderd** — blijft staan in
     `assets/images/hero-01.jpg` voor het geval Soef 'm terug wil, alleen niet meer in gebruik.
  2. `stock-persing` → opgeslagen als **`proces-05.jpg`** (de bestandsnaam die de Persing-stap in
     `product.process.steps` al verwachtte maar die tot nu toe ontbrak/als icoon toonde). Geen
     content.js-wijziging nodig, vult automatisch de al-bestaande lege plek.
  3. Olijven-close-up → `stock-cultivar-olives.jpg`, nieuw toegevoegd aan `product.cultivar.image`.
     De cultivar-sectie op Product had nog geen enkele foto; nu een beeld+tekst-layout (nieuwe
     `.cultivar-head`-CSS, hergebruikt het bestaande `.split-inner`-patroon) met de kaartenrij eronder.
  4. Brood+olie (proeven) → `stock-sample-tasting.jpg`, nieuw toegevoegd aan `sample.hero.image`.
     De sample-landingspagina had nog geen enkel beeld; nu een foto direct onder de hero-tekst
     (nieuwe `renderSample()`-blok, alleen gerenderd `if (s.hero.image)`).
- **Niet aangepast:** de tekst bij de Persing-processtap ("Koude persing in de eigen perserij...")
  bleef ongewijzigd — dat is een generieke procesbeschrijving die niet specifiek naar déze foto wijst,
  vergelijkbaar met hoe veel B2B-sites illustratieve (niet-documentaire) procesbeelden gebruiken. Mocht
  dit ooit gevoelig liggen: vervang gewoon `proces-05.jpg` zodra een echte foto van de perserij er is.
- Geverifieerd: alle 4 nieuwe bestanden laden (200), geen gebroken images, geen horizontale overflow,
  headless-browser-screenshots van hero/cultivar/sample/proces-stappen bevestigen correcte plaatsing.

### v2c — volledige klantaudit + zakelijk-pagina van 13 naar 9 secties (4 juli 2026, zelfde dag)

Op verzoek van Soef: hele site doorlopen "als een klant die komt bezoeken" — alles wat niet klopt,
dubbel is of ontbreekt. Methode: elke pagina in een echte headless browser bekeken (mobiel + desktop,
console-errors, broken images, overflow), plus content.js kruislings vergeleken op herhaling. Twee
eerste bevindingen bleken achteraf schermafbeeldingsartefacten (te weinig wachttijd voor de
`.reveal`-CSS-transitie in mijn eigen testscript) — geen echte bugs; goed om te weten voor een
volgende sessie: **wacht ≥1.2s ná scrollen voordat je een full-page screenshot gebruikt als bewijs.**

**Geverifieerde bevindingen en wat ermee gedaan is:**
- **Zakelijk-pagina was 13 secties, waarvan 6 bijna-identieke kaartenrijen na elkaar** — precies het
  "bezoeker raakt in de war"-risico. Herstructureerd naar 9 secties:
  - `dualUse` ("In de keuken én op tafel") geschrapt — dekte exact hetzelfde als de Horeca-kaart in
    `b2b.audiences`.
  - `formats` (Formaten) + `pricing` (Prijs) samengevoegd tot één sectie "Wat u krijgt & wat het
    kost" (`.pricing-inline`-stijl i.p.v. eigen kaart/sectie).
  - `tasting` (Proeverij) + `support` (sell-through-hulp) + `gift` (Relatiegeschenk) samengevoegd tot
    één "Voor de winkel"-sectie (`b2b.support.items`, nu 4 items i.p.v. 3, grid-2); de losse
    "Proefmoment voor uw klanten"-bullet in `support` is verwijderd omdat die letterlijk hetzelfde
    was als de proeverij-tegel. Proeverij en Relatiegeschenk houden hun eigen knop (`uspGrid()` kreeg
    een optioneel `button`/`buttonHref`/`ga`-veld + optionele grid-class-parameter).
- **Product-pagina herhaalde "smaak/cijfers komen nog" drie keer** (specs-rij "Smaakprofiel", cultivar-
  kaartje "Proefnotities volgen", kwaliteitscijfers-sectie) — geconsolideerd tot één plek:
  `product.quality.note` is nu de enige "volgt"-melding op de pagina (noemt zowel smaakprofiel als
  labcijfers); de `Oogst`/`Smaakprofiel`-rijen zijn uit `specs.rows` gehaald (nu 5 schone, bevestigde
  rijen, geen `todo`'s meer) en cultivar heeft nog 2 punten i.p.v. 3 (grid-2 i.p.v. grid-3, geen leeg
  derde vak).
- **Drie kleine technische dingen gefixt:**
  1. Op `sample.html` zelf toonde de header nog een "Gratis sample aanvragen"-knop die naar
     `sample.html` zelf linkte. Nu toont de header op die pagina i.p.v. daarvan "Offerte aanvragen"
     (`page === 'sample'`-check in `renderHeader()`).
  2. De query-parameter `?aanvraag=offerte` (gebruikt door bijna elke secundaire CTA op de site) deed
     niets in `initContactForm()` — nu selecteert die "Maandelijks vast volume".
  3. Contactformulier had geen "Relatiegeschenk"-optie in de volume-dropdown, terwijl de Zakelijk-
     pagina relatiegeschenken als apart verkoopargument voert. Toegevoegd + nieuwe param
     `?aanvraag=relatiegeschenk` (gebruikt door de nieuwe "AJAR als relatiegeschenk"-kaart) selecteert
     'm en vult een passend berichtje voor.
- **Nog niet aangepast (bewust, buiten scope van deze ronde):** de FAQ op Zakelijk heeft 3 van de 6
  antwoorden die ontwijkend zijn ("dat bespreken we bij uw aanvraag" — minimale afname/levertijd/
  betaalvoorwaarden). Niet herschreven omdat dat een feitelijke-claims-afweging is (geen cijfers
  verzinnen) die apart met Soef besproken moet worden.
- E2E-geverifieerd: zakelijk.html telt nu 9 `<section>`'s (was 13), support-sectie toont 2 knoppen
  (proeverij + relatiegeschenk), product-specs-tabel heeft 0 `todo`-rijen, sample.html header-CTA
  linkt naar offerte i.p.v. zichzelf, beide nieuwe query-parameters selecteren correct — geen
  horizontale overflow, geen JS-fouten (afgezien van de bekende geblokkeerde Google Fonts-CDN in de
  sandbox).

### v2b — feitcorrectie grond vs. fabriek + homepage-ontdubbeling (4 juli 2026, zelfde dag)

Soef corrigeerde direct na de v2-ronde: **de boomgaarden liggen niet in Taourirt** — dat is
uitsluitend de vestigingsplaats van de fabriek/pers (ConservAjar SARL). De grond/boomgaarden liggen
in de **Debdou-regio** (bevestigd door Soef met een Google Maps-screenshot, gebied ten zuiden van
Taourirt richting Debdou/Al-Mrija). Meerdere teksten uit de v2-ronde conflateerden dit ten onrechte
("boomgaard en pers in Taourirt"). Regel voor toekomstige sessies: **Taourirt = fabriek/persing/
botteling, Debdou-regio = boomgaarden/olijven.** Nooit meer samenvoegen.

Gecorrigeerd (alleen content, geen nieuwe features):
- Hero-badge "Rechtstreeks uit Taourirt" → **"Eigen pers in Taourirt"** (ondubbelzinnig fabrieksfeit).
- Route-kaart: van-punt "Taourirt — boomgaard & eigen pers" → **"Debdou-regio — eigen boomgaarden"**;
  titel/tekst herschreven ("Van boomgaard naar uw zaak"); Taourirt blijft genoemd in de lopende tekst
  als perslocatie, bewust géén los kaartpunt (voorkomt een drukkere kaart).
- Product-cultivar: "de streek rond Taourirt waar de boomgaarden staan" → **"rond Debdou"**.
- Product-specs: "Herkomst: Noordoost-Marokko — eigen productie" gesplitst in twee precieze regels:
  **"Herkomst olijven: Debdou-regio, noordoost-Marokko — eigen boomgaarden"** en
  **"Persing & botteling: koud geperst, eigen fabriek in Taourirt (ConservAjar SARL)"**.
- Spec-sheet-PDF (`specsheet.rows`) evenzo gesplitst + **PDF's opnieuw gegenereerd**
  (`assets/ajar-specsheet.pdf`, `assets/ajar-presentatie.pdf`, via headless Chromium print-to-PDF).
- **Vondst besproken en opgelost:** het `ajar-wordmark.svg` (gebruikt op de twee PDF's, niet in de
  live site-header) heeft "TAOURIRT · MAROKKO" als vaste ondertitel onder "Extra vierge olijfolie" —
  vector-tekst-als-paden, geen los tekstveld. Voorgelegd aan Soef: **bewust zo laten staan** — hij
  vindt het acceptabel omdat het feitelijk de vestigingsplaats van de fabriek is. Niet aankomen
  zonder nieuw verzoek van Soef.

Homepage tegelijk kritischer gemaakt (Soefs zorg: een zakelijke bezoeker raakt in de war door
herhaling): de **vertrouwensrij** (4 cijfertegels: ISO 22000 / 1e / 3 generaties / 0 tussenschakels)
bleek voor 3 van de 4 feiten een letterlijke herhaling van de hero-badges + de USP's erboven, en de
"3 generaties"-tegel dupliceerde de Story-sectie-titel verderop. Vervangen door één korte, eerlijke
tekstregel ("Nog geen klantverhalen — eerlijk: wij zijn nieuw in Nederland…") zonder herhaalde cijfers.
CSS voor de tegel-grid en de bijbehorende 3D-flip-animatie verwijderd (dode code na de vereenvoudiging).

### v2-ronde — concurrentie-gat + 3D-pakket (4 juli 2026)

Volledige review-ronde n.a.v. Soefs Olyfia-screenshot ("kijk wat mist, spiek bij de concurrent, 3D-animaties"):

- **Hero-badges** (`home.hero.badges`): drie feitchips direct in de hero — "ISO 22000 · SGS",
  "Picholine Marocaine", "Rechtstreeks uit Taourirt". Antwoord op Olyfia's zichtbare
  vertrouwenssignalen direct onder de header (Fairtrade-badge). Alleen harde feiten.
- **Route-kaart Taourirt → Amsterdam** (home, `home.route`, sectie `.route-sec`): abstract-elegante
  SVG-route (bewust géén landkaart-details die fout kunnen zijn) — gouden lijn tekent zichzelf bij
  scroll (pathLength=1 + dashoffset), gouden druppel reist over het pad (SMIL `animateMotion`,
  gestart via JS ná de lijn-animatie), pulserende ringen op de eindpunten, labels + statsregel
  "± 2.100 km hemelsbreed · één importeur · nul tussenschakels" (afstand = haversine, gecheckt).
  De korte keten — hét differentiatiepunt t.o.v. Olyfia — nu als beeld i.p.v. alleen tekst.
- **Picholine Marocaine-sectie** op Product (`product.cultivar`, na de specs): cultivar-verhaal in
  drie kaarten (thuis in het oosten / één ras geen blend / proefnotities volgen). Alleen algemene
  cultivar-feiten, géén smaakclaims over AJAR's olie — die volgen met de proefnotities.
- **3D-pakket** (CSS-sectie "3D & DIEPTE" + `init3d()` in main.js, alles reduced-motion-safe):
  - 3D-tilt + meebewegende goudglans op kaarten/tegels (desktop + echte muis; formulieren
    uitgesloten; wacht tot de reveal-entrance klaar is via de `in`-class-guard);
  - hero-foto krijgt lichte 3D-diepte die de muis volgt (`--hrx/--hry`);
  - vertrouwenscijfers klappen 3D open bij scroll (`bigFlip`, gestaffeld);
  - procesnummers kantelen 3D binnen (`numFlip`);
  - de CTA-druppel wiegt traag in 3D (dropSway naast de bestaande dropGlow).
- **Sticky mobiele CTA-balk** (`initMobileCta()`, `mobileCta` in content.js): "Gratis sample" +
  WhatsApp altijd binnen duimbereik op mobiel; verschijnt na ~520px scroll, verbergt zichzelf
  zodra CTA-band of footer in beeld is; niet op sample/contact/privacy (daar staat het formulier al).
  Olyfia-les: de conversieroute is daar altijd één tik weg (winkelwagen) — B2B-equivalent.
- **FAQPage JSON-LD** op zakelijk.html (rich results voor de zes B2B-vragen).
- E2E getest (headless Chromium, 375px + 1280px + reduced-motion): badges/route/cultivar/JSON-LD/
  mob-cta aanwezig, tilt actief op desktop en uit op mobiel, route direct zichtbaar + druppel
  verborgen bij reduced-motion, geen horizontale overflow, geen JS-fouten (enige console-fout in
  de sandbox is de geblokkeerde Google Fonts-CDN — live niet aan de orde).

---

## 5. Concurrentie-analyse

### 5A. Olyfia — olyfia.nl (grootste directe concurrent, NL)

**Kernbevinding: Olyfia verkoopt óók Marokkaanse olijfolie in Nederland.** AJAR kan dus NIET claimen
"de enige/eerste Marokkaanse olijfolie in NL". Toch zit er een duidelijke, gunstige differentiatie-lane.

**Olyfia positionering**
- 100% pure & **biologische** Marokkaanse olijfolie; eigen plantages in **Driouch & Guercif**
  (oost-Marokko — dicht bij Taourirt, waar AJAR vandaan komt).
- Vijf merkpijlers: **Fairtrade, 100% natuurlijk, gezond, puur Marokkaans, duurzaam**.
- Twee cultivars/lijnen: **Arbequina** en **Peculina**. Uitgesproken smaakprofielen op de site
  (Arbequina: zacht, mild-fruitig, appel/citrus/amandel, goudgeel, geen bittere nasmaak).
- **Verhaal "van olijf tot olie"**: oogst vanaf oktober, traditioneel met de hand geplukt, dezelfde
  dag in linnen zakken naar de pers, koudgeperst op lage temperatuur.
- **Sociale impact als speerpunt:** steunt lokale weeshuizen in de regio.

**Olyfia model = grotendeels B2C / retail**
- **Eigen webshop** met flessen 250/500/750/2000/5000 ml, mét prijzen en kortingen
  (bijv. Arbequina 750 ml €24,95; Peculina 250 ml €5,37, 40% korting).
- Verkooppunten-kaart: verkrijgbaar bij speciaalzaken, delicatessen en duurzame webshops.
- Site wordt vernieuwd (`nieuw.olyfia.nl` staat live naast de hoofdsite).

**Wat Olyfia sterker doet dan AJAR nu** (= precies AJAR's databehoefte):
- Echte flesfoto's, concrete prijzen, smaakprofielen, cultivarnamen, certificering (bio/Fairtrade)
  en een concreet sociaal verhaal — allemaal tastbaar. AJAR heeft die data nog niet ingevuld.

**AJAR's differentiatie t.o.v. Olyfia** (hierop leunen):
1. **Puur B2B / foodservice**, geen consumenten-webshop en geen kortingssfeer → serieuzer,
   zakelijker kanaal; horeca wil een leverancier, geen webshop-merk met 40%-acties.
2. **Directe importeur = één vast aanspreekpunt** (het `assurance`-blok) tegenover een
   retail-/webshopmerk met tussenlagen.
3. **Familiebedrijf met eigen fabriek sinds de jaren '90** (ConservAjar/MOUSTAINE) — herkomst en
   continuïteit als verhaal, niet plantage-marketing.
4. **Kans:** noem AJAR's **cultivar** concreet (Marokko's dominante tafel-/olie-cultivar is
   **Picholine Marocaine / "Moroccan Picholine"**) — maar alléén als Soef dit bevestigt. Niet gokken.

**Strategisch advies n.a.v. Olyfia:** niet concurreren op "Marokkaans" (dat claimt Olyfia al), maar op
**zakelijke betrouwbaarheid, directheid en horeca-fit**. Vermijd Olyfia's consumenten-/kortingstoon.

**Verwerkt in de v2-ronde (4 juli 2026):** hero-feitchips (antwoord op Olyfia's badge-onder-header),
route-kaart als beeld van de korte keten, Picholine-sectie, sticky mobiele CTA (B2B-equivalent van
Olyfia's altijd-zichtbare winkelwagen). Zie §4 → v2-ronde.

### 5B. Gkazas — gkazas.com (eerder besproken concurrent)

Griekse extra vierge olijfolie, premium/verzorgde uitstraling, deels B2B/horeca-gericht. Diende als
**design-/toonreferentie** (rustige luxe, veel wit, groot beeld) — niet als herkomst-concurrent.
AJAR's onderscheid blijft: Marokkaanse herkomst + directe-importeur-verhaal.

---

## 6. Openstaande TODO's — wat Soef moet aanleveren

> **v7 (10 juli 2026): het actuele, volledige overzicht staat nu in `LANCERING-CHECKLIST.md`**
> (incl. juridische stappen: NVWA-registratie, etiket-eisen, btw-id, verzekering, AV-aannames).
> Onderstaande lijst blijft staan als historie maar de checklist is leidend.

Deze gaten kan alléén Soef vullen; **nooit invullen met verzonnen data.** Zodra hij ze levert,
verdwijnen de "volgt"-placeholders vanzelf.

**Status per 4 juli 2026 (laatste check-in met Soef):**
- ✅ **Cultivar bevestigd: Picholine Marocaine** — toegevoegd aan `content.js` (`product.specs.rows`,
  regel "Olijfvariëteit"), geen `todo` meer, staat nu gewoon op de site.
- ⏳ **Certificering: in aanvraag** — nog niet definitief, dus placeholder blijft staan tot het
  certificaat er is (bio/Fairtrade/ISO-achtig, exacte vorm nog onbekend).
  **LET OP vóór lancering (v6f):** de topbar rouleert alvast door "Fairtrade"/"Duurzaam"/
  "100% natuurlijk" (`topbar.pendingItems` in `content.js`) — Soefs eigen keuze, omdat de site nog
  niet actief gepromoot wordt. **Zijn de certificaten er bij lancering nog niet: zet
  `topbar.showPending = false`.**
- ⏳ **Prijzen: komt nog** — bewust nog niet tonen; `assurance`-blok ("leverafspraken vooraf") vangt
  dit gat voorlopig op.
- ⏳ **Flessen: moeten nog komen** — verpakking/fles is nog niet klaar, dus nog geen productfoto
  van de fles mogelijk; site gebruikt tot die tijd sfeer-/olijffoto's, geen mockup verzinnen.

**Data / inhoud (kritisch voor vertrouwen):**
- [ ] **Smaakprofiel** van de olie (bijv. fruitig/pittig/mild, nasmaak) — Olyfia heeft dit wél.
- [ ] **Kwaliteitscijfers:** zuurgraad (%), evt. polyfenolen, oogstjaar.
- [x] ~~Cultivar~~ → **Picholine Marocaine, bevestigd en verwerkt.**
- [ ] **Certificering** — in aanvraag, nog niet definitief.
- [ ] **Prijsindicatie / staffels** voor zakelijke afname — komt nog, bewust "op aanvraag" gelaten.
- [ ] **Minimale afname / verpakking / gebindes** (bijv. 5 L blik, doosinhoud).
- [ ] **Houdbaarheid (THT)** en opslagadvies.
- [ ] **Echte flesfoto / verpakkingsfoto** — kan pas zodra de fles/verpakking klaar is.
- [ ] **Eerste klant / referentie / testimonial** (zodra beschikbaar).
- [ ] **Tijdlijn-jaartallen** (oprichting, mijlpalen) voor Over ons.

**Foto's (zie SHOTLIST.md):**
- [ ] `proces-05.jpg`, `proces-06.jpg`, `proces-07.jpg` ontbreken (tonen nu gouden icon, 404 by design).
- [ ] Hogere-resolutie originelen van de reeds verscherpte foto's, indien mogelijk.

**Techniek / config (klein, door Soef of in een sessie):**
- [ ] `formspreeId` in `content.js` (nu leeg → WhatsApp-fallback actief).
- [ ] `gaId` (GA4) in `content.js` (nu leeg → geen tracking, geen cookiebanner).
- [ ] Zakelijk **e-mailadres** (nu voorlopig `sofyanghaddari@gmail.com`).
- [ ] KvK staat ingevuld (77755170). Custom domein: zie README.md (aparte repo nodig i.v.m. gedeelde Pages).
- [ ] `showPartners: true` zodra er echte verkooppunten/logo's zijn.

**Optioneel / later:**
- [ ] Multi-agent klantreview (4 persona's) opnieuw draaien wanneer de sessielimiet dat toelaat.
- [ ] Cultivar/smaak toevoegen zodra bevestigd → dan óók spec-sheet + presentatie-PDF hergenereren.

---

## 7. Snelle context voor een nieuwe sessie

1. Lees dit bestand + `ajar/README.md`.
2. `git log --oneline -15` voor recente commits.
3. Tekst wijzigen? → **alleen** `ajar/js/content.js`.
4. Ajar-wijziging = **geen** cache-bump. Dashboard-wijziging = wél (`service-worker.js` + `APP_VERSION`).
5. Push naar `main` → GitHub Pages deployt in 1–2 min. Bij 404: eerst de Pages-run checken.
6. Werk in het Nederlands; verzin nooit productdata; houd Soefs persoonsnaam van de site.

_Bronnen concurrentie-analyse: olyfia.nl (over-olyfia, verkooppunten, productieproces, webshop-prijzen),
gkazas.com. Olyfia niet direct te fetchen (403) — via zoekresultaten samengesteld, juli 2026._
