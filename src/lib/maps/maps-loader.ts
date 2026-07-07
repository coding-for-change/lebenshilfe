"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type MapsLibraryName = "places" | "maps" | "marker";

let initialized = false;
let consentGranted = false;
const cache = new Map<MapsLibraryName, Promise<unknown>>();

// Gates all Google Maps loading behind explicit consent (TDDDG §25). Set by the
// MapsConsentProvider; until it is true no Google request is made, even if a
// caller forgets to wrap itself in a consent gate.
export function setMapsConsentGranted(granted: boolean): void {
  consentGranted = granted;
}

function ensureInitialized(): void {
  if (initialized) return;
  if (typeof window === "undefined") {
    throw new Error("ssr");
  }
  if (!consentGranted) {
    throw new Error("maps-consent-required");
  }
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing");
  }
  setOptions({ key: apiKey, v: "weekly" });
  initialized = true;
}

// Lazily loads a Google Maps JS library and memoizes the result so each
// library is fetched at most once per browser session.
export function loadMapsLibrary(name: MapsLibraryName): Promise<unknown> {
  try {
    ensureInitialized();
  } catch (e) {
    return Promise.reject(e);
  }
  let p = cache.get(name);
  if (!p) {
    p = importLibrary(name);
    cache.set(name, p);
  }
  return p;
}
