# Grammatica-Worker deployen (eenmalig, ±10 minuten)

De Stof-module (Geloof → Stof) gebruikt AI om boekpagina's te verwerken en je
antwoorden te beoordelen. Dat loopt via een gratis **Cloudflare Worker** zodat je
Anthropic API-key nooit in de app zelf staat.

Kosten bij dagelijks gebruik: ongeveer **€2-3 per maand** aan Anthropic-tegoed.
De Worker heeft een harde daglimiet (standaard 100 aanvragen/dag) als vangnet.

## Stap 1 — Anthropic API-key aanmaken

1. Ga naar **https://console.anthropic.com** en log in (of maak een account).
2. Klik op **API Keys** → **Create Key** → geef 'm een naam (bv. "dashboard").
3. Kopieer de key (begint met `sk-ant-`) — je ziet 'm maar één keer.
4. Zet er wat tegoed op via **Billing** (bv. $5 — dat is maanden genoeg).

## Stap 2 — Cloudflare Worker aanmaken

1. Ga naar **https://dash.cloudflare.com** en log in (gratis account volstaat).
2. Menu links: **Compute (Workers)** → **Workers & Pages** → **Create** → **Create Worker**.
3. Geef 'm de naam **grammatica** → **Deploy** (de hello-world versie eerst).
4. Klik **Edit code**, verwijder alles, en plak de volledige inhoud van
   **`proxy/grammatica-worker.js`** uit deze repo → **Deploy**.

## Stap 3 — API-key als secret instellen

1. Ga terug naar de Worker-overzichtspagina → tab **Settings** → **Variables and Secrets**.
2. **Add** → Type: **Secret** → Name: `ANTHROPIC_API_KEY` → Value: je key uit stap 1 → **Deploy**.

## Stap 4 — Daglimiet-opslag (KV) koppelen — aanbevolen

Zonder deze stap werkt alles wél, maar is de daglimiet minder betrouwbaar.

1. Menu links: **Storage & Databases** → **KV** → **Create a namespace** → naam: `grammatica-limiet`.
2. Terug naar je Worker → **Settings** → **Bindings** → **Add** → **KV namespace**:
   - Variable name: `RATE_KV`
   - KV namespace: `grammatica-limiet`
3. **Deploy**.

Optioneel: onder **Variables and Secrets** een gewone variabele `DAILY_LIMIT`
toevoegen om de limiet aan te passen (standaard 100).

## Stap 5 — URL in de app zetten

1. Kopieer de Worker-URL van de overzichtspagina, bv.
   `https://grammatica.jouwnaam.workers.dev`
2. Open het dashboard → **Geloof** → **Stof** → tik op ⚙ (Worker-instellingen)
   → plak de URL → Opslaan.

Klaar. Voeg je eerste onderwerp toe met 📷 een foto van de boekpagina of ✍️ getypte tekst.

## Testen zonder de app (optioneel)

Met Node op je computer:

```sh
node proxy/test-grammatica-worker.mjs https://grammatica.jouwnaam.workers.dev
# of met een echte boekfoto:
node proxy/test-grammatica-worker.mjs https://grammatica.jouwnaam.workers.dev pad/naar/boekpagina.jpg
```

## Problemen oplossen

| Melding | Oorzaak / oplossing |
|---|---|
| "ANTHROPIC_API_KEY ontbreekt" | Stap 3 niet gedaan, of als gewone variabele i.p.v. Secret toegevoegd |
| "Daglimiet bereikt" | Vangnet actief — morgen weer, of verhoog `DAILY_LIMIT` |
| "Anthropic API 401" | API-key ongeldig — maak een nieuwe in de Anthropic console |
| "Anthropic API 400 … credit" | Geen tegoed meer — Billing in de Anthropic console |
| "Origin niet toegestaan" | De app draait op een ander adres dan `sofyanghaddari.github.io` — voeg het adres toe aan `ALLOWED_ORIGINS` bovenin de worker-code |
| "time-out (90s)" | Grote foto of trage verbinding — maak de foto opnieuw (scherp, goed licht) en probeer nogmaals |
