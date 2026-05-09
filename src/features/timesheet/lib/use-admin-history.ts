"use client";

import { useCallback, useEffect, useState } from "react";
import type { SerializedAdminHistory } from "../actions";

export type AdminHistoryState =
  | { status: "idle" }
  | { status: "loading"; id: string }
  | { status: "loaded"; id: string; data: SerializedAdminHistory }
  | { status: "error"; id: string; message: string };

type AsyncResult =
  | { status: "loaded"; id: string; data: SerializedAdminHistory }
  | { status: "error"; id: string; message: string };

// `fetcher` must have a stable identity (e.g. a top-level imported server
// action). It's a dep of the load effect, so an inline arrow would refetch on
// every render.
export function useAdminHistory(
  id: string | null,
  fetcher: (id: string) => Promise<SerializedAdminHistory>,
): { state: AdminHistoryState; refetch: () => void } {
  const [result, setResult] = useState<AsyncResult | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetcher(id)
      .then((data) => {
        if (!cancelled) setResult({ status: "loaded", id, data });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          status: "error",
          id,
          message: err instanceof Error ? err.message : "Laden fehlgeschlagen.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, nonce, fetcher]);

  const state: AdminHistoryState = !id
    ? { status: "idle" }
    : result && result.id === id
      ? result
      : { status: "loading", id };

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { state, refetch };
}
