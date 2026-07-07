# Datenschutz-Folgenabschätzung (DSFA) — Lebenshilfe-Schulbegleitungs-Plattform

> **⚠️ ENTWURF — kein Rechtsrat.** Von der/dem Datenschutzbeauftragten und der Leitung zu
> prüfen, zu ergänzen und freizugeben. `[PLATZHALTER]` = nur intern zu befüllende Angaben.
> Struktur nach Art. 35 Abs. 7 DSGVO und DSK-Kurzpapier Nr. 5/18. Fachliche Grundlage:
> internes Security-/DSGVO-Audit (`security-audit/`).

| Feld | Wert |
|------|------|
| **Verarbeitungstätigkeit** | Digitale Koordination der Schulbegleitung, Leistungs-/Stundenerfassung und Abrechnung gegenüber Kostenträgern |
| **Verantwortliche(r)** (Art. 4 Nr. 7) | **Lebenshilfe München e.V.**, `[ANSCHRIFT, VERTRETUNG]` (fachl. Ansprechpartnerin: Katarina Berger, Koordination Schul-/Individualbegleitung) |
| **Auftragsverarbeiter** (Art. 28) | **Coding for Change e.V.** (Entwicklung/Betrieb) und **Hetzner** (Hosting/Objektspeicher) — AVV laut Projektsteckbrief geschlossen |
| **Datenschutzbeauftragte(r)** | `[NAME, E-MAIL, TELEFON, ANSCHRIFT]` (Einbindung der/des DSB der Lebenshilfe ist vorgesehen; formale Benennung/Veröffentlichung siehe F-17/COD-113) |
| **Aufsichtsbehörde** | Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach |
| **Version / Stand** | 0.1 (Entwurf), 2026-07-07 |
| **Beteiligte an der DSFA** | `[DSB, IT/Entwicklung, Fachbereichsleitung]` |
| **Nächste Überprüfung** | bei wesentlicher Änderung der Verarbeitung, mind. jährlich (Art. 35 Abs. 11) |

---

## 1. Ist eine DSFA erforderlich? — Ergebnis: **Ja, verpflichtend**

Eine DSFA ist durchzuführen, weil die Verarbeitung **mehrere** gesetzliche Auslöser erfüllt:

- **Art. 35 Abs. 3 lit. b DSGVO** — *umfangreiche Verarbeitung besonderer Kategorien
  personenbezogener Daten (Art. 9)*: Gesundheits-/Behinderungsdaten von Kindern werden
  systematisch und in erheblichem Umfang verarbeitet.
- **DSK „Muss-Liste" (v1.1, 17.10.2018), Nr. 3** — *„Umfangreiche Verarbeitung von Daten,
  die dem Sozial-, einem Berufs- oder besonderen Amtsgeheimnis unterliegen … Träger von
  großen sozialen Einrichtungen."* Trifft auf einen Lebenshilfe-Träger zu (Sozialgeheimnis
  nach §35 SGB I, §§67 ff. SGB X).
- **WP248-Kriterien** — erfüllt sind u. a. *vertrauliche/hochsensible Daten*,
  *schutzbedürftige Betroffene (Minderjährige)* und *große Datenmenge*; das Erfüllen von
  ≥ 2 Kriterien indiziert die DSFA-Pflicht.

Folge: DSFA verpflichtend; zusätzlich sind ein **Datenschutzbeauftragter** (§38 Abs. 1
S. 2 BDSG, unabhängig von der Beschäftigtenzahl) und ein **Verzeichnis von
Verarbeitungstätigkeiten** (Art. 30) verpflichtend.

## 2. Systematische Beschreibung der Verarbeitung (Art. 35 Abs. 7 lit. a)

### 2.1 Zwecke
1. Koordination und Planung der Schulbegleitung (Zuordnung Schulbegleiter:in ↔ Kind, Stundenpläne, Vertretungen).
2. Erfassung erbrachter Leistungen/Zeiten inkl. handschriftlicher Bestätigung (Unterschrift).
3. Erstellung von Einsatznachweisen und Abrechnung gegenüber **Kostenträgern**.
4. Nutzer-/Zugriffsverwaltung (Authentifizierung, Rollen).

### 2.2 Betroffenengruppen
- **Kinder mit Behinderung (Minderjährige)** — besonders schutzbedürftig.
- **Schulbegleiter:innen** (Beschäftigte / Honorarkräfte) — Beschäftigtenkontext (§26 BDSG).
- **Lehrkräfte** — bestätigen die Einsätze per Unterschrift; verarbeitet werden nur Vor-/Nachname + Unterschrift, **kein eigener Zugang**.
- **Leitung / Administrator:innen** (kleiner Personenkreis, Zugriffe protokolliert).
- ggf. **Sorgeberechtigte** (als Kontakt/Antragsteller von Betroffenenrechten).

### 2.3 Datenkategorien
- **Besondere Kategorien (Art. 9):** Laut Projektsteckbrief werden **keine Diagnose-/
  Gesundheitsdaten erfasst**; gleichwohl ist bereits die Tatsache „Kind erhält
  Schulbegleitung" ein Gesundheitsdatum (Art. 9), und Art/Umfang des **Förderbedarfs**
  werden über die bewilligten Stunden mittelbar erkennbar. Felder: Art der Begleitung,
  bewilligte direkte/indirekte Stunden, Schweigepflichtsentbindung (ja/nein), Kostenträger.
  **⚠️ Prüfpunkt / organisatorische Weisung:** das Datenmodell enthält Freitextfelder
  (`Child.bescheid`, `Child.bemerkung`, `ChildAbsence.note`), die technisch Gesundheits-/
  Diagnoseangaben aufnehmen könnten. Es liegt in der **Verantwortung der Lebenshilfe München**
  (Verantwortliche), diese Felder verantwortungsvoll zu nutzen: **Gesundheits- oder
  Diagnosedaten dürfen dort nicht gespeichert werden.** Ergänzend technische Begrenzung
  prüfen (vgl. F-26/F-38); Aufnahme in Nutzerhinweise/Betriebsvereinbarung empfohlen.
- **Stammdaten:** Vor-/Nachname des Kindes, Schule, Kostenträger, Pool.
- **Beschäftigtendaten:** Name, E-Mail, Wochenstunden, Einsatz-/Zeitdaten, Notizen.
- **Handschriftliche Unterschriften** (PNG-Bilder, biometrienah) als Leistungsnachweis.
- **Standort-/Adressdaten:** Schul- und Kostenträgeradressen (Geokoordinaten via Google Maps).
- **Technische Daten:** Session-IP/User-Agent, Zugriffs-/Fehlerprotokolle.

### 2.4 Datenflüsse, Technik und Empfänger
- **Anwendung:** Next.js 16 (App Router, Server Actions), Prisma → **MySQL**, Authentifizierung über **better-auth** (E-Mail/Passwort).
- **Hosting/Speicher:** Docker + Caddy auf **Hetzner** (Deutschland/EU); handschriftliche Unterschriften in **Hetzner Object Storage (S3)**.
- **Auftragsverarbeiter (Art. 28):** **Coding for Change e.V.** (Entwicklung/Betrieb) und **Hetzner** (Hosting/Objektspeicher) — AVV laut Projektsteckbrief geschlossen; `[E-Mail-Dienst: Resend / SMTP — als AV zu bestätigen]`; Logging-Pipeline (pino → Grafana Alloy).
- **Google Maps / Drittland (Entscheidung: beibehalten + Zusage korrigieren):** Die Anwendung bindet **Google Maps** ein; übermittelt werden **Adress-/Standortdaten (Schulen, Kostenträger) und die Nutzer-IP** an Google (USA) — **keine Art.-9-/Kinderdaten**. Dies ist eine Drittlandübermittlung; Rechtsgrundlage: **EU-US Data Privacy Framework** (Google LLC zertifiziert; `[durch DSB bestätigen]`) + **Einwilligung nach §25 TDDDG** (F-08). Die frühere Steckbrief-Aussage „kein Drittlandtransfer" ist entsprechend zu **korrigieren** (mit Betriebsrat/DSB). Vollständige Vermeidung optional über Open-Source-Karte (OpenStreetMap/Leaflet) + EU-Geocoding.
- **Weitere Empfänger:** Kostenträger und Schulen (Einsatznachweise/Abrechnung) — außerhalb des Systems.

### 2.5 Rechtsgrundlagen (vorläufig — durch DSB zu bestätigen)
- **Art. 6:** lit. b (Vertrag/Beschäftigung), lit. c (rechtliche Pflichten, z. B. Abrechnung/Aufbewahrung), ggf. lit. e/f.
- **Art. 9 Abs. 2:** lit. b (Arbeits-/Sozialrecht) und/oder lit. h (Sozialfürsorge) i. V. m. **§22 BDSG** (angemessene und spezifische Maßnahmen); Verarbeitung der Kinderdaten im Rahmen der Eingliederungshilfe.
- **Beschäftigte:** §26 BDSG.
- `[Rechtsgrundlagen abschließend prüfen und je Zweck dokumentieren — DSB]`

### 2.6 Aufbewahrung/Löschung
Gemäß Projektsteckbrief (S. 3) und **Löschkonzept** (`loeschkonzept.md`):
abrechnungsrelevante Belege **8 Jahre** (§147 AO), Mitarbeitenden-/Account-Daten bis
Austritt/Inaktivität (+ arbeitsrechtl. Fristen), Daten betreuter Kinder bis Ende der
Betreuung (+ ggf. Abrechnung), technische Logs **14 Tage**. Offene Klärungspunkte:
Frist des Art.-9-Audit-Logs (Löschkonzept K1) und etwaige SGB-Aufbewahrung (K2).
Automatisiertes, protokolliertes Löschen ist noch nicht implementiert (F-06).

## 3. Notwendigkeit und Verhältnismäßigkeit (Art. 35 Abs. 7 lit. b)

- **Zweckbindung:** Daten werden ausschließlich zur Koordination/Abrechnung der Schulbegleitung verarbeitet; keine zweckfremde Nutzung (insb. **kein Verhaltens-/Leistungsmonitoring** der Beschäftigten aus Einsatz-/Standortdaten — dies wäre ein zusätzlicher DSFA-Auslöser).
- **Datenminimierung:** grundsätzlich gegeben; **Nachbesserungsbedarf:** die Startseite der Schulbegleiter:innen lädt serverseitig mehr Kinddaten (inkl. Art. 9) als nötig (F-26), und der Freitext-Kindname bei Vertretungen ist bewusst pseudonymisiert (Datenschutz-Feature).
- **Erforderlichkeit der Art.-9-Daten:** Bescheid/Förderstunden/Schweigepflichtsentbindung sind für Bewilligung/Abrechnung erforderlich; Freitextfelder sind zu begrenzen und zu minimieren.
- **Betroffenenrechte:** Auskunft/Löschung/Portabilität sind derzeit **nicht** technisch umgesetzt (F-05) → offener Punkt der Verhältnismäßigkeit.
- **Transparenz:** Datenschutzerklärung/DSB-Kontakt fehlen derzeit (F-08/F-17) → offener Punkt.

## 4. Risikobewertung für die Rechte und Freiheiten (Art. 35 Abs. 7 lit. c)

Bewertung qualitativ (gering / mittel / hoch) je **Eintrittswahrscheinlichkeit (EW)** und
**Schwere (S)** *vor* Maßnahmen (DSK-Kurzpapier Nr. 18). Betroffen sind besonders die
Rechte **schutzbedürftiger Kinder**.

| # | Risiko (Schadensereignis) | Ursache/Quelle | EW | S | Risiko |
|---|---|---|---|---|---|
| R1 | Offenlegung von Art.-9-Gesundheits-/Behinderungsdaten Minderjähriger | unbefugter Zugriff, fehlende Verschlüsselung at-rest, Fehlkonfiguration | mittel | hoch | **hoch** |
| R2 | Datenabfluss/Diebstahl aus DB oder Objektspeicher (Backup/Credential) | fehlende At-rest-Verschlüsselung (F-04), Klartext-DB-Transport (F-10), fehlende Backups/Objekt-Lock (F-13) | mittel | hoch | **hoch** |
| R3 | Abfluss handschriftlicher Unterschriften (biometrienah) | keine Löschung/kein Objekt-ACL nachweisbar, keine At-rest-Verschlüsselung | gering–mittel | hoch | **hoch** |
| R4 | Re-Identifikation/Profilbildung von Kindern | Zusammenführung von Stamm-, Gesundheits- und Standortdaten | gering | hoch | mittel |
| R5 | Abfluss von PII über Protokolle (Alloy/Loki) | Klartext-Logging von Namen/E-Mails | ~~mittel~~ → **behoben (F-03)** | hoch | gering (Rest) |
| R6 | Kontoübernahme (Admin sieht alle Art.-9-Daten) | schwache Passwörter, fehlende Brute-Force-Bremse, keine MFA | mittel | hoch | **hoch** |
| R7 | Token-Abfluss (Passwort-Reset/Einladung) über Referer/URL | fehlende Security-Header → **teilweise behoben (F-02)**; Rest: kein serverseitiges Rate-Limit (F-09) | gering | hoch | mittel |
| R8 | Drittlandübermittlung an Google (USA) via Maps — Adressen + Nutzer-IP, **keine Art.-9-Daten** | Maps ohne Einwilligung/Offenlegung; Steckbrief-Aussage zu korrigieren; Basis EU-US DPF | mittel | mittel | mittel |
| R9 | Verlust der Verfügbarkeit der Abrechnungs-/Nachweisdaten | kein getestetes Backup, Single-DC | gering | hoch | mittel |
| R10 | Rechtswidrige Über-Speicherung / fehlende Löschung | kein Löschkonzept/-job (F-06), keine Löschung von S3-Objekten | hoch | mittel | **hoch** |
| R11 | Nicht-Erfüllbarkeit von Betroffenenrechten (Auskunft/Löschung) | keine Export-/Löschfunktion (F-05) | hoch | mittel | **hoch** |
| R12 | Manipulierte Tabellenkalkulation beim Kostenträger (CSV-Injection) | ~~fehlende Neutralisierung~~ → **behoben (F-14)** | gering | mittel | gering (Rest) |

## 5. Abhilfemaßnahmen und Garantien (Art. 35 Abs. 7 lit. d)

Technische und organisatorische Maßnahmen (TOM) mit Umsetzungsstatus. „Umgesetzt" verweist
auf offene Pull-Requests des laufenden Remediations-Programms; „geplant" auf das jeweilige
Finding/Ticket.

| Maßnahme | adressiert | Status |
|---|---|---|
| HTTP-Security-Header + CSP (Clickjacking, XSS-Eindämmung, **Referrer-Policy gegen Token-Leak**) | R1, R7 | **umgesetzt** — F-02 / PR #115 |
| Keine PII in Protokollen + pino-Redaction | R5 | **umgesetzt** — F-03 / PR #116 |
| Passwort-Mindestlänge 12 + Abgleich gegen Datenlecks (HIBP) | R6 | **umgesetzt** — F-19 / PR #117 |
| CSV-Formel-Injection neutralisiert | R12 | **umgesetzt** — F-14 / PR #118 |
| Rollenbasierte Zugriffskontrolle + Objekt-Eigentümerprüfung (kein IDOR) | R1, R6 | vorhanden (Bestandscode); Feinsteuerung Feldebene geplant (F-26) |
| Verschlüsselung **im Transport** App↔MySQL (TLS erzwingen) | R2 | geplant — F-10 / COD-106 |
| Verschlüsselung **at rest** (Art.-9-Felder + S3-Unterschriften) → ermöglicht Art. 34 Abs. 3 lit. a | R1, R2, R3 | geplant — F-04 / COD-100 |
| Audit-/Zugriffsprotokoll für Art.-9-Kinddaten (§22 Abs. 2 Nr. 2 BDSG; Breach-Scoping Art. 33) | R1, R2 | geplant — F-12 / COD-108 |
| Persistentes Rate-Limiting + Account-Lockout | R6, R7 | geplant — F-09 / COD-105 |
| MFA für Admin/Owner | R6 | geplant — F-20 / COD-116 |
| Backups (EU, außerhalb Bucket) + Objekt-Versionierung/-Lock, getesteter Restore | R9 | geplant — F-13 / COD-109 |
| Löschkonzept + automatisiertes, protokolliertes Löschen/Anonymisieren (inkl. S3-Löschung) | R10 | geplant — F-06 / COD-102 (Konzept: `loeschkonzept.md`) |
| Betroffenenrechte: Auskunfts-/Export- und Löschfunktion | R11 | geplant — F-05 / COD-101 |
| AV-Verträge (Hetzner, E-Mail) + Transfermechanismen (DPF/SCC) dokumentiert | R8 | geplant — F-07 / COD-103 |
| Einwilligung vor Laden von Google Maps (TDDDG §25) + Datenschutzerklärung | R8 | geplant — F-08 / COD-104 (`datenschutzerklaerung.md`) |
| Integritätssicherung der Unterschriften (Hash/Manifest, keine Wiederverwendung) | R3 | geplant — F-25 / COD-121 |
| DSB benannt + 72-h-Notfallprozess/Breach-Register (BayLDA) | R1–R3 | geplant — F-17 / COD-113 |
| Datenresidenz EU (MySQL + S3 bei Hetzner) | R2, R8 | vorhanden (positiv) |

### Restrisiko und Art. 36
Nach Umsetzung der **umgesetzten** Maßnahmen sinkt insb. R5/R7/R12 auf gering. Solange
jedoch **At-rest-Verschlüsselung (F-04), Audit-Log (F-12), Löschkonzept (F-06),
Betroffenenrechte (F-05) und DSB/Notfallprozess (F-17)** offen sind, verbleiben R1, R2, R10
und R11 auf **hoch**. → **Vorläufige Bewertung: Das Restrisiko ist derzeit noch hoch.**
Eine **vorherige Konsultation der BayLDA nach Art. 36** ist zu prüfen bzw. entfällt erst,
wenn die genannten Kernmaßnahmen umgesetzt und das Restrisiko dokumentiert auf ein
vertretbares Maß gesenkt ist. `[Entscheidung DSB/Leitung]`

## 6. Ergebnis und Freigabe
- **Stellungnahme der/des Datenschutzbeauftragten:** `[…]`
- **Standpunkte der Betroffenen/Vertretung (falls eingeholt, Art. 35 Abs. 9):** `[…]`
- **Entscheidung zu Art. 36 (vorherige Konsultation):** `[ja/nein + Begründung]`
- **Freigabe:** `[Name, Rolle, Datum, Unterschrift]`
- **Nächste Überprüfung:** `[Datum]` bzw. bei wesentlicher Änderung (Art. 35 Abs. 11).

## 7. Verweise
- Löschkonzept: `docs-internal/compliance/loeschkonzept.md`
- Datenschutzerklärung (Entwurf): `docs-internal/compliance/datenschutzerklaerung.md`
- Verzeichnis von Verarbeitungstätigkeiten (Art. 30): `[noch zu erstellen]`
- Security-/DSGVO-Auditbericht: `security-audit/04-FINAL-REPORT.md`
- Rechtsquellen/Belege: `security-audit/research/gdpr-german-bdsg-dpia-records.md`

---
*Quellen (Auswahl): Art. 35/36 DSGVO; DSK Muss-Liste v1.1 (17.10.2018); DSK-Kurzpapier Nr. 5
(DSFA) und Nr. 18 (Risiko); §§22, 26, 38 BDSG; §35 SGB I, §§67 ff./84 SGB X. Vollständige
Belege im Audit-Rechercheordner.*
