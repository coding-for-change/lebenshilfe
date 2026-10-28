import { branding } from "@/lib/branding";

// Says plainly that this is not a live system. Someone who lands on the demo
// sees Kinder, Diagnosen and Stundennachweise on screen; the one thing they must
// not do is wonder whether any of it belongs to a real child.
export function DemoBanner() {
  if (!branding.isDemo) return null;

  return (
    // Sticky, not just first-in-flow: both app shells are `min-h-svh`, so the
    // banner plus the shell is taller than the viewport and the banner scrolls
    // out of sight on exactly the screens people spend their time on. z-50
    // clears the sidebar, which sits below it.
    <div
      role="status"
      className="sticky top-0 z-50 flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      <span className="font-semibold">Demo-Umgebung</span>
      {/* The full sentence wraps to three lines on a phone — a seventh of the
          screen, on the device the Schulbegleitung actually works on. Short
          form there, full wording where there is room for it. */}
      <span className="hidden text-amber-800 sm:inline dark:text-amber-200/80">
        Alle Kinder, Schulen und Einträge sind frei erfunden. Daten werden
        regelmäßig zurückgesetzt.
      </span>
      <span className="text-amber-800 sm:hidden dark:text-amber-200/80">
        Alle Daten sind frei erfunden.
      </span>
    </div>
  );
}
