"use client";

import { Button } from "@/components/ui/button";
import { useMapsConsent } from "@/lib/maps/maps-consent";

// Lets the user see and change their Google-Maps consent from the privacy page.
// Revoking reloads the page so any Google script already loaded this session is
// cleared.
export function MapsConsentControl() {
  const { consent, ready, grant, revoke } = useMapsConsent();
  if (!ready) return null;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span>
        Google Maps ist derzeit{" "}
        <strong>{consent ? "aktiviert" : "deaktiviert"}</strong>.
      </span>
      {consent ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            revoke();
            window.location.reload();
          }}
        >
          Einwilligung widerrufen
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={grant}
        >
          Google Maps aktivieren
        </Button>
      )}
    </div>
  );
}
