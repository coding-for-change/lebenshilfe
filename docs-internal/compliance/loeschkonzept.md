# Löschkonzept (Aufbewahrung · Löschung · Anonymisierung)

> **⚠️ ENTWURF — kein Rechtsrat.** Von der/dem Datenschutzbeauftragten zu prüfen und
> freizugeben. Aufbau nach **DIN 66398**. Stand 2026-07-07, v0.2.
> **Maßgebliche Quelle (Source of Truth):** *Projektsteckbrief für den Betriebsrat –
> Digitalisierung der Einsatznachweise in der Schulbegleitung*, Lebenshilfe München e.V. ×
> Coding for Change e.V., **Stand 25.06.2026**, Abschnitt „Aufbewahrung & Löschung" (S. 3).
> Dieses Konzept ist an diese Quelle angeglichen; Abweichungen/Klärungsbedarf siehe §0.

## 0. Abgleich mit dem Projektsteckbrief — Status & Klärungsbedarf
Diese Fassung **übernimmt die vier Aufbewahrungskategorien des Projektsteckbriefs
unverändert** (§3). Gegenüber der vorherigen Entwurfsfassung wurde entfernt: eine
angenommene gesonderte SGB-/Eingliederungshilfe-Aufbewahrungsfrist (~5 J.) für Kinderdaten;
und die Log-Frist wurde von „30–90 Tage" auf **14 Tage** korrigiert.

**Offene Punkte, die vor Freigabe mit der/dem DSB zu klären sind (nicht durch dieses Dokument entschieden):**
- **[K1 – Protokoll/Audit-Log-Frist]** Der Steckbrief speichert **technische Protokolle
  inkl. Datensatz-Änderungen (Zeitstempel + auslösendes Konto) 14 Tage**. Für die
  **Nachvollziehbarkeit nach §22 Abs. 2 Nr. 2 BDSG** und die **Eingrenzung von
  Datenschutzverletzungen (Art. 33, 72-h-Meldung)** kann eine 14-Tage-Frist für das
  *sicherheitsrelevante Zugriffs-/Änderungsprotokoll* zu kurz sein (eine später entdeckte
  Verletzung ließe sich nicht mehr rekonstruieren). Empfehlung: technische Betriebs-Logs
  14 Tage; sicherheitsrelevantes Audit-Log der Art.-9-Kinderdaten **länger** (z. B.
  `[90 Tage – 1 Jahr]`). Zu entscheiden.
- **[K2 – Kinderdaten/SGB]** Der Steckbrief löscht Kinderdaten „bis Ende der Betreuung
  (+ ggf. Abrechnung)". Falls für den Träger eine **gesetzliche Dokumentations-/
  Aufbewahrungspflicht der Eingliederungshilfe (SGB)** besteht, wäre „Löschen bei
  Betreuungsende" ggf. zu früh und benötigte eine Aufbewahrungssperre analog zu Belegen.
  Mit DSB bestätigen.
- **[K3 – Drittland/Maps, Entscheidung getroffen]** Google Maps wird **beibehalten**; die
  Steckbrief-Aussage „kein Drittlandtransfer" wird korrigiert (Übermittlung an Google/USA
  auf Basis EU-US DPF + Einwilligung nach §25 TDDDG, F-08/F-07). Betrifft die Löschfristen
  nicht.

## 1. Zweck und Rechtsrahmen
Personenbezogene Daten sind zu löschen, sobald sie für den Zweck nicht mehr erforderlich
sind (**Art. 5 Abs. 1 lit. e, Art. 17 DSGVO**), *soweit* keine gesetzliche
Aufbewahrungspflicht entgegensteht (**Art. 17 Abs. 3 lit. b**; §147 AO / §257 HGB).

## 2. Methodik (DIN 66398)
Datenart → Startzeitpunkt → Regellöschfrist → **Löschklasse** → Umsetzungsregel je Technologie.

## 3. Aufbewahrungskategorien (unverändert aus dem Projektsteckbrief, S. 3)

| Datenart | Aufbewahrung | Danach |
|---|---|---|
| **Abrechnungsrelevante Nachweise / Belege** | Gesetzliche Frist (Buchungsbelege: **8 Jahre**) | Löschung |
| **Mitarbeitenden-/Account-Daten** | Bis Austritt / Inaktivität (+ arbeitsrechtliche Fristen) | Löschung |
| **Daten betreuter Kinder** | Bis Ende der Betreuung (+ ggf. Abrechnung) | Löschung |
| **Technische Logs** | 14 Tage | Automatische Löschung |

## 4. Löschklassen (Ableitung aus §3)

| LK | entspricht Kategorie (S. 3) | Startzeitpunkt | Regellöschfrist |
|----|------------------------------|----------------|-----------------|
| **LK-1 Belege** | Abrechnungsrelevante Nachweise/Belege | Ende des Kalenderjahres der Belegentstehung | **8 Jahre** (§147 AO/§257 HGB), danach Löschung |
| **LK-2 Konto/Mitarbeitende** | Mitarbeitenden-/Account-Daten | Austritt / dauerhafte Inaktivität | bis Austritt/Inaktivität **+ arbeitsrechtliche Fristen**, danach Löschung |
| **LK-3 Kinderdaten** | Daten betreuter Kinder | Ende der Betreuung | bis Betreuungsende (**+ ggf. Abrechnung → dann LK-1**), danach Löschung |
| **LK-4 Logs** | Technische Logs (inkl. Protokoll Datensatz-Änderungen) | Entstehung | **14 Tage**, automatische Löschung *(K1 beachten)* |
| **LK-0 Sitzungen/Token** | (technische Notwendigkeit, Teil des Kontobetriebs) | Ablauf/Invalidierung | unverzüglich nach Ablauf |

## 5. Zuordnung Datenmodell → Löschklasse

Bezug: `prisma/schema.prisma`. „Anon." = Anonymisieren statt Löschen.

| Model / Feld | Kategorie | LK | Frist / Regel |
|---|---|---|---|
| `Session`, `Verification` | technisch | LK-0 | Purge nach Ablauf (≤ 24 h) |
| `Invitation` | Konto | LK-0/LK-2 | nach Nutzung/Ablauf löschen |
| `Account`, `User` | Mitarbeitenden-/Account-Daten | LK-2 | Austritt/Inaktivität + arbeitsrechtl. Fristen → Löschung; Belegbezüge → Anon. (s. `Event`) |
| `SchoolAssistantProfile` (+`zvNeuNote`), `WorkshopAttendance`, `Workshop` | Mitarbeitenden-Daten | LK-2 | wie Konto |
| `Event` (Leistungsnachweis, `note`, `signatureKey`), `MonthlyReport` (+ `supervisorName`, `supervisorSignatureKey`) | **Abrechnungsrelevanter Beleg** | **LK-1** | 8 Jahre (Ende Kalenderjahr), dann Löschung; bei Kind-Löschung Restsatz (`childId=NULL`, SetNull) **anonymisieren** |
| **S3-Unterschriften** (`signatures/…`) | folgt dem Beleg | LK-1 (bzw. LK-3) | wie Beleg; **DeleteObject implementieren** + Reconciliation verwaister Objekte |
| `Child` (+ `bescheid`, `bemerkung`, `approved*Hours`, `schweigepflichtsentbindung`), `ChildAbsence`, `Schedule`, `ChildAssignment`, `ChildVertretung`, `PendingVertretungRequest` | Daten betreuter Kinder | **LK-3** | bis Betreuungsende; abrechnungsrelevante Teile → LK-1 (8 J.); danach Löschung *(K2 beachten)* |
| `Kostentraeger`, `School`, `Pool`, `HolidayPlan*` | Organisations-/Stammdaten | — | solange betrieblich erforderlich |
| pino-Protokolle → Alloy/Loki (An-/Abmeldung, Datensatz-Erstellung/-Änderung mit Zeitstempel + Konto) | Technische Logs | **LK-4** | **14 Tage** auto *(K1: für Art.-9-Audit ggf. länger)* |
| Backups (DB + S3) | Sicherung | — | Rotation `[Frist]`; Löschungen ziehen mit Rotation nach |

## 6. Löschung vs. Anonymisierung
- **Löschung:** physische Entfernung aus DB, Objektspeicher und (mit Rotation) Backups.
- **Anonymisierung:** irreversibler Wegfall des Personenbezugs; zu bevorzugen, wo ein
  **Beleg** gesetzlich aufzubewahren ist, der Personenbezug aber nicht mehr erforderlich ist
  (z. B. `Event`-Restsätze nach Kind-Löschung).

## 7. Umgang mit Löschbegehren (Art. 17)
- Innerhalb einer Aufbewahrungsfrist (LK-1; ggf. LK-3 mit Abrechnungsbezug): Löschung
  **ablehnen mit Begründung** (Art. 17 Abs. 3 lit. b), Verarbeitung **einschränken**
  (Art. 18), zur Löschung bei Fristablauf **vormerken**.
- Sonst (LK-3 ohne Belegbezug): **unverzüglich** löschen/anonymisieren, inkl. S3-Objekte und
  Ausschluss aus Backups/Logs.

## 8. Umsetzungsregeln je Technologie (Anforderungen an F-06/F-05)
1. **MySQL/Prisma:** geplanter, protokollierter Lösch-/Anon.-Job; purged `Session`/`Verification`; wendet LK-1/LK-2/LK-3-Regeln an; anonymisiert verwaiste `Event`-Restsätze.
2. **Hetzner S3:** `DeleteObjectCommand` implementieren (**fehlt heute**); an Datensatzlöschung koppeln; DB↔Bucket-Reconciliation.
3. **Logs (Alloy/Loki):** **14-Tage-TTL** konfigurieren (LK-4); für ein separates Art.-9-Audit-Log ggf. längere Frist (K1).
4. **Backups:** Rotationsfristen dokumentieren; Wirksamwerden von Löschungen sicherstellen.
5. **GoBD:** in-Frist-Belege tamper-evident/maschinenlesbar archivieren.

## 9. Verantwortlichkeiten und Überprüfung
Fachlich/rechtlich: DSB + Leitung (Fristen, SGB-Bestätigung K2, Audit-Log-Frist K1).
Technisch: Coding for Change e.V. (Auftragsverarbeiter). Überprüfung jährlich und bei
Änderung; Abgleich mit DSFA und RoPA.

---
*Quelle der Fristen: Projektsteckbrief (25.06.2026), S. 3; rechtliche Belege: §147 AO,
§257 HGB, §§35/67c/84 SGB X, Art. 5/17 DSGVO, DIN 66398 —
`security-audit/research/gdpr-german-bdsg-dpia-records.md` §8.*
