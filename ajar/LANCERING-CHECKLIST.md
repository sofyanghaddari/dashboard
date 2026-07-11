# AJAR — Lancering-checklist (compleet overzicht)

> **Voor Soef.** Dit is het totaaloverzicht van wat de site al heeft, wat er in de
> overhaul-ronde van 10 juli 2026 (v7) is toegevoegd/gerepareerd, en — het belangrijkste —
> **alles wat jij nog moet aanleveren of beslissen** vóór de echte lancering.
> Zie ook `PROJECT.md` (projectgeheugen) en `README.md` (beheer).

---

## A. Wat de site nu compleet heeft ✅

| Onderdeel | Status |
|---|---|
| 9 pagina's: Home, Over ons, Product, Kennis, Zakelijk, Contact, Sample, Privacy, **Algemene voorwaarden (nieuw)** | ✅ |
| Alle teksten geschreven (geen lorem ipsum, geen verzonnen productdata) | ✅ |
| Privacyverklaring (AVG-compleet: formulieren, nieuwsbrief, GA4, hosting, rechten, cookies) | ✅ |
| Algemene voorwaarden B2B (14 artikelen, gewone taal, incl. intellectueel eigendom) | ✅ — *wel punt C1 checken* |
| Cookiebanner + GA4 pas ná toestemming + cookie-voorkeuren aanpasbaar (footer-link) | ✅ |
| Formulieren: offerte, sample, presentatie, nieuwsbrief — met WhatsApp/mailto-fallback | ✅ |
| Spec-sheet-PDF (vrij) + bedrijfspresentatie-PDF (achter mini-formulier) | ✅ |
| SEO: titels/descriptions per pagina, OG-tags, canonical, sitemap, robots, JSON-LD (Organization + Product + FAQ) | ✅ |
| Lettertypen lokaal gehost (geen Google-CDN → AVG-veilig + sneller) | ✅ v7 |
| Foto's geoptimaliseerd voor web (was ~16 MB aan beeld, nu ~4 MB) | ✅ v7 |
| Toegankelijkheid: skip-link, focus-stijlen, reduced-motion overal, aria-labels | ✅ |
| 404-pagina in AJAR-stijl (repo-root, dekt de hele site) | ✅ |

## B. Wat er in deze ronde (v7, 10 juli 2026) is gedaan

1. **Algemene voorwaarden geschreven** — nieuwe pagina `voorwaarden.html`, gelinkt in de footer.
   14 artikelen: toepasselijkheid, offertes, bestelling, levering, betaling, eigendomsvoorbehoud,
   klachten, samples, aansprakelijkheid, overmacht, recht/geschillen, intellectueel eigendom,
   wijzigingen, bedrijfsgegevens.
2. **Privacyverklaring uitgebreid** — nieuwsbrief-verwerking, e-mail als contactkanaal, KvK-nummer,
   hosting (GitHub Pages), dataportabiliteit, beveiligingsparagraaf, cookie-voorkeuren-uitleg.
3. **Google Fonts vervangen door lokaal gehoste fonts** — het laden van fonts via Google's CDN
   stuurde bezoekers-IP's naar Google vóór cookie-toestemming (in Duitsland al beboet als
   AVG-schending). Nu 4 lokale woff2-bestanden; site is er ook sneller en offline-vriendelijker door.
4. **Foto's geoptimaliseerd** — alle gebruikte foto's teruggebracht naar max 1800px / ~110–570 KB
   (was tot 2,6 MB per stuk). "Over ons" laadde eerst ~10 MB aan beeld op mobiel.
5. **Cookie-voorkeuren aanpasbaar** — footer-link heropent de cookiemelding (verschijnt zodra GA4 aanstaat).
6. **Telefoonnummer zichtbaar** — +31 6 40 29 35 67 als klikbare bel-link in footer en op Contact
   (niet elke inkoper gebruikt WhatsApp); e-mailadres nu ook op de Contact-pagina zelf.
7. **Presentatie-tekst gecorrigeerd** — beloofde "u ontvangt de presentatie zodra die beschikbaar is",
   maar de PDF bestaat al en de downloadlink verschijnt direct. Tekst zegt dat nu ook.
8. **Succesmelding scrollt in beeld** — na een formulier-verzending op mobiel stond de bevestiging
   vaak buiten beeld; die scrolt nu zacht in beeld.
9. **Canonical-URL's + theme-color** op alle pagina's; JSON-LD uitgebreid met e-mail/telefoon/contactpunt.
10. **Skip-link** ("Direct naar de inhoud") voor toetsenbord- en screenreader-gebruikers.
11. **Nieuwsbrief-privacynotitie** ("Alleen voor updates over AJAR — geen spam…") bij het veld.

---

## C. WAT JIJ NOG MOET DOEN — per categorie

### C1. Juridisch & administratief (belangrijk vóór de eerste echte levering)

- [ ] **NVWA-registratie als levensmiddelenimporteur.** Wie levensmiddelen van buiten de EU
  importeert en in NL verhandelt, moet als levensmiddelenbedrijf geregistreerd zijn bij de NVWA.
  Regel dit vóór de eerste commerciële import — dit is de belangrijkste ontbrekende stap.
- [ ] **Etiket laten kloppen met de EU-regels** zodra de fles er is: verplichte vermeldingen zijn
  o.a. "olijfolie van de eerste persing (extra vierge)", herkomst, netto-inhoud, THT, lotnummer,
  bewaaradvies, voedingswaardetabel én jouw naam/adres als importeur. (EU-verordening 1169/2011 +
  handelsnormen olijfolie.) Laat het definitieve etiket-ontwerp hierop checken.
- [x] ~~Btw-identificatienummer doorgeven~~ **Ontvangen en verwerkt (10 juli 2026): NL003042226B35**
  — staat nu in de footer, op Contact en in de JSON-LD (`vatID`) van déze site. Stond al in het
  dashboard (Boekhouding → `ADMINS`-object) sinds eerder — facturen tonen het dus al correct,
  daar is niets veranderd.
- [ ] **Check je KvK-uittreksel:** staat "AJAR" als handelsnaam geregistreerd onder KvK 77755170?
  Zo niet: handelsnaam toevoegen (kan online bij KvK, gratis).
- [x] ~~Algemene voorwaarden nalopen op 3 aannames~~ **Bevestigd door Soef (10 juli 2026):**
  1. betaaltermijn **14 dagen** als er niets is afgesproken (art. 5) — akkoord;
  2. samples **"één per zaak, zolang de voorraad strekt"** (art. 8) — akkoord;
  3. levergebied → aangepast naar **Nederland én België** (art. 4), was alleen Nederland.
- [ ] **Bedrijfs- en productaansprakelijkheidsverzekering** afsluiten (voedselproduct = product-
  aansprakelijkheidsrisico; een AVB+productdekking is voor een importeur echt aan te raden).
- [ ] **(Aanbevolen)** De algemene voorwaarden een keer laten toetsen door een jurist zodra er
  serieuze volumes gaan lopen. De huidige tekst is een nette, eerlijke basis — geen maatwerk.
- [ ] **(Aanbevolen)** Zakelijke bankrekening op naam van AJAR voor facturen.

### C2. Productdata (site toont nu "volgt" — alleen jij kunt dit vullen)

- [ ] **Lab-analyse huidige oogst:** zuurgraad (%), polyfenolen (mg/kg) → Product-pagina "De cijfers".
- [ ] **Oogstjaar** van de huidige partij.
- [ ] **Smaakprofiel / proefnotities** (fruitig-bitter-peperig; evt. door een erkend panel).
- [ ] **THT** (houdbaarheid per partij) → spec-sheet.
- [ ] **Definitieve doosinhoud** (nu "12 × 500 ml (definitief volgt)") + formaat proefflesje.
- [ ] **Prijzen/staffels** — blijft bewust "op aanvraag" op de site, maar jij moet ze intern klaar
  hebben vóór het eerste offertegesprek.
- [ ] **EUR.1 / importdocumentatie** afronden (staat als "volgt" bij Certificering op Product).
- [ ] **Tijdlijn-jaartallen** Over ons (registratie ConservAjar SARL, ISO-certificering) — na overleg familie.

### C3. Certificering — LET OP vóór lancering

- [ ] De topbar rouleert alvast door **"Fairtrade" / "Duurzaam" / "100% natuurlijk"** (jouw keuze,
  in afwachting van certificering). **Zijn de certificaten er bij lancering nog niet: zet
  `topbar.showPending = false`** in `js/content.js` — één schakelaar en alle onbevestigde claims
  zijn weg. Zonder certificaat zijn dit misleidende claims (Fairtrade is een beschermd keurmerk;
  de ACM handhaaft op duurzaamheidsclaims).

### C4. Foto's & beeld (zie ook SHOTLIST.md)

- [ ] `proces-06.jpg` (botteling) en `proces-07.jpg` (transport/import) — tonen nu een goud icoon.
- [ ] **Echte flesfoto** zodra fles + etiket klaar zijn (vervangt de "Concept"-mockup op Zakelijk).
- [ ] Echte foto van de **eigen boomgaarden in Debdou** (vervangt `stock-cultivar-olives.jpg`).
- [ ] Echte foto van de **perserij** (vervangt stockfoto `proces-05.jpg`).
- [ ] Ongebruikte bestanden in `assets/images/`: `hero-01.jpg`, `story-02.jpg`,
  `stock-hero-orchard.jpg` — mogen weg of bewaren voor later, jouw keuze.

### C5. Techniek & config (5 minuten werk per stuk)

- [x] **Formspree-ID** (`formspreeId` in content.js) — ✅ ingevuld (10 juli 2026): `mbdvnykk`.
  Alle vier formulieren (offerte, sample, presentatie, nieuwsbrief) versturen nu echt i.p.v.
  mailto/WhatsApp. *Check bij Soef: staat het juiste e-mailadres ingesteld als ontvanger op
  formspree.io bij dit formulier?*
- [ ] **GA4-ID** (`gaId`) — nu geen statistieken en geen cookiebanner.
- [ ] **Zakelijk e-mailadres** — nu jouw persoonlijke Gmail; een adres op eigen domein
  (bijv. info@ajar-olijfolie.nl) oogt professioneler bij inkopers. Staat op meerdere plekken:
  `config.email` + de privacyverklaring-tekst.
- [ ] **Custom domein** — eigen repo nodig (stappenplan in README.md). Daarna: `domain` in
  content.js, OG-tags, canonical-tags, sitemap.xml en robots.txt bijwerken.

### C6. Marketing & vindbaarheid (na lancering)

- [ ] **Google Bedrijfsprofiel** aanmaken (gratis, direct vindbaar op "olijfolie importeur Amsterdam").
- [ ] **Socials** — footer heeft een kant-en-klaar slot (`footer.socials` in content.js), nu leeg.
  Eén kanaal goed (bijv. Instagram met fabriek/oogst-beeld) is beter dan drie halfleeg.
- [ ] **Eerste referentie/testimonial** zodra er een klant is → dan ook `showPartners: true` +
  logo's ("Verkrijgbaar bij"-sectie staat klaar op de homepage).
- [ ] **QR-codes** naar `sample.html?utm_source=...` per kanaal (visitekaartje, taxi, beurs).
- [ ] **LinkedIn-bedrijfspagina** (B2B-doelgroep zit daar).

### C7. Open beslissingen (kort met je bespreken)

1. **Reactiebelofte:** wil je op Contact "u hoort binnen één werkdag van ons" beloven?
   (Sterker dan het huidige "u hoort snel van ons" — maar alleen doen als je het waarmaakt.)

**Beantwoord (10 juli 2026):**
- ~~Levergebied België/EU~~ → **Nederland én België** (verwerkt in de voorwaarden, art. 4).
- ~~Nieuwsbrief-tekst "zodra leverbaar"~~ → herschreven naar een gewone "blijf op de hoogte"-tekst,
  geen leverbaarheids-belofte meer (de olie is er al, alleen de site is nog niet actief gepromoot).
- ~~3 aannames in de voorwaarden~~ → betaaltermijn en samples bevestigd, levergebied aangepast
  (zie C1 hierboven).

---

## D. Waar pas je wat aan?

| Wat | Waar |
|---|---|
| Alle teksten, contactgegevens, instellingen | `js/content.js` (enige plek) |
| Algemene voorwaarden | `js/content.js` → `terms` |
| Privacyverklaring | `js/content.js` → `privacy` |
| Foto's | `assets/images/` (zelfde bestandsnaam = automatisch op de juiste plek) |
| PDF's hergenereren na tekstwijziging | `tools/specsheet.html` / `tools/presentatie.html` → print → PDF |
