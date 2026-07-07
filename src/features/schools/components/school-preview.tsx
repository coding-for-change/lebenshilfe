"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMapsConsent } from "@/lib/maps/maps-consent";

type Props = {
  placeId: string | null;
  address: string | null;
};

export function SchoolPreview({ placeId, address }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [openMobile, setOpenMobile] = useState(false);
  const { consent, grant } = useMapsConsent();

  if (!placeId && !address) return null;

  if (!apiKey) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Karte ausgeblendet (Google Maps API Key nicht konfiguriert).
      </div>
    );
  }

  if (!consent) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-md border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" /> Karte (Google Maps) laden? Dabei
          werden Daten an Google in die USA übermittelt.
        </span>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={grant}
          >
            Karte laden
          </Button>
          <Link
            href="/datenschutz"
            className="underline underline-offset-2"
          >
            Datenschutz
          </Link>
        </div>
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
