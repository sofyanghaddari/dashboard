# 🚆 NS trein-storingen — proxy instellen

> **Makkelijkste manier (aanbevolen): via GitHub, géén Cloudflare.**
> De app leest de storingen standaard van een GitHub Action die elke ~10 min de
> NS-API aanroept (workflow `.github/workflows/ns-disruptions.yml`, publiceert naar
> de `ns-data`-branch). Je hoeft dan maar **één ding** te doen: je gratis NS-sleutel
> als repo-secret **`NS_API_KEY`** toevoegen (GitHub → repo → **Settings** →
> **Secrets and variables** → **Actions** → **New repository secret**). Geen
> Cloudflare-account, geen Worker, geen URL plakken. Daarna draait de workflow
> vanzelf (of start 'm handmatig via tab **Actions** → "Run workflow").
>
> De Cloudflare-route hieronder is een **alternatief** voor wie liever een eigen
> proxy beheert (stel die in via de NS-kaart → eigen proxy-URL → `nsProxyUrl`).

---

## Alternatief: eigen Cloudflare Worker (≈10 min, gratis)

De app kan de NS-storingen niet rechtstreeks ophalen (de NS-API blokkeert dat in de
browser, en je sleutel mag niet in de app staan). Daarom zet je één keer een gratis
"proxy" op: een klein stukje dat de storingen ophaalt en aan de app doorgeeft.

Je hebt het bestand `proxy/ns-worker.js` nodig (staat in deze map).

---

## Stap 1 — Gratis NS-sleutel aanvragen

1. Ga naar **apiportal.ns.nl** en maak een gratis account aan (of log in).
2. Ga naar **Products** → kies **NS App** (of "Reisinformatie").
3. Klik **Subscribe** → bevestig. Je krijgt nu een **Primary key**.
4. Ga naar **Profile** → kopieer je **Primary key** (een lange code). Dit is je sleutel.

> Het endpoint dat de proxy gebruikt is de **Reisinformatie / Disruptions v3**-API
> (`/disruptions/v3`). Die zit in het "NS App"-product.

---

## Stap 2 — Gratis Cloudflare-account + Worker

1. Ga naar **dash.cloudflare.com** en maak een gratis account aan.
2. In het menu links: **Workers & Pages** → **Create application** → **Create Worker**.
3. Geef 'm een naam (bv. `ns-storingen`) → **Deploy** (de standaard "Hello world" is prima voor nu).
4. Klik **Edit code**. Verwijder alles in de editor en **plak de volledige inhoud van
   `proxy/ns-worker.js`**. Klik rechtsboven **Deploy**.

---

## Stap 3 — Je NS-sleutel veilig opslaan in de Worker

1. Open je Worker → tab **Settings** → **Variables and Secrets**.
2. Klik **Add** → kies type **Secret**.
   - **Name:** `NS_API_KEY`
   - **Value:** plak je NS Primary key (van stap 1).
3. **Save** (en eventueel opnieuw **Deploy**).

---

## Stap 4 — De proxy-URL in de app plakken

1. Boven in je Worker zie je de URL, iets als:
   `https://ns-storingen.<jouw-naam>.workers.dev`
   → **kopieer** die.
2. Open het dashboard → kaart **"NS · trein-storingen"** → knop **Proxy-URL instellen**.
3. Plak de URL en bevestig.

Klaar! De kaart toont nu live storingen (ververst elke paar minuten; tik op ⟳ om te
verversen). Geen storingen = "✓ Geen grote storingen op dit moment."

---

### Werkt het niet?
- Test de URL eerst in je browser: je hoort dan JSON te zien (geen foutmelding).
- Zie je een fout met `NS_API_KEY ontbreekt`? Dan staat de secret niet goed → stap 3.
- Zie je `NS API 401`? Dan klopt de sleutel niet, of je bent niet op het juiste product
  geabonneerd → stap 1.
