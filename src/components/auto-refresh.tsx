"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-pulls the current route's server-rendered content so users see changes
// admins made without a manual refresh.
//
// This matters most for the iOS home-screen (standalone) app: it has no reload
// UI, and iOS *freezes* its page when backgrounded — so returning to it would
// otherwise show whatever was on screen when the user left, indefinitely. We
// use `router.refresh()` (not a full reload) so client state — open sheets,
// form inputs, scroll position — is preserved while the server data updates.
//
// Renders nothing; mounted once in the root layout so it covers every route.

// How often to re-fetch while the app is open and in the foreground.
const POLL_INTERVAL_MS = 60_000;

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let lastRefresh = Date.now();

    const refresh = () => {
      lastRefresh = Date.now();
      router.refresh();
    };

    // User returned to the app (tab re-focus, app switch, device unlock).
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    // Page restored from the back/forward (bfcache): its JS was frozen, so the
    // DOM is stale until we re-fetch.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };

    // Poll only while visible — timers are suspended in the background anyway,
    // and this spares the server when nobody is looking. The elapsed-time guard
    // avoids a redundant fetch right after a resume-triggered refresh.
    const poll = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh >= POLL_INTERVAL_MS
      ) {
        refresh();
      }
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
