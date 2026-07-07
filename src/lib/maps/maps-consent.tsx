"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setMapsConsentGranted } from "@/lib/maps/maps-loader";

// First-party record of the user's decision to load Google Maps. Storing the
// consent choice itself is strictly necessary (§25 Abs. 2 TDDDG) and needs no
// consent; the value never leaves the browser.
const STORAGE_KEY = "lh.mapsConsent";

type MapsConsent = {
  /** Whether Google Maps may load. */
  consent: boolean;
  /** False until the persisted choice has been read (avoids a wrong first paint). */
  ready: boolean;
  grant: () => void;
  revoke: () => void;
};

const MapsConsentContext = createContext<MapsConsent | null>(null);

export function MapsConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const granted = localStorage.getItem(STORAGE_KEY) === "granted";
    setMapsConsentGranted(granted);
    setConsent(granted);
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setMapsConsentGranted(true);
    setConsent(true);
  }, []);

  const revoke = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMapsConsentGranted(false);
    setConsent(false);
    // Google's script/state cannot be unloaded within the session; a reload
    // clears it. Callers that need immediate effect should reload after revoke.
  }, []);

  return (
    <MapsConsentContext.Provider value={{ consent, ready, grant, revoke }}>
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
