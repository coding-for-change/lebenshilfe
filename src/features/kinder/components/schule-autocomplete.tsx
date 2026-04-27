"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import usePlacesAutocomplete, {
  getDetails,
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SchuleValue = {
  placeId: string | null;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

const EMPTY: SchuleValue = {
  placeId: null,
  name: null,
  address: null,
  lat: null,
  lng: null,
};

let loaderPromise: Promise<unknown> | null = null;

function loadGoogleMaps(): Promise<unknown> {
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

type Props = {
  value: SchuleValue;
  onChange: (next: SchuleValue) => void;
  id?: string;
  ariaInvalid?: boolean;
};

export function SchuleAutocomplete({
  value,
  onChange,
  id,
  ariaInvalid,
}: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Google Maps konnte nicht geladen werden ({error}). Adresse manuell als
        Hinweis im Bemerkungsfeld festhalten.
      </div>
    );
  }

  if (!ready) {
    return (
      <Input
        id={id}
        disabled
        placeholder="Lade Google Maps…"
      />
    );
  }

  return (
    <ReadyAutocomplete
      value={value}
      onChange={onChange}
      id={id}
      ariaInvalid={ariaInvalid}
    />
  );
}

function ReadyAutocomplete({ value, onChange, id, ariaInvalid }: Props) {
  const {
    ready,
    value: query,
    suggestions: { status, data },
    setValue: setQuery,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ["establishment"] },
    debounce: 250,
    cache: 24 * 60 * 60,
  });

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.name && !query) setQuery(value.name, false);
  }, [value.name, query, setQuery]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSelect(placeId: string, description: string) {
    try {
      const details = (await getDetails({
        placeId,
        fields: ["place_id", "name", "formatted_address", "geometry"],
      })) as google.maps.places.PlaceResult;
      let lat: number | null = null;
      let lng: number | null = null;
      if (details.geometry?.location) {
        lat = details.geometry.location.lat();
        lng = details.geometry.location.lng();
      } else {
        const results = await getGeocode({ placeId });
        if (results[0]) {
          const { lat: la, lng: ln } = await getLatLng(results[0]);
          lat = la;
          lng = ln;
        }
      }
      onChange({
        placeId: details.place_id ?? placeId,
        name: details.name ?? description,
        address: details.formatted_address ?? description,
        lat,
        lng,
      });
      setQuery(details.name ?? description, false);
      clearSuggestions();
      setOpen(false);
    } catch {
      onChange({ ...EMPTY, name: description, address: description });
      clearSuggestions();
      setOpen(false);
    }
  }

  function handleClear() {
    onChange(EMPTY);
    setQuery("", false);
    clearSuggestions();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={!ready}
          placeholder="Schule suchen (Name oder Adresse)…"
          aria-invalid={ariaInvalid}
          className="pl-9 pr-9"
        />
        {value.placeId ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={handleClear}
            aria-label="Auswahl entfernen"
          >
            <X />
          </Button>
        ) : null}
      </div>
      {open && status === "OK" && data.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md">
          {data.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left hover:bg-accent",
                )}
                onClick={() =>
                  handleSelect(
                    s.place_id,
                    s.structured_formatting.main_text +
                      ", " +
                      s.structured_formatting.secondary_text,
                  )
                }
              >
                <span className="font-medium">
                  {s.structured_formatting.main_text}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.structured_formatting.secondary_text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
