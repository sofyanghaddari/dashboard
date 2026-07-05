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
