# Datenschutzerklärung (Entwurf) — Schulbegleitungs-Plattform

> **⚠️ ENTWURF — kein Rechtsrat.** Text für die künftige Seite `/datenschutz` (F-08/COD-104).
> Von DSB/Rechtsbeistand zu prüfen und zu vervollständigen. `[PLATZHALTER]` = intern zu
> befüllen. Inhalt nach **Art. 13 DSGVO**. Muss **vor** bzw. bei der Datenerhebung
> erreichbar sein (z. B. verlinkt auf Login-/Onboarding-Seite). Sprache: Deutsch, einfach
> gehalten (auch für Sorgeberechtigte/junge Betroffene verständlich).

## 1. Verantwortliche(r)
**Lebenshilfe München e.V.**, `[ANSCHRIFT]`
Vertreten durch: `[VERTRETUNGSBERECHTIGTE PERSON(EN)]`
E-Mail: `[KONTAKT-E-MAIL]` · Telefon: `[TELEFON]`
Die technische Entwicklung und der Betrieb erfolgen durch **Coding for Change e.V.** als Auftragsverarbeiter (Art. 28).

## 2. Datenschutzbeauftragte(r)
`[NAME/FUNKTION, ANSCHRIFT, E-MAIL]`
(Die Benennung einer/eines Datenschutzbeauftragten ist hier gesetzlich verpflichtend.)

## 3. Was diese Plattform tut und welche Daten verarbeitet werden
Die Plattform dient der Organisation der **Schulbegleitung** für **Kinder mit
Behinderung**: Planung der Einsätze, Erfassung geleisteter Stunden mit Unterschrift und
Abrechnung gegenüber den Kostenträgern. Verarbeitet werden insbesondere:

- **Daten der begleiteten Kinder**, einschließlich **Gesundheits-/Behinderungsdaten**
  (besondere Kategorien nach Art. 9 DSGVO): Name, Schule, Angaben aus dem Bescheid,
  bewilligte Förderstunden, Schweigepflichtsentbindung, Bemerkungen, Abwesenheiten.
- **Daten der Schulbegleiter:innen** (Beschäftigte/Honorarkräfte): Name, E-Mail,
  Einsatz- und Zeitdaten, Wochenstunden, handschriftliche Unterschrift.
- **Daten der Lehrkräfte:** Vor-/Nachname und Unterschrift zur monatlichen Bestätigung der
  Einsätze (kein eigener Zugang zur Plattform).
- **Zugangs-/Nutzungsdaten:** E-Mail, Passwort (nur als Hash), Sitzungsdaten, IP-Adresse,
  Zugriffs-/Fehlerprotokolle.
- **Adress-/Standortdaten** von Schulen und Kostenträgern (für Kartendarstellung/-suche).

## 4. Zwecke und Rechtsgrundlagen
| Zweck | Rechtsgrundlage |
|---|---|
| Durchführung/Organisation der Schulbegleitung, Vertrag/Beschäftigung | Art. 6 Abs. 1 lit. b DSGVO; §26 BDSG (Beschäftigte) |
| Verarbeitung der Gesundheits-/Behinderungsdaten der Kinder | Art. 9 Abs. 2 `[lit. b und/oder h]` DSGVO i. V. m. §22 BDSG (Sozialleistung/Eingliederungshilfe) |
| Abrechnung und gesetzliche Aufbewahrung | Art. 6 Abs. 1 lit. c DSGVO (§147 AO, SGB) |
| Zugangs-/Kontosicherheit, Betrieb der Plattform | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem Betrieb) |
| Kartendarstellung Google Maps | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) + §25 Abs. 1 TDDDG |

`[Rechtsgrundlagen je Zweck durch DSB final bestätigen.]`

## 5. Empfänger und Auftragsverarbeiter
- **Coding for Change e.V.** (Entwicklung und Betrieb der Plattform) — Auftragsverarbeiter (Art. 28), AVV geschlossen.
- **Hetzner** (Hosting und Objektspeicher, Deutschland/EU) — Auftragsverarbeiter (Art. 28), AVV geschlossen.
- **`[E-Mail-Dienstleister: Resend / SMTP]`** — Versand von Einladungen und Passwort-E-Mails, Auftragsverarbeiter, `[AVV; Serverstandort/Drittland?]`.
- **Google Ireland/LLC (Google Maps)** — Kartendarstellung/Adresssuche; Google agiert insoweit als **eigenständig Verantwortlicher**; Übermittlung von Adress-/Standortdaten und IP in die **USA** (siehe Ziffer 7).
- **Kostenträger und Schulen** erhalten Einsatznachweise/Abrechnungen im erforderlichen Umfang.
- Interne Protokolle werden mit `[Grafana Alloy/Loki]` verarbeitet.

## 6. Google Maps und Einwilligung
> **Hinweis (Abstimmung):** Es wird Google Maps eingesetzt; dabei findet eine Übermittlung
> in die USA statt (siehe Ziffer 7). Die frühere interne Aussage „kein Drittlandtransfer"
> wird entsprechend korrigiert. Übermittelt werden nur Adress-/Standortdaten und die IP,
> **keine Gesundheitsdaten der Kinder**. `[Mit DSB/Betriebsrat bestätigen; alternativ
> Wechsel auf eine Open-Source-Karte ohne Drittlandbezug.]`

Kartenfunktionen werden über Google Maps bereitgestellt. **Google Maps wird erst geladen,
nachdem Sie ausdrücklich eingewilligt haben** (Klick auf „Karte laden"). Ohne Einwilligung
werden keine Daten an Google übertragen. Die Einwilligung kann jederzeit mit Wirkung für
die Zukunft widerrufen werden `[Angabe, wie widerrufen wird]`.

## 7. Übermittlung in Drittländer (USA)
Bei Nutzung von Google Maps `[und ggf. des E-Mail-Dienstes]` werden Daten in die **USA**
übermittelt. Grundlage: `[EU-US Data Privacy Framework — Zertifizierung des Empfängers —
und/oder Standardvertragsklauseln (SCC) nach Art. 46 DSGVO]`. `[Durch DSB bestätigen.]`
Besondere Kategorien (Gesundheitsdaten der Kinder) werden **nicht** an Google/Drittländer
übermittelt.

## 8. Cookies und Speicherung auf Ihrem Gerät
- **Notwendige Cookies** (Sitzungs-/Anmeldecookie): technisch erforderlich, keine
  Einwilligung nötig (§25 Abs. 2 TDDDG).
- **Funktionscookie** `sidebar_state` (Bedienoberfläche): speichert nur eine
  Anzeigeeinstellung, kein Tracking.
- **Google Maps** setzt/greift erst **nach Ihrer Einwilligung** auf Speicher zu (Ziffer 6).

Ein allgemeiner Cookie-Banner ist nicht erforderlich, da außer der einwilligungspflichtigen
Kartenfunktion keine nicht-notwendigen Cookies/Dienste eingesetzt werden.

## 9. Speicherdauer
Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke
erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:
- **Abrechnungsrelevante Nachweise/Belege** (Einsatznachweise, Monatsberichte, zugehörige
  Unterschriften): **8 Jahre** (§147 AO / §257 HGB), danach Löschung.
- **Mitarbeitenden-/Account-Daten:** bis Austritt/Inaktivität (zzgl. arbeitsrechtlicher
  Fristen), danach Löschung.
- **Daten betreuter Kinder:** bis Ende der Betreuung (ggf. zzgl. Abrechnung), danach Löschung.
- **Technische Logs:** 14 Tage, danach automatische Löschung.
Einzelheiten regelt unser internes Löschkonzept.

## 10. Ihre Rechte
Sie haben das Recht auf **Auskunft** (Art. 15), **Berichtigung** (Art. 16), **Löschung**
(Art. 17), **Einschränkung** (Art. 18), **Datenübertragbarkeit** (Art. 20) und **Widerspruch**
(Art. 21). Erteilte **Einwilligungen** können Sie jederzeit mit Wirkung für die Zukunft
**widerrufen** (Art. 7 Abs. 3). Zur Ausübung: `[KONTAKTWEG]`.

**Beschwerderecht:** Sie können sich bei einer Aufsichtsbehörde beschweren, zuständig ist das
**Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach**.

## 11. Pflicht zur Bereitstellung
Für die Teilnahme an der Schulbegleitung bzw. die Nutzung der Plattform ist die
Bereitstellung der genannten Daten erforderlich; ohne sie können Betreuung/Abrechnung nicht
durchgeführt werden (Art. 13 Abs. 2 lit. e). `[Ggf. präzisieren.]`

## 12. Keine automatisierte Entscheidungsfindung
Es findet **keine** automatisierte Entscheidungsfindung oder Profilbildung im Sinne des
Art. 22 DSGVO statt. `[Bestätigen.]`

## 13. Hinweis zu Kinderdaten
Die Plattform verarbeitet Daten von **Minderjährigen** besonders schützenswert. Anfragen von
Sorgeberechtigten zu den Daten ihres Kindes richten Sie an `[KONTAKT]`.

## 14. Stand / Änderungen
Stand: `[DATUM]`. Wir passen diese Erklärung an, wenn sich die Verarbeitung ändert.

---

## Anhang: Impressum (§5 DDG) — Checkliste (separate Pflichtseite `/impressum`)
> Kein Teil der Datenschutzerklärung, aber ebenfalls gesetzlich erforderlich. Zu befüllen:
- [ ] Name und Anschrift des Anbieters (Rechtsform) `[…]`
- [ ] Vertretungsberechtigte Person(en) / Vorstand `[…]`
- [ ] Schnelle Kontaktaufnahme: E-Mail **und** Telefon `[…]`
- [ ] Registergericht + Registernummer (Vereinsregister/Handelsregister) `[…]`
- [ ] Umsatzsteuer-ID (falls vorhanden) `[…]`
- [ ] Zuständige Aufsichts-/Erlaubnisbehörde (falls einschlägig) `[…]`
- [ ] Bei Vereinen: Angaben nach Vereinsrecht `[…]`
- [ ] ggf. inhaltlich Verantwortliche(r) i. S. d. Presserechts `[…]`

---
*Belege: Art. 6/7/9/13/15–22/44 DSGVO; §§22, 26 BDSG; §25 TDDDG; §147 AO; §5 DDG.
Fachliche Grundlage: `security-audit/research/gdpr-rights-processors-transfers.md`,
`…/gdpr-german-bdsg-dpia-records.md`. BayLDA-Anschrift vor Veröffentlichung verifizieren.*
