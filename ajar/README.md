# AJAR — B2B olijfolie-website

Statische site (vanilla HTML/CSS/JS, geen build) voor AJAR extra vierge olijfolie.
Live: **https://sofyanghaddari.github.io/dashboard/ajar/**

## Alles aanpassen op één plek: `js/content.js`

Alle teksten, contactgegevens en instellingen staan in `js/content.js`. De pagina's renderen zichzelf daaruit. Belangrijkste instellingen bovenin (`config`):

| Sleutel | Wat | Status |
|---|---|---|
| `brandName` | Merknaam — wijzigt overal in één keer | AJAR |
| `gaId` | GA4 measurement-ID (`G-XXXXXXXXXX`). Leeg = geen tracking én geen cookiebanner | **TODO** |
| `formspreeId` | Formspree form-ID. Leeg = formulieren vallen netjes terug op WhatsApp met voorgevuld bericht | **TODO** |
| `email` | Zakelijk e-mailadres. Leeg = nergens getoond, WhatsApp is primair kanaal | **TODO** |
| `kvk` | KvK-nummer (footer toont "volgt" zolang leeg) | **TODO** |
| `domain` | Basis-URL — aanpassen bij custom domein | github.io |
| `showPartners` | `true` zodra er echte verkooppunten zijn ("Verkrijgbaar bij" op home) | false |
| `presentationPdf` | Pad naar bedrijfspresentatie-PDF zodra gemaakt — het aanvraagformulier toont dan een downloadlink na verzenden | **TODO** |

### Menu met uitklap-submenu's

De lange pagina's (Over ons, Product, Zakelijke klanten) hebben een dropdown in het menu waarmee een klant direct naar een sectie springt. Dit staat in `content.js` onder `nav`: een menu-item met een `children`-array krijgt automatisch een submenu. Elke sub-link verwijst naar een sectie-`#id` op de pagina (bv. `product.html#proces`). **Let op:** die `#id`'s worden door `main.js` op de secties gezet (in de renderfuncties). Pas je een anchor aan in `content.js`, pas dan óók de bijbehorende `id=""` in `main.js` aan — anders landt de sprong nergens. Klik op de pagina zelf = soepel scrollen + de sectie licht kort op (geen herlaad); vanaf een andere pagina = navigeren en op de juiste sectie landen.

Overige TODO's zijn in `content.js` gemarkeerd met `todo: true` (FAQ-antwoorden, doosinhoud, THT, kwaliteitscijfers, tijdlijn-jaartallen) — op de site verschijnen ze cursief goud als "volgt".

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

## Google Analytics (GA4) instellen

1. GA4-property aanmaken → measurement-ID (`G-…`) bij `gaId` in `content.js`.
2. GA laadt **alleen na "Accepteren"** in de cookiebanner (AVG). Bij "Weigeren" wordt niets geladen of gemeten.
3. Events die al klaarstaan: `sample_cta_click`, `offerte_cta_click`, `offerte_aanvraag`, `specsheet_download`, `presentatie_aanvraag`, `whatsapp_click`.
4. QR-codes: gebruik UTM-parameters, bijv. `…/ajar/?utm_source=visitekaartje` of `?utm_source=taxi-sample` — GA4 pikt die automatisch op, geen extra werk.

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
5. Daarna bijwerken: `domain` in `content.js`, en per HTML-pagina de `og:url`/`og:image`-tags én de `<link rel="canonical">` in de head (alle pagina's), plus `sitemap.xml` en `robots.txt`.

Alle interne links zijn relatief, dus de site werkt ongewijzigd op beide domeinen.

## SEO-notities

- `robots.txt` en `sitemap.xml` staan in deze map; op een *project*-site (github.io/dashboard/ajar/) leest Google robots.txt niet vanaf de domein-root — volledig effectief worden ze pas op het custom domein (eigen repo, stap hierboven).
- OG-tags (voor mooie WhatsApp-previews) staan per pagina in de HTML-head met absolute URL's — bij domeinwissel dus even mee-updaten (zie stap 5 hierboven).
- Structured data (Organization + Product) wordt door `main.js` uit `content.js` gegenereerd.

## Vervolgstappen (bewust buiten v1)

- **PDF one-pager / bedrijfspresentatie** — genereren uit dezelfde content (zelfde aanpak als het spec-sheet); daarna `presentationPdf` invullen.
- Eigen repo + custom domein (zie hierboven).
- Partnerwall aanzetten zodra er afnemers zijn (`showPartners: true` + logo's in `assets/images/`).
