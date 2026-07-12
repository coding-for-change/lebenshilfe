import type { Metadata } from "next";
import { MapsConsentControl } from "./maps-consent-control";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Lebenshilfe München",
};

// Public privacy notice (Art. 13 DSGVO). DRAFT — placeholders in [eckigen
// Klammern] must be completed by the DPO before production use. Route is
// intentionally unauthenticated so it is reachable before/at data collection.
export default function DatenschutzPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>Entwurf.</strong> Diese Datenschutzerklärung ist ein Entwurf und
        wird vor dem Produktivbetrieb durch die/den Datenschutzbeauftragte(n)
        geprüft und vervollständigt. Angaben in <code>[eckigen Klammern]</code>{" "}
        sind noch zu ergänzen.
      </div>

      <h1 className="text-2xl font-bold tracking-tight">
        Datenschutzerklärung
      </h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-foreground [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_a]:underline [&_a]:underline-offset-2">
        <section>
          <h2>1. Verantwortliche</h2>
          <p>
            <strong>Lebenshilfe München e.V.</strong>, [Anschrift]
            <br />
            Vertreten durch: [vertretungsberechtigte Person(en)]
            <br />
            E-Mail: [Kontakt-E-Mail] · Telefon: [Telefon]
            <br />
            Die technische Entwicklung und der Betrieb erfolgen durch die{" "}
            <strong>Coding for Change e.V.</strong> als Auftragsverarbeiter
            (Art. 28 DSGVO).
          </p>
        </section>

        <section>
          <h2>2. Datenschutzbeauftragte(r)</h2>
          <p>[Name/Funktion, Anschrift, E-Mail]</p>
        </section>

        <section>
          <h2>3. Welche Daten wir verarbeiten</h2>
          <p>
            Die Plattform organisiert die Schulbegleitung für Kinder mit
            Behinderung (Planung, Nachweis geleisteter Stunden mit Unterschrift,
            Abrechnung). Verarbeitet werden: Daten der begleiteten Kinder (Name,
            Schule, Art/Umfang der bewilligten Begleitung,
            Schweigepflichtsentbindung ja/nein, Kostenträger). Bereits die
            Tatsache, dass ein Kind Schulbegleitung erhält, ist ein
            Gesundheitsdatum (Art. 9 DSGVO); es werden{" "}
            <strong>keine Diagnose- oder Gesundheitsdaten</strong> gespeichert.
            Ferner: Daten der Schulbegleiter:innen (Name, E-Mail,
            Einsatz-/Zeitdaten, Unterschrift), Daten der Lehrkräfte (Name +
            Unterschrift zur Bestätigung) sowie Zugangs- und Protokolldaten
            (E-Mail, Passwort nur als Hash, IP-Adresse, technische Logs).
          </p>
        </section>

        <section>
          <h2>4. Zwecke und Rechtsgrundlagen</h2>
          <p>
            Durchführung/Organisation der Schulbegleitung und Beschäftigung
            (Art. 6 Abs. 1 lit. b DSGVO; §26 BDSG); Verarbeitung der besonderen
            Kategorien im Rahmen der Eingliederungshilfe (Art. 9 Abs. 2 [lit.
            b/h] DSGVO i. V. m. §22 BDSG); Abrechnung und gesetzliche
            Aufbewahrung (Art. 6 Abs. 1 lit. c DSGVO); sicherer Betrieb (Art. 6
            Abs. 1 lit. f DSGVO); Kartendarstellung nur mit Einwilligung (Art. 6
            Abs. 1 lit. a DSGVO, §25 TDDDG).
          </p>
        </section>

        <section>
          <h2>5. Empfänger und Auftragsverarbeiter</h2>
          <p>
            Coding for Change e.V. (Entwicklung/Betrieb) und Hetzner
            (Hosting/Objektspeicher, Deutschland/EU) als Auftragsverarbeiter;
            [E-Mail-Dienstleister] für Einladungen/Passwort-E-Mails; Google
            (Google Maps, siehe Ziffer 6–7). Kostenträger und Schulen erhalten
            Einsatznachweise im erforderlichen Umfang.
          </p>
        </section>

        <section>
          <h2>6. Google Maps und Einwilligung</h2>
          <p>
            Kartenfunktionen werden über Google Maps bereitgestellt.{" "}
            <strong>
              Google Maps wird erst geladen, nachdem Sie eingewilligt haben
            </strong>
            ; ohne Einwilligung werden keine Daten an Google übertragen. Die
            Einwilligung ist jederzeit mit Wirkung für die Zukunft widerrufbar:
          </p>
          <MapsConsentControl />
        </section>

        <section>
          <h2>7. Übermittlung in die USA</h2>
          <p>
            Bei Nutzung von Google Maps werden Adress-/Standortdaten und Ihre
            IP-Adresse an Google (USA) übermittelt. Grundlage: EU-US Data
            Privacy Framework (Zertifizierung des Empfängers) [durch DSB zu
            bestätigen]. Gesundheitsbezogene Daten der Kinder werden{" "}
            <strong>nicht</strong> an Google übermittelt.
          </p>
        </section>

        <section>
          <h2>8. Cookies und Speicherung auf Ihrem Gerät</h2>
          <p>
            Notwendige Cookies (Anmeldung/Sitzung) sind technisch erforderlich
            (§25 Abs. 2 TDDDG). Ein Funktionscookie speichert eine
            Anzeigeeinstellung (kein Tracking). Google Maps greift erst nach
            Ihrer Einwilligung auf Ihr Gerät zu. Ein allgemeiner Cookie-Banner
            ist nicht erforderlich.
          </p>
        </section>

        <section>
          <h2>9. Speicherdauer</h2>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Abrechnungsrelevante Nachweise/Belege: 8 Jahre (§147 AO / §257
              HGB), danach Löschung.
            </li>
            <li>
              Mitarbeitenden-/Account-Daten: bis Austritt/Inaktivität (zzgl.
              arbeitsrechtlicher Fristen), danach Löschung.
            </li>
            <li>
              Daten betreuter Kinder: bis Ende der Betreuung (ggf. zzgl.
              Abrechnung), danach Löschung.
            </li>
            <li>Technische Logs: 14 Tage, danach automatische Löschung.</li>
          </ul>
        </section>

        <section>
          <h2>10. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
            Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit
            (Art. 20) und Widerspruch (Art. 21) sowie das Recht, erteilte
            Einwilligungen zu widerrufen (Art. 7 Abs. 3). Zur Ausübung:
            [Kontaktweg]. Beschwerderecht bei der Aufsichtsbehörde:{" "}
            <strong>
              Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach
            </strong>
            .
          </p>
        </section>

        <section>
          <h2>11. Keine automatisierte Entscheidungsfindung</h2>
          <p>
            Es findet keine automatisierte Entscheidungsfindung oder
            Profilbildung im Sinne des Art. 22 DSGVO statt.
          </p>
        </section>

        <section>
          <h2>12. Hinweis zu Kinderdaten</h2>
          <p>
            Die Plattform verarbeitet Daten von Minderjährigen besonders
            schützenswert. Anfragen von Sorgeberechtigten: [Kontakt].
          </p>
        </section>

        <p className="pt-4 text-xs text-muted-foreground">Stand: [Datum].</p>
      </div>
    </main>
  );
}
