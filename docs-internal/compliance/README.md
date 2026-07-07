# Compliance drafts — Datenschutz-Dokumentation

> **⚠️ ENTWÜRFE — kein Rechtsrat.** These are engineering-prepared **drafts** to give
> your Datenschutzbeauftragte(r) (DPO) and/or legal counsel a substantive starting point.
> They must be **reviewed, corrected and completed** before use. Every fact only your
> organisation can supply is marked as a `[PLATZHALTER]`. Do not publish or file any of
> these without DPO/legal sign-off.

Generated from the security & GDPR audit (`security-audit/`) on 2026-07-07.

## Documents

| File | Purpose | Unblocks | Owner to complete |
|------|---------|----------|-------------------|
| `datenschutz-folgenabschaetzung.md` | DSFA / DPIA per Art. 35 DSGVO (mandatory — DSK Muss-Liste Nr. 3) | **F-01 / COD-97** | DPO + management |
| `loeschkonzept.md` | Retention / deletion / anonymisation schedule (DIN 66398) | **F-06 / COD-102**, feeds F-05 | DPO + management + dev |
| `datenschutzerklaerung.md` | Public privacy notice (Art. 13) + Impressum checklist | **F-08 / COD-104** | DPO + legal |

## Why these three, and why now
Three audit findings are **legal/organisational blockers**, not code: a DSFA is *mandatory*
for large-scale Art. 9 data on minors, a written retention schedule is required to make
erasure (F-05) safe and lawful, and a reachable privacy notice is required before data
collection (Art. 13) and to host the DPO contact + the Google-Maps consent basis. Writing
them unblocks F-01, F-06 and F-08 and provides the risk/TOM baseline the DSFA needs.

## What still needs a human (non-exhaustive)
- Legal identity + address of the **Verantwortliche(r)** (controller) and the **DPO** contact.
- Confirmation of the concrete **SGB / Eingliederungshilfe retention periods** (vary by Träger — §84(2) SGB X necessity test).
- Signed **Auftragsverarbeitungsverträge (AVV)** with Hetzner, Resend/mail provider, and the DPF/SCC status for US transfers (F-07).
- The **RoPA (Verzeichnis von Verarbeitungstätigkeiten, Art. 30)** — closely related, not included here; the DSFA §2 and the Löschkonzept together provide most of its content.

## Status of the technical measures referenced in the DSFA
The DSFA §5 maps each risk to a technical/organisational measure and its status. As of
2026-07-07 the following are implemented in code (open PRs): security headers + CSP
(**F-02**, PR #115), PII-free logging + redaction (**F-03**, PR #116), 12-char password
policy + breach check (**F-19**, PR #117), CSV formula-injection fix (**F-14**, PR #118).
All other measures are tracked as open findings/issues and marked *geplant* in the DSFA.
