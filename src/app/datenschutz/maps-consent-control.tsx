"use client";

import { Button } from "@/components/ui/button";
import { useMapsConsent } from "@/lib/maps/maps-consent";

// Lets a signed-in user see and change their Google-Maps consent from the
// privacy page. Consent is stored on the account, so the choice applies on every
// device. Revoking reloads the page to clear any Google script already loaded
// this session.
export function MapsConsentControl() {
  const { consent, authenticated, grant, revoke } = useMapsConsent();

  if (!authenticated) {
    return (
      <div className="mt-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Google Maps kann nach der Anmeldung im Portal aktiviert oder deaktiviert
        werden.
      </div>
    );
  }

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
          onClick={async () => {
            await revoke();
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
