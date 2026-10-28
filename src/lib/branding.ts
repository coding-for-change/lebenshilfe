// Per-organisation branding. The app ships one build per Lebenshilfe (see
// .github/workflows/deploy.yml and deploy-demo.yml); which preset that build
// uses is picked by NEXT_PUBLIC_ORG at *build* time.
//
// Why a preset key rather than one env var per string: NEXT_PUBLIC_* values are
// inlined into the client bundle by the compiler, so every one of them would
// have to be threaded through the Dockerfile as a separate --build-arg. A single
// key keeps that to one arg, keeps every org's wording under review in git, and
// makes adding the next Lebenshilfe a matter of appending to ORGS below.

export type OrgBranding = {
  /** Display name — page titles, headings, email copy. */
  name: string;
  /** Legal entity, used where the Verein is named as such (email footer, Impressum). */
  legalName: string;
  /** PWA / home-screen label. Keep under ~12 characters or Android truncates it. */
  shortName: string;
  /**
   * Logo for the UI. `width`/`height` must match the asset's real aspect ratio:
   * the components render it with `h-… w-auto`, so the browser derives the
   * width from these numbers and a wrong ratio squashes the logo.
   */
  logo: { src: string; width: number; height: number };
  /** Logo for emails. Must be a raster format — Outlook does not render SVG. */
  emailLogo: string;
  supportEmail: string;
  feedbackEmail: string;
  /**
   * Marks a showcase instance that holds invented data. Drives the demo banner
   * and the noindex headers; never true for an instance with real client data.
   */
  isDemo: boolean;
};

const ORGS = {
  muenchen: {
    name: "Lebenshilfe München",
    legalName: "Lebenshilfe München e.V.",
    shortName: "Lebenshilfe",
    logo: {
      src: "/lebenshilfe-muenchen-logo_2026.svg",
      width: 269,
      height: 96,
    },
    emailLogo: "/lebenshilfe-muenchen-logo_2026.png",
    supportEmail: "support@lebenshilfe-muenchen.de",
    feedbackEmail: "feedback@lebenshilfe-muenchen.de",
    isDemo: false,
  },
  "hamburg-demo": {
    name: "Lebenshilfe Hamburg",
    legalName: "Lebenshilfe Hamburg e.V.",
    shortName: "Lebenshilfe",
    // Dachmarken-Logo (no Hamburg-specific wordmark on hand). 1024×280.
    logo: { src: "/lebenshilfe-logo.png", width: 1024, height: 280 },
    emailLogo: "/lebenshilfe-logo.png",
    // Routed to us, not to the Verein — nobody there is expecting demo mail.
    supportEmail: "info@codingforchange.com",
    feedbackEmail: "info@codingforchange.com",
    isDemo: true,
  },
} satisfies Record<string, OrgBranding>;

type OrgKey = keyof typeof ORGS;

function resolve(): OrgBranding {
  // Written as a direct member expression so the compiler can inline it into
  // the client bundle — a destructured or aliased read is not substituted.
  const key = process.env.NEXT_PUBLIC_ORG;
  if (key && key in ORGS) return ORGS[key as OrgKey];
  return ORGS.muenchen;
}

export const branding: OrgBranding = resolve();
