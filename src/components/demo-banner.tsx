import { branding } from "@/lib/branding";

// Says plainly that this is not a live system. Someone who lands on the demo
// sees Kinder, Diagnosen and Stundennachweise on screen; the one thing they must
// not do is wonder whether any of it belongs to a real child.
export function DemoBanner() {
  if (!branding.isDemo) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100"
    >
      <span className="font-semibold">Demo-Umgebung</span>
      <span className="text-amber-800 dark:text-amber-200/80">
        Alle Kinder, Schulen und Einträge sind frei erfunden. Daten werden
        regelmäßig zurückgesetzt.
      </span>
    </div>
  );
}
