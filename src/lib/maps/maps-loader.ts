"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type MapsLibraryName = "places" | "maps" | "marker";

let initialized = false;
const cache = new Map<MapsLibraryName, Promise<unknown>>();

function ensureInitialized(): void {
  if (initialized) return;
  if (typeof window === "undefined") {
    throw new Error("ssr");
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

