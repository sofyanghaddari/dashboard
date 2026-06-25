# Push-meldingen (zoals andere apps) — eenmalige setup

Hiermee krijg je echte achtergrond-meldingen op je iPhone op vaste tijden, **ook als de app dicht is**.

Hoe het werkt: de app abonneert je telefoon op Web Push en bewaart dat (samen met je
herinnerings-tijden) in een privé-gist. Een GitHub Actions cron leest die gist elk half
uur en stuurt de melding via Apple's pushdienst naar je toestel.

## Wat jij eenmalig moet doen

### 1. Repo-secrets toevoegen
GitHub → jouw repo **sofyanghaddari/dashboard** → **Settings → Secrets and variables → Actions → New repository secret**. Voeg er twee toe:

| Naam | Waarde |
|------|--------|
| `VAPID_PRIVATE_KEY` | de privésleutel die Claude je in de chat heeft gegeven |
| `PUSH_GH_PAT` | een GitHub-token met **`gist`**-scope (je bestaande dashboard-token mag, mits het gist-rechten heeft) |

> De **publieke** VAPID-sleutel staat al in de code (`js/push.js` en de workflow) — die is niet geheim.

### 2. GitHub Actions aanzetten
Repo → tab **Actions**. Staat 'm op "I understand my workflows, go ahead and enable them" → klik dat. De workflow heet **"Push notifications"**.

### 3. In de app inschakelen (op je iPhone)
1. Zorg dat de app als **PWA op je homescreen** staat en open 'm daarvandaan (niet in Safari).
2. Zorg dat **GitHub-sync is ingesteld** (⚙️ → Data) — push gebruikt diezelfde gist.
3. ⚙️ → **Meldingen → Inschakelen**. Je krijgt meteen een testmelding, en de app maakt een gist `dashboard-push-config` aan.

### 4. Testen
- Repo → **Actions → Push notifications → Run workflow** (de "workflow_dispatch"-knop). Als er op dat moment een herinnering "due" is, komt-ie binnen.
- Of zet tijdelijk een herinneringstijd op een paar minuten vooruit (⚙️) en wacht op de volgende cron-run.

## Goed om te weten
- **Timing is bij benadering.** GitHub-cron draait elk half uur en kan 5–15 min vertragen. Een herinnering wordt tot 3 uur na de geplande tijd nog ingehaald, daarna overgeslagen.
- **Repo-activiteit.** GitHub schakelt geplande workflows uit na 60 dagen zonder repo-activiteit. Eén commit (of handmatige run) reactiveert ze.
- **Privacy.** De config-gist bevat alleen je push-endpoint + herinnerings-tijden, geen persoonlijke data. De privésleutel staat alleen als secret, nooit in de code.
- **Uitschakelen.** ⚙️ → Meldingen uit (of in iPhone-instellingen). De app markeert de gist als uitgeschakeld zodat de Action stopt.

## Welke meldingen
`morning` (ochtend-doel), `income` (inkomen noteren), `streak` (hizb-streak), `hizb` (Koran), `habit` (gewoontes) — elk op de tijd die je in ⚙️ instelt. Slimme meldingen die je data nodig hebben (deadlines, facturen, weer) blijven verschijnen wanneer je de app opent (die data is versleuteld, dus de server kan 'm niet lezen).
