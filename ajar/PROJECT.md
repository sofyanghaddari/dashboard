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
3. **Nooit automatisch mailen.** Formulieren gaan via Formspree of vallen terug op WhatsApp/mailto —
   altijd na expliciete klik van de bezoeker.
4. **Eén bron van waarheid:** alle teksten/config in `js/content.js`. Pagina's renderen zichzelf
   daaruit via `js/main.js`. Nooit tekst hardcoden in de HTML-shells.
5. **Alles met `prefers-reduced-motion`-guard.** Animaties zijn subtiel en uitschakelbaar.
6. **AVG:** GA4 laadt pas ná cookie-toestemming; EXIF uit foto's gestript; privacy-pagina `noindex`.
7. **Eerlijk over de status.** Placeholders zijn zichtbaar als placeholder, niet gecamoufleerd.

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

## 4. Wat is er gebouwd (v1, af)

- **7 pagina's:** Home, Over ons, Product, Zakelijke klanten, Contact, Sample-landingspagina, Privacy.
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

Deze gaten kan alléén Soef vullen; **nooit invullen met verzonnen data.** Zodra hij ze levert,
verdwijnen de "volgt"-placeholders vanzelf.

**Status per 4 juli 2026 (laatste check-in met Soef):**
- ✅ **Cultivar bevestigd: Picholine Marocaine** — toegevoegd aan `content.js` (`product.specs.rows`,
  regel "Olijfvariëteit"), geen `todo` meer, staat nu gewoon op de site.
- ⏳ **Certificering: in aanvraag** — nog niet definitief, dus placeholder blijft staan tot het
  certificaat er is (bio/Fairtrade/ISO-achtig, exacte vorm nog onbekend).
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
