# Demo-Instanz (Lebenshilfe Demo-Anwendung)

Öffentliche Schau-Umgebung unter **https://demo-lebenshilfe.codingforchange.com**.
Gleiche Codebasis wie die Produktion, anderes Branding, erfundene Daten.

## Warum kein eigenes Repo

Ein Fork würde ab dem ersten Tag auseinanderlaufen — jeder Bugfix müsste zweimal
gepflegt werden. Stattdessen trägt eine Codebasis mehrere Mandanten:

| Was               | Wo                                              |
| ----------------- | ----------------------------------------------- |
| Branding          | `src/lib/branding.ts` — ein Preset pro Instanz   |
| Welches Preset    | Build-Argument `NEXT_PUBLIC_ORG`                 |
| Daten             | `scripts/seed/dataset-*.ts`                      |
| Einfügelogik      | `scripts/seed/engine.ts` (für alle dieselbe)     |
| Deployment        | `.github/workflows/deploy-demo.yml`              |

Eine weitere Lebenshilfe kostet damit: ein Preset, ein Logo in `public/`,
optional ein Datensatz, ein Workflow. Keine Codeänderung an der App selbst.

> `NEXT_PUBLIC_ORG` muss beim **Build** gesetzt sein. `NEXT_PUBLIC_*`-Werte
> werden in das Client-Bundle einkompiliert; nur zur Laufzeit gesetzt, bliebe
> die Oberfläche beim Branding desjenigen, der das Image gebaut hat.

## Betrieb

Die Demo läuft auf infra-v2 (Rolle `lebenshilfe_demo` im Repo `infra-v2`), getrennt von
der Produktion in allem:

- eigene MySQL-Datenbank `lebenshilfe_demo` auf dem Datenbank-Host
- eigener S3-Container (RustFS) für die Unterschriften, erreichbar nur über das
  Docker-Netz der Demo. Die Produktion schreibt in einen R2-Bucket.
- eigene Secrets (Auth, Server-Actions-Schlüssel) im Vault von infra-v2
- Blue/Green hinter Caddy wie die anderen Apps

Die Compose-Datei ist ein Template in infra-v2, nicht mehr hier im Repo. Ein
hier erzeugtes Session-Cookie oder TOTP-Secret ist gegen die echte App nicht
gültig, weil die Demo eigene Schlüssel hat.

## Deployen

Jeder Push auf den Demo-Branch (`claude/lebenshilfe-hamburg-demo-8f5538`)
deployt die Demo (`.github/workflows/deploy-demo.yml`): Image
`lebenshilfe-demo` bauen, in die Registry von infra-v2 pushen, dann den Deploy in
infra-v2 starten (`deploy-dispatch.yml`, App `lebenshilfe_demo`). Die Demo lebt
nur auf diesem Branch — `main` deployt die Produktion, und GitHub bietet *Run
workflow* nur für Workflows an, die auf dem Default-Branch liegen. Fixes aus
`main` kommen so in die Demo: `main` in den Demo-Branch mergen, pushen.

Build-Argumente kommen aus `.config/secrets.yml` (Repo-Secret
`ANSIBLE_VAULT_PASSWORD`): `DEMO_SERVER_ACTIONS_ENCRYPTION_KEY` (muss gleich dem
Wert im Vault von infra-v2 sein) und `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Alle
Laufzeit-Secrets liegen in infra-v2.

## Zugangsdaten

Werden bei jedem Seed-Lauf ins Container-Log geschrieben (Grafana/Loki:
`{job="app", app="lebenshilfe-demo"}`). Passwort für alle Demo-Konten: `Demo-Hamburg-2026!`

| Rolle            | Konto                                   |
| ---------------- | --------------------------------------- |
| Leitung (OWNER)  | `leitung@demo.codingforchange.com`      |
| Koordination     | `koordination@demo.codingforchange.com` |
| Schulbegleitung  | `nele.carstens@demo.codingforchange.com` u. a. |

**Admin- und Leitungskonten brauchen 2FA** (`src/lib/auth-guards.ts`). Beim
ersten Login führt die App durch die Einrichtung mit einer Authenticator-App.
Wer nur klicken möchte, nimmt ein Schulbegleitungs-Konto — dort entfällt das.

## Daten zurücksetzen

Der Seed läuft bei jedem Containerstart, also bei jedem Deploy, bevor der neue
Slot Traffic bekommt.

`wipe()` in `scripts/seed/engine.ts` löscht nur Zeilen, die der Datensatz selbst
besitzt (eigene IDs, eigene E-Mail-Adressen). Ein echter Mensch, der in die Demo
eingeladen wurde, behält sein Konto über den Reset hinweg.

## Jemanden einladen

Als Admin in der Demo über *Benutzerverwaltung → Einladen*. Die Mail geht über
Resend von `info@codingforchange.com` raus.

## Was hier nicht hingehört

- **Echte Daten.** Kein echtes Kind, keine echte Familie, keine echten
  Beschäftigten. Der Datensatz ist vollständig erfunden.
- **Echte Maildomains.** Alle Demo-Konten liegen unter
  `demo.codingforchange.com`, einer Domain, die uns gehört. Die Instanz läuft mit
  einem echten Resend-Key; eine Adresse `@lebenshilfe.de` würde Post an die
  Bundesvereinigung schicken.
- **Produktions-Secrets.** Siehe oben.

Die Demo ist öffentlich erreichbar und die Zugangsdaten stehen in diesem
Dokument — wer die URL kennt, kommt rein. Deshalb `robots.txt: Disallow` und
`noindex` (siehe `src/app/robots.ts`), und deshalb nur erfundene Daten.
