"use client";

import { useEffect, useRef, useState } from "react";

export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export type SuggestionStatus =
  | "idle"
  | "loading"
  | "OK"
  | "NO_RESULTS"
  | "ERROR";

export function usePlaceSuggestions(opts: {
  ready: boolean;
  // Place type filter, e.g. ["establishment"] or ["address"].
  includedPrimaryTypes?: string[];
  debounceMs?: number;
}) {
  const [query, setQueryState] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState<SuggestionStatus>("idle");
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const debounceMs = opts.debounceMs ?? 250;

  function setQuery(next: string, suppressFetch = false) {
    setQueryState(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (suppressFetch || !next.trim() || !opts.ready) {
      if (!next.trim()) {
        setSuggestions([]);
        setStatus("idle");
      }
      return;
    }
    setStatus("loading");
    timerRef.current = setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        }
        const result =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: next,
              includedPrimaryTypes: opts.includedPrimaryTypes,
              sessionToken: sessionTokenRef.current,
            },
          );
        if (cancelledRef.current) return;
        const list: PlaceSuggestion[] = [];
        for (const s of result.suggestions) {
          const p = s.placePrediction;
          if (!p?.placeId) continue;
          list.push({
            placeId: p.placeId,
            mainText: p.mainText?.text ?? "",
            secondaryText: p.secondaryText?.text ?? "",
            description: p.text.text,
          });
        }
        setSuggestions(list);
        setStatus(list.length > 0 ? "OK" : "NO_RESULTS");
      } catch {
        if (cancelledRef.current) return;
        setSuggestions([]);
        setStatus("ERROR");
      }
    }, debounceMs);
  }

  function clearSuggestions() {
    setSuggestions([]);
    setStatus("idle");
  }

  // After a selection commits the session token's value, the next fetch
  // should start a fresh session.
  function resetSession() {
    sessionTokenRef.current = null;
  }

  return {
    query,
    setQuery,
    suggestions,
    status,
    clearSuggestions,
    resetSession,
  };
}

// Fetches detail fields for a given Place. The session token (if any) is
// closed on the server side once details are fetched.
export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails> {
  // The Place class is the modern replacement for PlacesService.
  const place = new google.maps.places.Place({ id: placeId });
  await place.fetchFields({
    fields: ["displayName", "formattedAddress", "location"],
  });
  const loc = place.location;
  return {
    placeId,
    name: place.displayName ?? "",
    address: place.formattedAddress ?? "",
    lat: loc ? loc.lat() : null,
    lng: loc ? loc.lng() : null,
  };
}
