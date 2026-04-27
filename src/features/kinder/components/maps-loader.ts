"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let loaderPromise: Promise<unknown> | null = null;

// Loads the Google Maps Places library exactly once per browser session.
// Returns a rejected promise on the server or when the API key is missing.
export function loadGoogleMaps(): Promise<unknown> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("ssr"));
  }
  if (loaderPromise) return loaderPromise;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  }
  setOptions({ key: apiKey, v: "weekly", libraries: ["places"] });
  loaderPromise = importLibrary("places");
  return loaderPromise;
}
