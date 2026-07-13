# AJAR — B2B olijfolie-website

Statische site (vanilla HTML/CSS/JS, geen build) voor AJAR extra vierge olijfolie.
Live: **https://sofyanghaddari.github.io/dashboard/ajar/**

## Alles aanpassen op één plek: `js/content.js`

Alle teksten, contactgegevens en instellingen staan in `js/content.js`. De pagina's renderen zichzelf daaruit. Belangrijkste instellingen bovenin (`config`):

| Sleutel | Wat | Status |
|---|---|---|
| `brandName` | Merknaam — wijzigt overal in één keer | AJAR |
| `goatcounterCode` | GoatCounter site-code (gratis, geen creditcard). Leeg = geen tracking geladen | **TODO** |
| `formspreeId` | Formspree form-ID. Leeg = formulieren vallen netjes terug op WhatsApp met voorgevuld bericht | ✅ ingesteld |
| `email` | Zakelijk e-mailadres. Leeg = nergens getoond, WhatsApp is primair kanaal | **TODO** |
| `kvk` | KvK-nummer (footer toont "volgt" zolang leeg) | **TODO** |
| `domain` | Basis-URL — aanpassen bij custom domein | github.io |
| `showPartners` | `true` zodra er echte verkooppunten zijn ("Verkrijgbaar bij" op home) | false |
| `presentationPdf` | Pad naar bedrijfspresentatie-PDF zodra gemaakt — het aanvraagformulier toont dan een downloadlink na verzenden | **TODO** |

### Menu met uitklap-submenu's

De lange pagina's (Over ons, Product, Zakelijke klanten) hebben een dropdown in het menu waarmee een klant direct naar een sectie springt. Dit staat in `content.js` onder `nav`: een menu-item met een `children`-array krijgt automatisch een submenu. Elke sub-link verwijst naar een sectie-`#id` op de pagina (bv. `product.html#proces`). **Let op:** die `#id`'s worden door `main.js` op de secties gezet (in de renderfuncties). Pas je een anchor aan in `content.js`, pas dan óók de bijbehorende `id=""` in `main.js` aan — anders landt de sprong nergens. Klik op de pagina zelf = soepel scrollen + de sectie licht kort op (geen herlaad); vanaf een andere pagina = navigeren en op de juiste sectie landen.

Overige TODO's zijn in `content.js` gemarkeerd met `todo: true` (FAQ-antwoorden, doosinhoud, THT, kwaliteitscijfers, tijdlijn-jaartallen) — op de site verschijnen ze cursief goud als "volgt".

## Meertalig (NL / EN / FR)

De site heeft een taalschakelaar (globe rechtsboven, en onderin het mobiele menu). **Nederlands is de basistaal** in `js/content.js`; de vertalingen staan in **`js/content.en.js`** en **`js/content.fr.js`**, die dezelfde structuur/sleutels hebben en de teksten overschrijven. `js/i18n.js` kiest de taal (opgeslagen keuze in `localStorage`, standaard NL) en **valt per ontbrekende sleutel terug op NL**.

- **Nieuwe of gewijzigde tekst?** Pas 'm aan in `content.js` (NL) en werk dezelfde sleutel bij in `content.en.js` + `content.fr.js`. Vergeet je een vertaling, dan toont de site voor dat stukje gewoon het Nederlands (geen kapotte pagina).
- **Standaard NL** — er is bewust geen automatische browsertaal-detectie (een NL-klant met een Engelse browser blijft zo op Nederlands). Bezoekers kiezen zelf EN/FR.
- **Let op (SEO):** dit is een client-side taalwissel op dezelfde URL. Voor volledige meertalige SEO (aparte URL's per taal + `hreflang`) is een grotere ingreep nodig; de vertalingen zijn nu vooral voor menselijke bezoekers (Engels-/Franstalige inkopers).

## Bewaar/deel + QR-code

De contactpagina heeft "Bewaar contact" (vCard `.vcf` → gaat in Contacten op iPhone/Android), "Deel" (Web Share, valt terug op link-kopiëren) en een **QR-code** (`assets/qr-site.svg`). De QR wijst naar de site-URL; bij een custom domein opnieuw genereren (zie de domein-sectie hieronder). Een echte **Apple Wallet-pass** kan niet op een statische site (vereist Apple-certificaten + ondertekening) — de vCard is het praktische equivalent.

## Foto's vervangen

Zet JPG's met de juiste bestandsnaam in `assets/images/` — zie `assets/images/LEES-MIJ.txt` en `SHOTLIST.md`. Zolang een foto ontbreekt staat er een nette gradient-placeholder. Tip: max ± 300 KB per foto (1600px breed is genoeg); de site lazy-loadt alles automatisch.

## Sample-landingspagina (QR-doel)

`sample.html` is de landingspagina voor gratis samples — richt je QR-codes dáárop, met UTM per kanaal:
`…/ajar/sample.html?utm_source=visitekaartje` of `?utm_source=taxi-sample`. Het formulier heeft een
"tip een collega-ondernemer"-veld (gaat mee in de aanvraag) en werkt via Formspree of de WhatsApp-fallback.

## Formspree instellen (formulieren)

1. Account op formspree.io → New form → e-mailadres kiezen waarop je aanvragen wilt ontvangen.
2. Het form-ID (het deel achter `/f/`, bijv. `xqkrgwyz`) invullen bij `formspreeId` in `content.js`.
3. Klaar — beide formulieren (offerte/sample + presentatie-aanvraag) posten er dan naartoe, met honeypot-antispamveld. Zonder ID openen ze WhatsApp met de ingevulde gegevens als bericht.

## Bezoekersstatistieken (GoatCounter) instellen

Sinds v21 gebruikt de site **GoatCounter** in plaats van Google Analytics: gratis, geen cookies, geen persoonsgegevens — daarom is er ook geen cookiebanner meer (die is verwijderd, niet alleen verborgen).

1. Gratis account op [goatcounter.com](https://www.goatcounter.com/) → kies een site-code (dat wordt `CODE.goatcounter.com`).
2. De code (zonder `.goatcounter.com`) invullen bij `goatcounterCode` in `content.js`.
3. Klaar — het script laadt vanaf dat moment op elke pagina, geen consent-stap nodig.
4. Events die al klaarstaan (via `data-ga-event`, verstuurd als GoatCounter-"events"): `sample_cta_click`, `offerte_cta_click`, `offerte_aanvraag`, `specsheet_download`, `presentatie_aanvraag`, `whatsapp_click`.
5. QR-codes: gebruik UTM-parameters, bijv. `…/ajar/?utm_source=visitekaartje` of `?utm_source=taxi-sample` — GoatCounter toont de referrer/campagne in het "Pages"-overzicht.

## Spec-sheet-PDF hergenereren

De download op de B2B-pagina is `assets/ajar-specsheet.pdf`, gegenereerd uit de `specsheet`-sectie in `content.js` via het template `tools/specsheet.html`. Na een contentwijziging opnieuw genereren:

- **Makkelijkst:** open `tools/specsheet.html` in de browser → afdrukken → "Bewaar als PDF" (A4, geen marges, achtergronden aan) → opslaan als `assets/ajar-specsheet.pdf`.
- Of vraag het in een Claude Code-sessie ("hergenereer het spec-sheet").

## Bedrijfspresentatie-PDF hergenereren

De download achter het mini-formulier op de B2B-pagina is `assets/ajar-presentatie.pdf`,
gegenereerd uit `content.js` via `tools/presentatie.html` (4 A4-pagina's: cover, verhaal,
product, kwaliteit & zakelijk). Na een contentwijziging opnieuw genereren: open
`tools/presentatie.html` in de browser → afdrukken → "Bewaar als PDF" (A4, geen marges,
achtergronden aan) → opslaan als `assets/ajar-presentatie.pdf`. Of vraag het in een
Claude Code-sessie ("hergenereer de bedrijfspresentatie").

## Custom domein koppelen (zodra geregistreerd)

**Let op:** deze site deelt de GitHub Pages-deploy met het dashboard (zelfde repo). Een `CNAME`-bestand geldt voor de héle repo-site en zou ook het dashboard verhuizen. Daarom staat hier alleen `CNAME.example`. De juiste route:

1. **Maak een eigen repo** voor de site (bijv. `sofyanghaddari/ajar`), kopieer de map `ajar/` daarheen (inhoud in de root) en zet GitHub Pages aan (Settings → Pages → main).
2. Zet in die repo een `CNAME`-bestand met alléén het domein (bijv. `ajar-olijfolie.nl`).
3. Bij de domein-registrar: A-records voor het apex-domein naar GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, en een CNAME-record voor `www` naar `sofyanghaddari.github.io`.
4. In GitHub Settings → Pages: custom domain invullen + **Enforce HTTPS** aanvinken (kan pas na DNS-propagatie).
5. Daarna bijwerken: `domain` in `content.js`, en per HTML-pagina de `og:url`/`og:image`-tags én de `<link rel="canonical">` in de head (alle pagina's), plus `sitemap.xml` en `robots.txt`. Genereer ook de **QR-code opnieuw** (`assets/qr-site.svg`) zodat die naar het nieuwe domein wijst (bijv. met een `qrcode`-tool of vraag het in een Claude Code-sessie).

Alle interne links zijn relatief, dus de site werkt ongewijzigd op beide domeinen. De
**Content-Security-Policy** (`<meta http-equiv="Content-Security-Policy">` in elke pagina-head,
v20) hoeft bij een domeinwissel **niet** aangepast te worden — die verwijst naar het eigen domein
altijd als `'self'`, nooit hardcoded naar `sofyanghaddari.github.io`.

## SEO-notities

- `robots.txt` en `sitemap.xml` staan in deze map; op een *project*-site (github.io/dashboard/ajar/) leest Google robots.txt niet vanaf de domein-root — volledig effectief worden ze pas op het custom domein (eigen repo, stap hierboven).
- OG-tags (voor mooie WhatsApp-previews) staan per pagina in de HTML-head met absolute URL's — bij domeinwissel dus even mee-updaten (zie stap 5 hierboven).
- Structured data (Organization + Product) wordt door `main.js` uit `content.js` gegenereerd.

## Site online houden (uptime-monitoring)

GitHub Pages heeft al eens gehaperd (zie PROJECT.md v30). Een gratis externe monitor waarschuwt je
zodra de site plat ligt — GitHub Pages meldt dat zelf niet.

1. Gratis account op [uptimerobot.com](https://uptimerobot.com/) (geen creditcard).
2. **+ New Monitor** → HTTP(s) → URL `https://sofyanghaddari.github.io/dashboard/ajar/` → interval
   5 minuten (gratis plan).
3. Onder **Alert Contacts**: je eigen e-mail (en optioneel de UptimeRobot-app voor push op je
   telefoon) toevoegen aan de monitor.
4. Klaar — je krijgt een melding zodra de site niet meer bereikbaar is (of weer online komt).

## Vindbaarheid buiten de site (Google & LinkedIn)

Voor een B2B-leverancier weegt dit vaak zwaarder dan de website zelf — een inkoper checkt dit vóór
hij WhatsApt. Geen code, kost samen een uurtje.

**Google Bedrijfsprofiel** (gratis, [google.com/business](https://www.google.com/business/)):
1. Profiel aanmaken met naam "AJAR", categorie "Olijfolieleverancier"/"Importeur", adres
   Jephtastraat 28H, 1055 JV Amsterdam, telefoonnummer en website-URL.
2. Verificatie via een postkaart of telefoon (Google bepaalt de optie op basis van je adres).
3. Zodra geverifieerd: eerste review(s) vragen aan een tevreden klant — een B2B-leverancier met
   écht een paar Google-reviews wekt aanzienlijk meer vertrouwen dan een zonder.
4. Dit is meteen ook waar "olijfolie leverancier Amsterdam"-achtige zoekopdrachten op landen —
   sterker voor vindbaarheid dan verdere SEO-tweaks aan de site zelf.

**LinkedIn-bedrijfspagina** (gratis, [linkedin.com/company/setup/new](https://www.linkedin.com/company/setup/new/)):
1. Bedrijfspagina aanmaken (geen persoonlijk profiel nodig als koppeling, al helpt dat wel voor
   bereik) met naam, logo (`assets/logo/ajar-header.svg` exporteren als PNG) en de payoff-tekst
   uit `content.js` (`config.payoff`).
2. Eén introductiepost is genoeg om 'm niet leeg te laten ogen.
3. Link naar de site in het profiel; zet de LinkedIn-URL daarna in `content.js` onder `socials`
   (zelfde patroon als een toekomstige Instagram-link) zodat 'm in de footer verschijnt.

Voeg na een domeinwissel een tweede monitor toe voor het nieuwe domein (of pas de URL van de
bestaande monitor aan) — anders bewaakt hij straks een adres dat niemand meer gebruikt.

## Automatische smoke-test (CI)

`.github/workflows/ajar-smoke-test.yml` draait bij elke push naar `main` die `ajar/` of
`404.html` raakt (en op elke pull request): laadt alle 9 pagina's + de 404-pagina headless en
faalt zodra er iets kapot is (JS-fouten, CSP-violations, een vastgelopen foto-slot, een
offerteformulier dat niet meer client-side valideert). Zie `ajar/tools/smoke-test.mjs` voor de
checks zelf — ook lokaal te draaien (`node ajar/tools/smoke-test.mjs` met een lokale server via
`SMOKE_BASE_URL`) vóórdat je pusht.

## Vervolgstappen (bewust buiten v1)

- **PDF one-pager / bedrijfspresentatie** — genereren uit dezelfde content (zelfde aanpak als het spec-sheet); daarna `presentationPdf` invullen.
- Eigen repo + custom domein (zie hierboven).
- Partnerwall aanzetten zodra er afnemers zijn (`showPartners: true` + logo's in `assets/images/`).
