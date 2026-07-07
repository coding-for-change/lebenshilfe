"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { MAPS_CONSENT_STORAGE_KEY } from "@/lib/maps/maps-loader";

// First-party record of the user's decision to load Google Maps. Storing the
// consent choice itself is strictly necessary (§25 Abs. 2 TDDDG) and needs no
// consent; the value never leaves the browser. localStorage is the single source
// of truth — the maps loader reads the same key to gate Google requests.
const CHANGE_EVENT = "lh:maps-consent-change";

function readConsent(): boolean {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(MAPS_CONSENT_STORAGE_KEY) === "granted"
  );
}

function subscribe(onChange: () => void): () => void {
  // `storage` fires for changes made in other tabs; the custom event covers
  // grant/revoke within this tab.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

type MapsConsent = {
  /** Whether Google Maps may load. */
  consent: boolean;
  grant: () => void;
  revoke: () => void;
};

const MapsConsentContext = createContext<MapsConsent | null>(null);

export function MapsConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reads the persisted choice without a setState-in-effect and stays
  // hydration-safe: the server snapshot is `false`, then the client syncs.
  const consent = useSyncExternalStore(subscribe, readConsent, () => false);

  const grant = useCallback(() => {
    window.localStorage.setItem(MAPS_CONSENT_STORAGE_KEY, "granted");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const revoke = useCallback(() => {
    // Google's script/state cannot be unloaded within the session; a reload
    // clears it. Callers needing immediate effect should reload after revoke.
    window.localStorage.removeItem(MAPS_CONSENT_STORAGE_KEY);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <MapsConsentContext.Provider value={{ consent, grant, revoke }}>
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
