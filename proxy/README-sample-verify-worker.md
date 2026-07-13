# Sample-verificatie-Worker deployen (eenmalig, ±10 minuten)

Deze Worker controleert automatisch of een gratis-sample-aanvraag van een **echt bedrijf**
komt (via het BTW-nummer bij **VIES**, de gratis validatiedienst van de Europese Commissie) en
of datzelfde bedrijf **niet al een sample heeft gehad**. Doel: op termijn samples afhandelen
zonder handmatig te checken wie de aanvrager is.

**Kosten: €0.** VIES is gratis en zonder sleutel; Cloudflare Workers + KV hebben een ruime
gratis laag die je hier nooit overschrijdt.

Zolang je hieronder stap 6 (de URL in de app zetten) **niet** doet, verandert er niets aan de
live site — het sample-formulier werkt dan precies als voorheen (jij checkt handmatig).

## Stap 1 — Cloudflare Worker aanmaken

1. Ga naar **https://dash.cloudflare.com** en log in (gratis account volstaat).
2. Menu links: **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker**.
3. Geef 'm de naam **ajar-sample-verify** → **Deploy** (de hello-world versie eerst).
4. Klik **Edit code**, verwijder alles, en plak de volledige inhoud van
   **`proxy/sample-verify-worker.js`** uit deze repo → **Deploy**.

## Stap 2 — Dedup-opslag (KV) koppelen

Dit is de lijst van bedrijven die al een sample kregen. Zonder deze stap verifieert de Worker
wél of het een echt bedrijf is, maar kan hij duplicaten niet tegenhouden.

1. Menu links: **Storage & Databases** → **KV** → **Create a namespace** → naam: `ajar-samples`.
2. Terug naar je Worker → **Settings** → **Bindings** → **Add** → **KV namespace**:
   - Variable name: `SAMPLES`  ← (exact zo, hoofdletters)
   - KV namespace: `ajar-samples`
3. **Deploy**.

## Stap 3 — (optioneel) instellingen

Onder **Settings → Variables and Secrets** kun je gewone variabelen toevoegen:

- `DAILY_LIMIT` — max. VIES-controles per dag (default `300`). Puur een vangnet.
- `VIES_URL` — alleen nodig als de EU ooit de VIES-endpoint verplaatst; laat 'm anders leeg.

## Stap 4 — Origin-allowlist controleren

Bovenin `sample-verify-worker.js` staat `ALLOWED_ORIGINS`. Daar staat al
`https://sofyanghaddari.github.io`. Ga je later naar een **eigen domein**, voeg dat hier toe en
deploy opnieuw.

## Stap 5 — Testen dat de Worker leeft

Kopieer je Worker-URL (bv. `https://ajar-sample-verify.<jouw-subdomein>.workers.dev`) en test 'm
met een echt BTW-nummer via de terminal. Gebruik `"dryRun": true` zodat de test het nummer **niet**
als "al gehad" vastlegt:

```bash
curl -s -X POST "https://ajar-sample-verify.<jouw-subdomein>.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"btw":"NL123456789B01","dryRun":true}'
```

Verwacht een JSON-antwoord met `"status": "verified"` (echt, bestaand nummer),
`"invalid"` (bestaat niet) of `"unavailable"` (VIES ligt er even uit).

## Stap 6 — De Worker aan de app koppelen

Zet je Worker-URL in **`ajar/js/content.js`** bij `config.sampleVerifyUrl`:

```js
sampleVerifyUrl: 'https://ajar-sample-verify.<jouw-subdomein>.workers.dev',
```

Commit + push. Vanaf dat moment controleert het sample-formulier elke aanvraag automatisch:

- **geldig + nog niet gehad** → de aanvraag gaat door zoals altijd (met de VIES-bedrijfsnaam erbij
  in de melding, zodat je 'm kunt vergelijken met wat de klant intikte).
- **BTW ongeldig** → de klant krijgt netjes te horen het nummer te controleren.
- **al een sample gehad** → vriendelijke melding, geen tweede sample.
- **VIES onbereikbaar** → de aanvraag gaat gewoon door naar je inbox met een
  "handmatig controleren"-notitie, zodat je nooit een echte lead misloopt.

### Custom-domein-Worker?

Als je de Worker op een eigen (sub)domein zet i.p.v. `*.workers.dev`, voeg dat domein dan toe aan
de `connect-src` in de `Content-Security-Policy`-meta van de `ajar/*.html`-pagina's (nu staat daar
`https://*.workers.dev`). Op `*.workers.dev` hoef je niets aan te passen.

## Belangrijke keuzes (kort)

- **AVG:** in KV komt alléén een SHA-256-**hash** van het BTW-nummer + een datum — niet het nummer
  zelf, niet de naam/adres uit VIES. Genoeg om een duplicaat te herkennen, niet terug te rekenen.
- **"Claim bij verzenden":** een bedrijf wordt als "gehad" vastgelegd op het moment van een
  geslaagde aanvraag. In het zeldzame geval dat de aanvraag daarna alsnog mislukt, is dat bedrijf
  z'n gratis sample "kwijt". Voor deze schaal een acceptabele afweging; makkelijk te herstellen
  door de betreffende sleutel in KV te verwijderen.
- **Verzendlabel automatisch printen** zit hier bewust **niet** in — dat is een aparte, betaalde
  stap (bv. Sendcloud/PostNL) voor later. Deze Worker doet alleen verifiëren + dedup.
