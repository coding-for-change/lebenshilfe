# Demo-Instanz (Lebenshilfe Hamburg)

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

## Einmalig einrichten

Die Demo darf die Signaturschlüssel der Produktion nicht mitbenutzen — ein hier
erzeugtes Session-Cookie oder TOTP-Secret wäre sonst auch gegen die echte App
gültig. Dazu kommt das Passwort der eigenen Datenbank. Deshalb drei eigene
Werte in `.config/secrets.yml`:

```bash
for KEY in DEMO_BETTER_AUTH_SECRET DEMO_SERVER_ACTIONS_ENCRYPTION_KEY DEMO_DB_PASSWORD; do
  ansible-vault encrypt_string "$(openssl rand -hex 32)" --name "$KEY" >> .config/secrets.yml
done
```

(`-hex` statt `-base64`: `DEMO_DB_PASSWORD` steht unmaskiert in der
`DATABASE_URL`, dort stören `+`, `/` und `=`.) Das Secret des S3-Containers
leitet der Workflow aus `DEMO_DB_PASSWORD` ab; es braucht keinen eigenen
Vault-Eintrag.

Fehlt einer davon, bricht der Workflow mit einer benannten Fehlermeldung ab,
statt still auf die Produktionswerte zurückzufallen.

DNS ist bereits erledigt: `*.codingforchange.com` zeigt auf den VPS, Caddy holt
das Zertifikat beim ersten Aufruf selbst.

## Deployen

GitHub → Actions → **Deploy Demo** → *Run workflow*. Bewusst manuell: die Demo
ist etwas, das wir herzeigen, sie soll sich bewegen wenn wir es entscheiden.
Soll sie `main` folgen, den `push`-Trigger im Workflow einkommentieren.

Auf dem VPS landet alles unter `/var/www/lebenshilfe-demo` — eigene Compose-
Datei, eigener MySQL-Container, eigener S3-Container für die Unterschriften
(Volumes `demo_db` und `demo_s3`), Port 12135 nur auf Loopback. Die Produktion
schreibt Unterschriften in einen Hetzner-Bucket; die Demo bekommt stattdessen
RustFS mit derselben S3-API, erreichbar nur über das Compose-Netz. (RustFS
statt MinIO: die MinIO-Images lassen sich nicht mehr von Docker Hub ziehen —
auch die in `docker-compose.yml` gepinnten Digests nicht.)

## Zugangsdaten

Werden bei jedem Seed-Lauf ins Container-Log geschrieben
(`docker compose logs app`). Passwort für alle Demo-Konten: `Demo-Hamburg-2026!`

| Rolle            | Konto                                   |
| ---------------- | --------------------------------------- |
| Leitung (OWNER)  | `leitung@demo.codingforchange.com`      |
| Koordination     | `koordination@demo.codingforchange.com` |
| Schulbegleitung  | `nele.carstens@demo.codingforchange.com` u. a. |

**Admin- und Leitungskonten brauchen 2FA** (`src/lib/auth-guards.ts`). Beim
ersten Login führt die App durch die Einrichtung mit einer Authenticator-App.
Wer nur klicken möchte, nimmt ein Schulbegleitungs-Konto — dort entfällt das.

## Daten zurücksetzen

Der Seed läuft bei jedem Containerstart. Für einen nächtlichen Reset auf dem VPS:

```bash
# crontab -e  (als deploy-lebenshilfe)
0 4 * * * cd /var/www/lebenshilfe-demo && docker compose restart app
```

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
