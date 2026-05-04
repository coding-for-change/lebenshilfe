"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/maps/maps-loader";
import { usePlaceSuggestions } from "@/lib/maps/places-api";

type Props = {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  placeholder?: string;
  ariaInvalid?: boolean;
};

export function AddressAutocomplete({
  value,
  onChange,
  id,
  placeholder,
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

  // Gracefully degrade to a plain text input if Maps is unavailable.
  if (error || !ready) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          error ? "Adresse manuell eingeben…" : (placeholder ?? "Adresse…")
        }
        aria-invalid={ariaInvalid}
      />
    );
  }

  return (
    <ReadyAutocomplete
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      ariaInvalid={ariaInvalid}
    />
  );
}

function ReadyAutocomplete({
  value,
  onChange,
  id,
  placeholder,
  ariaInvalid,
}: Props) {
  const {
    query,
    setQuery,
    suggestions,
    status,
    clearSuggestions,
    resetSession,
  } = usePlaceSuggestions({
    ready: true,
    includedPrimaryTypes: ["address"],
    debounceMs: 250,
  });

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== query) setQuery(value, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(description: string) {
    onChange(description);
    setQuery(description, true);
    clearSuggestions();
    resetSession();
    setOpen(false);
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
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Straße, PLZ Ort"}
          aria-invalid={ariaInvalid}
          className="pl-9"
        />
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
                onClick={() => handleSelect(s.description)}
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
