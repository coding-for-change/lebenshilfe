"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isServerActionNotFoundError } from "@/lib/deployment-skew";

// Response header Next sets when a Server Action ID no longer exists on the
// server (i.e. the tab was built by a previous deployment).
const ACTION_NOT_FOUND_HEADER = "x-nextjs-action-not-found";

/**
 * Prompts a reload when a Server Action fails because the tab is from an older
 * deployment. Detection wraps fetch to read the response header rather than
 * relying on thrown errors, which call sites usually catch and swallow. We
 * prompt instead of reloading so in-progress form input isn't lost.
 */
export function DeploymentUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const nativeFetch = window.fetch;
    const wrappedFetch: typeof window.fetch = async (...args) => {
      const response = await nativeFetch.apply(window, args);
      try {
        if (response.headers.get(ACTION_NOT_FOUND_HEADER) === "1") {
          setUpdateAvailable(true);
        }
      } catch {
        // Detection must never break the request.
      }
      return response;
    };
    window.fetch = wrappedFetch;

    // Backup for the call sites that re-throw instead of catching.
    function onRejection(event: PromiseRejectionEvent) {
      if (isServerActionNotFoundError(event.reason)) setUpdateAvailable(true);
    }
    function onError(event: ErrorEvent) {
      if (isServerActionNotFoundError(event.error)) setUpdateAvailable(true);
    }
    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);

    return () => {
      if (window.fetch === wrappedFetch) window.fetch = nativeFetch;
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
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
          size="lg"
          className="w-full shrink-0 sm:w-auto"
        >
          Neu laden
        </Button>
      </div>
    </div>
  );
}
