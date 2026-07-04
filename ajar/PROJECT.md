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

### 5B. Gkazas — gkazas.com (eerder besproken concurrent)

Griekse extra vierge olijfolie, premium/verzorgde uitstraling, deels B2B/horeca-gericht. Diende als
**design-/toonreferentie** (rustige luxe, veel wit, groot beeld) — niet als herkomst-concurrent.
AJAR's onderscheid blijft: Marokkaanse herkomst + directe-importeur-verhaal.

---

## 6. Openstaande TODO's — wat Soef moet aanleveren

Deze gaten kan alléén Soef vullen; **nooit invullen met verzonnen data.** Zodra hij ze levert,
verdwijnen de "volgt"-placeholders vanzelf.

**Data / inhoud (kritisch voor vertrouwen):**
- [ ] **Smaakprofiel** van de olie (bijv. fruitig/pittig/mild, nasmaak) — Olyfia heeft dit wél.
- [ ] **Kwaliteitscijfers:** zuurgraad (%), evt. polyfenolen, oogstjaar.
- [ ] **Cultivar** (waarschijnlijk Picholine Marocaine — te bevestigen).
- [ ] **Certificering** (bio? Fairtrade? lab-/analysecertificaat?) of eerlijk "in aanvraag".
- [ ] **Prijsindicatie / staffels** voor zakelijke afname (of "op aanvraag" bewust laten).
- [ ] **Minimale afname / verpakking / gebindes** (bijv. 5 L blik, doosinhoud).
- [ ] **Houdbaarheid (THT)** en opslagadvies.
- [ ] **Echte flesfoto / verpakkingsfoto** in productiekwaliteit.
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
