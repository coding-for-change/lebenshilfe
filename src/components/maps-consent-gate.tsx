"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMapsConsent } from "@/lib/maps/maps-consent";

const DEFAULT_DESCRIPTION =
  "Zum Anzeigen der Karte wird Google Maps geladen. Dabei werden Daten (u. a. Adresse und Ihre IP-Adresse) an Google in die USA übermittelt.";

// Renders its children only after the user has consented to Google Maps.
// Until then it shows a click-to-load placeholder (TDDDG §25). Because it does
// not mount its children before consent, no Google request is triggered.
export function MapsConsentGate({
  children,
  description,
  className,
  compact = false,
}: {
  children: React.ReactNode;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  const { consent, grant } = useMapsConsent();

  if (consent) return <>{children}</>;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border bg-muted/30 text-center",
        compact ? "h-48 p-4" : "h-full w-full p-6",
        className,
      )}
    >
      <MapPin className="size-6 text-muted-foreground" />
      <p className="max-w-sm text-xs text-muted-foreground">
        {description ?? DEFAULT_DESCRIPTION} Mehr in der{" "}
        <Link
          href="/datenschutz"
          className="underline underline-offset-2"
        >
          Datenschutzerklärung
        </Link>
        .
      </p>
      <Button
        type="button"
        size="sm"
        onClick={grant}
      >
        Karte laden
      </Button>
    </div>
  );
}
