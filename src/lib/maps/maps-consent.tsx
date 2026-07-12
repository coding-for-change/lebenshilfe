"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Google-Maps consent is stored server-side against the user account (an
// append-only ConsentEvent log — demonstrable consent per Art. 7 DSGVO) rather
// than in the browser, so it persists across devices and the controller can
// prove it. The provider is seeded from the server on each full page load; the
// consumers (gate, autocompletes) load Google only when `consent` is true.
// The persistence action is injected by the app layer so this stays free of a
// feature dependency.

type MapsConsent = {
  /** Whether Google Maps may load for the current user. */
  consent: boolean;
  /** Whether a user is signed in (only then can consent be recorded). */
  authenticated: boolean;
  grant: () => Promise<void>;
  revoke: () => Promise<void>;
};

const MapsConsentContext = createContext<MapsConsent | null>(null);

export function MapsConsentProvider({
  children,
  initialConsent,
  authenticated,
  onSetConsent,
}: {
  children: React.ReactNode;
  initialConsent: boolean;
  authenticated: boolean;
  onSetConsent: (granted: boolean) => Promise<unknown>;
}) {
  const [consent, setConsent] = useState(initialConsent);

  // Record consent server-side first, then flip local state — so Google is only
  // loaded after the decision is durably stored (never processing-before-consent).
  const grant = useCallback(async () => {
    await onSetConsent(true);
    setConsent(true);
  }, [onSetConsent]);

  const revoke = useCallback(async () => {
    await onSetConsent(false);
    setConsent(false);
  }, [onSetConsent]);

  return (
    <MapsConsentContext.Provider
      value={{ consent, authenticated, grant, revoke }}
    >
      {children}
    </MapsConsentContext.Provider>
  );
}

export function useMapsConsent(): MapsConsent {
  const ctx = useContext(MapsConsentContext);
  if (!ctx) {
    throw new Error("useMapsConsent must be used within a MapsConsentProvider");
  }
  return ctx;
}
