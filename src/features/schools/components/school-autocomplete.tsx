"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadMapsLibrary } from "@/lib/maps/maps-loader";
import { fetchPlaceDetails, usePlaceSuggestions } from "@/lib/maps/places-api";
import { EMPTY_SCHOOL_VALUE, type SchoolValue } from "../schemas";

export type { SchoolValue };

type Props = {
  value: SchoolValue;
  onChange: (next: SchoolValue) => void;
  id?: string;
  ariaInvalid?: boolean;
};

export function SchoolAutocomplete({
  value,
  onChange,
  id,
  ariaInvalid,
}: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapsLibrary("places")
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
        Google Maps konnte nicht geladen werden ({error}). Adresse manuell
        eintragen.
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
    query,
    setQuery,
    suggestions,
    status,
    clearSuggestions,
    resetSession,
  } = usePlaceSuggestions({
    ready: true,
    includedPrimaryTypes: ["establishment"],
    debounceMs: 250,
  });

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.name && !query) setQuery(value.name, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSelect(placeId: string, fallbackDescription: string) {
    try {
      const details = await fetchPlaceDetails(placeId);
      onChange({
        placeId: details.placeId,
        name: details.name || fallbackDescription,
        address: details.address || fallbackDescription,
        lat: details.lat,
        lng: details.lng,
      });
      setQuery(details.name || fallbackDescription, true);
    } catch {
      onChange({
        ...EMPTY_SCHOOL_VALUE,
        name: fallbackDescription,
        address: fallbackDescription,
      });
      setQuery(fallbackDescription, true);
    } finally {
      clearSuggestions();
      resetSession();
      setOpen(false);
    }
  }

  function handleClear() {
    onChange(EMPTY_SCHOOL_VALUE);
    setQuery("", true);
    clearSuggestions();
    resetSession();
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
      {open && status === "OK" && suggestions.length > 0 ? (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 text-sm shadow-md">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left hover:bg-accent",
                )}
                onClick={() => handleSelect(s.placeId, s.description)}
              >
                <span className="font-medium">{s.mainText}</span>
                <span className="text-xs text-muted-foreground">
                  {s.secondaryText}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
