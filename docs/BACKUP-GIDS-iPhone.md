# 📱 Backup & PWA-gids (iPhone)

Een simpel stappenplan om je dashboard veilig te stellen en als app op je beginscherm te
zetten. De knopnamen hieronder staan exact zo in de app.

---

## a) Maak een GitHub-token (alleen voor gists)

Dit is de sleutel waarmee de app je backup veilig opslaat. Geef 'm zo min mogelijk rechten.

1. Open in Safari: **github.com** → log in.
2. Ga naar **Settings** (via je profielfoto rechtsboven) → helemaal onderaan **Developer settings**.
3. Tik op **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
4. Vul in:
   - **Token name**: `Dashboard`
   - **Expiration**: kies bijv. 1 jaar.
   - **Repository access**: laat op **Public Repositories (read-only)** staan — niet nodig.
   - **Account permissions** → zoek **Gists** → zet op **Read and write**.
     *(Dit is het enige recht dat de app nodig heeft.)*
5. Tik **Generate token** en **kopieer** de token die begint met `github_pat_…`.
   ⚠️ Je ziet 'm maar één keer — kopieer 'm meteen.

> Liever de snelle weg? In de app staat bij **Instellingen → Synchronisatie** een link
> **"token aanmaken"**. Die maakt een klassieke token met alleen `gist`. Een
> fine-grained token (stappen hierboven) is veiliger.

---

## b) Synchroniseer nu in Safari (je huidige data veiligstellen)

Doe dit eerst op de plek waar je data nu staat (Safari), vóór je de app installeert.

1. Open je dashboard in Safari.
2. Tik op het tandwiel **⚙️** rechtsboven → ga naar **Synchronisatie**.
3. Plak je token in het veld **GitHub Personal Access Token** (`ghp_…` / `github_pat_…`).
4. Laat **Bestaande Gist-ID (optioneel)** leeg als dit je eerste keer is.
5. Tik **Verbind met GitHub**. De app maakt nu één gist en zet je data erin.
6. Tik daarna op de **☁️-pill** bovenin, of in instellingen op **Pushen**, om zeker te
   weten dat alles geüpload is.
7. **Belangrijk:** noteer je **Gist-ID** (zichtbaar in instellingen, met een kopieerknop).
   Mail 'm één keer naar jezelf als noodbackup.

---

## c) Zet de app op je beginscherm (PWA installeren)

Zo werk je voortaan in de app i.p.v. de site — en raakt je data niet meer kwijt door de
automatische opschoning van Safari.

1. Open je dashboard in Safari.
2. Tik op de **deel-knop** (vierkantje met pijltje omhoog), onderaan.
3. Scroll en tik op **Zet op beginscherm** (*Add to Home Screen*).
4. Tik rechtsboven op **Voeg toe**.
5. Open de app voortaan via het **nieuwe icoon op je beginscherm**, niet meer via Safari.

---

## d) In de app: token + gist-ID invoeren en opslag beschermen

De geïnstalleerde app heeft op iPhone een eigen, aparte opslag. Daarom koppel je 'm één
keer aan dezelfde gist, zodat je data meekomt.

1. Open de app vanaf je beginscherm.
2. Tik op **⚙️** → **Synchronisatie**.
3. Plak je **token** in het tokenveld.
4. Plak je **Gist-ID** (van stap b7) in **Bestaande Gist-ID (optioneel)**.
5. Tik **Verbind met GitHub** → de app haalt je data binnen (merge). Tik daarna op
   **Mergen** als je het zeker wilt weten.
   - Weet je het Gist-ID niet meer? Tik op **Zoek mijn gists → Zoeken** en kies de juiste.
6. Bescherm je opslag: tik in **⚙️** bij het opslag-onderdeel op
   **Maak opslag persistent**. (Dan ruimt de telefoon je gegevens niet meer automatisch op.)

---

## ✅ Klaar — zo blijft het goed gaan

- Werk voortaan in de **app op je beginscherm**.
- Je token blijft nu **bewaard** (je hoeft 'm niet telkens opnieuw in te voeren).
- De app maakt **geen nieuwe gists** meer aan: hij hergebruikt automatisch je bestaande
  dashboard-gist.
- Heb je per ongeluk meerdere gists? Die kun je rustig zelf opruimen op **gist.github.com**.
  Verwijder **niet** de gist die de app nu gebruikt (je ziet welke "actief" is in de app).
