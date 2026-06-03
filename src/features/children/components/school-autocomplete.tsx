"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { loadMapsLibrary } from "@/lib/maps/maps-loader";
import { fetchPlaceDetails, usePlaceSuggestions } from "@/lib/maps/places-api";
import type { SchoolValue } from "../schemas";

export type { SchoolValue };

const EMPTY: SchoolValue = {
  placeId: null,
  name: null,
  address: null,
  lat: null,
  lng: null,
};

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const anchorRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // Render the list inside the enclosing dialog/sheet rather than document.body.
  // That escapes the modal's inner overflow clipping while staying within its
  // scroll-lock subtree, so mouse-wheel and touch scrolling keep working.
  useEffect(() => {
    setPortalContainer(
      anchorRef.current?.closest<HTMLElement>(
        '[data-slot="dialog-content"],[data-slot="sheet-content"]',
      ) ?? null,
    );
  }, []);

  useEffect(() => {
    if (value.name && !query) setQuery(value.name, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.name]);

  // A fresh fetch invalidates the previous keyboard highlight.
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // The list only opens once the user is looking at it AND there are results,
  // so an empty popover never flashes over the field.
  const showList = open && status === "OK" && suggestions.length > 0;

  // Keep the keyboard-highlighted option within the scroll viewport.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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
        ...EMPTY,
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
    onChange(EMPTY);
    setQuery("", true);
    clearSuggestions();
    resetSession();
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Re-open a closed-but-populated list on the first ArrowDown.
    if (!showList) {
      if (e.key === "ArrowDown" && status === "OK" && suggestions.length > 0) {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          const s = suggestions[activeIndex];
          void handleSelect(s.placeId, s.description);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  return (
    <Popover
      open={showList}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className="relative"
        >
          <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
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
      </PopoverAnchor>
      {/* Portal lets the list escape the wizard dialog's stacking/overflow.
          Focus stays in the input so typing keeps driving the search. */}
      <PopoverContent
        container={portalContainer ?? undefined}
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking back into the field must not dismiss the list.
          if (
            e.target instanceof Node &&
            anchorRef.current?.contains(e.target)
          ) {
            e.preventDefault();
          }
        }}
        className="max-h-60 w-[--radix-popover-trigger-width] overflow-y-auto p-1"
      >
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              data-index={i}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left hover:bg-accent",
                  i === activeIndex && "bg-accent",
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
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
      </PopoverContent>
    </Popover>
  );
}
