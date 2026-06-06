"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  placeId: string | null;
  address: string | null;
};

export function SchoolPreview({ placeId, address }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [openMobile, setOpenMobile] = useState(false);

  if (!placeId && !address) return null;

  if (!apiKey) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Karte ausgeblendet (Google Maps API Key nicht konfiguriert).
      </div>
    );
  }

  const src = placeId
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        address ?? "",
      )}`;

  return (
    <div className="overflow-hidden rounded-md border">
      {/* On phones the 192px map eats half the viewport inside a form step,
          so it is collapsed behind a toggle. Always shown from md up. */}
      <button
        type="button"
        onClick={() => setOpenMobile((o) => !o)}
        aria-expanded={openMobile}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-muted-foreground md:hidden"
      >
        <span>Karte {openMobile ? "ausblenden" : "anzeigen"}</span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            openMobile && "rotate-180",
          )}
        />
      </button>
      <iframe
        title="Schule auf Google Maps"
        src={src}
        className={cn("h-48 w-full md:block", openMobile ? "block" : "hidden")}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
