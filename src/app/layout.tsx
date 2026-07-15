import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MapsConsentProvider } from "@/lib/maps/maps-consent";
import { AutoRefresh } from "@/components/auto-refresh";
import { DeploymentUpdateNotice } from "@/components/deployment-update-notice";
import { getSession } from "@/lib/auth-guards";
import { ConsentFacade } from "@/features/consent";
import { setMapsConsentAction } from "@/features/consent/actions";

// The nonce-based CSP (src/proxy.ts) needs per-request rendering so Next can
// stamp the request's nonce onto its scripts; opt every route out of static
// prerendering (a prerendered page has no per-request nonce → broken hydration).
export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lebenshilfe München",
  description: "Lebenshilfe München Portal",
  applicationName: "Lebenshilfe München",
  // Makes the site launch full-screen (no Safari chrome) when added to the iOS
  // home screen, and sets the label shown under the icon. The home-screen icon
  // itself is supplied by src/app/apple-icon.png (apple-touch-icon).
  appleWebApp: {
    capable: true,
    title: "Lebenshilfe",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` lets content extend under the notch/home-indicator so that
  // `env(safe-area-inset-*)` resolves to real values on mobile.
  viewportFit: "cover",
  // Resize the layout viewport when the soft keyboard opens, so bottom
  // sheets and sticky footers stay above it instead of being covered.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed Maps consent from the user's account so it persists across devices.
  const session = await getSession();
  const initialConsent = session
    ? await ConsentFacade.getMapsConsent(session.user.id)
    : false;

  return (
    <html
      lang="de"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Keeps content fresh on resume/poll — critical for the standalone
            iOS home-screen app, which has no reload UI and freezes on
            background. */}
        <AutoRefresh />
        {/* Prompts a reload when a Server Action fails because the tab was
            built by a previous deployment (stale action IDs). */}
        <DeploymentUpdateNotice />
        <MapsConsentProvider
          initialConsent={initialConsent}
          authenticated={!!session}
          onSetConsent={setMapsConsentAction}
        >
          {children}
        </MapsConsentProvider>
      </body>
    </html>
  );
}
