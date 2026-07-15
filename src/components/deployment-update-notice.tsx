"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isServerActionNotFoundError } from "@/lib/deployment-skew";

// Response header Next sets when a Server Action ID no longer exists on the
// server (i.e. the tab was built by a previous deployment).
const ACTION_NOT_FOUND_HEADER = "x-nextjs-action-not-found";

// Request header present on every Server Action dispatch.
const ACTION_REQUEST_HEADER = "next-action";

// A Server Action POST that returns non-OK after a deploy is version skew: the
// action ID rotated (404) or its encrypted closure args can't be decrypted by
// the new build (500). Either way the tab must reload to get the new build.
function isServerActionRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): boolean {
  try {
    if (input instanceof Request && input.headers.has(ACTION_REQUEST_HEADER)) {
      return true;
    }
  } catch {
    // ignore malformed input
  }
  const headers = init?.headers;
  if (!headers) return false;
  if (headers instanceof Headers) return headers.has(ACTION_REQUEST_HEADER);
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === ACTION_REQUEST_HEADER);
  }
  return Object.keys(headers).some(
    (key) => key.toLowerCase() === ACTION_REQUEST_HEADER,
  );
}

/**
 * Prompts a reload when a Server Action fails because the tab is from an older
 * deployment. Detection wraps fetch to inspect the response (status + header)
 * rather than relying on thrown errors, which call sites usually catch and
 * swallow. We prompt instead of reloading so in-progress form input isn't lost.
 */
export function DeploymentUpdateNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const nativeFetch = window.fetch;
    const wrappedFetch: typeof window.fetch = async (...args) => {
      const response = await nativeFetch.apply(window, args);
      try {
        const notFound = response.headers.get(ACTION_NOT_FOUND_HEADER) === "1";
        const actionFailed =
          !response.ok && isServerActionRequest(args[0], args[1]);
        if (notFound || actionFailed) setUpdateAvailable(true);
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
