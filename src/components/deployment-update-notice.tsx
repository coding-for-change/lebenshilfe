"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isServerActionNotFoundError } from "@/lib/deployment-skew";

/**
 * Mounted once in the root layout. When a Server Action fails because the tab
 * was built by a previous deployment (see lib/deployment-skew), we show a
 * persistent banner asking the user to reload, rather than reloading for them.
 *
 * Why a prompt and not an automatic reload: on this path the error surfaces as
 * an unhandled rejection from an event handler (e.g. a form submit), so the
 * form is still mounted and holds the user's input. Reloading automatically
 * would discard that input. The banner lets the user finish or copy their work
 * and reload when ready. The error-boundary case (app/error.tsx), where the
 * form has already been unmounted and there is nothing left to lose, reloads
 * automatically instead.
 */
export function DeploymentUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    function handle(error: unknown) {
      if (isServerActionNotFoundError(error)) setUpdateAvailable(true);
    }
    function onRejection(event: PromiseRejectionEvent) {
      handle(event.reason);
    }
    function onError(event: ErrorEvent) {
      handle(event.error);
    }
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
    >
      <div className="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RefreshCw className="size-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium">Eine neue Version ist verfügbar</p>
            <p className="text-muted-foreground">
              Bitte laden Sie die Seite neu, um fortzufahren. Ungespeicherte
              Eingaben in Formularen gehen dabei verloren.
            </p>
          </div>
        </div>
        <Button
          onClick={() => window.location.reload()}
          className="shrink-0"
        >
          Neu laden
        </Button>
      </div>
    </div>
  );
}
