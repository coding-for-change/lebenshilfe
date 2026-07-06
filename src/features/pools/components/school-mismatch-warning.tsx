import { TriangleAlert } from "lucide-react";

export function SchoolMismatchWarning({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        {names.length === 1
          ? `${names[0]} gehört zu einer anderen Schule als der Pool.`
          : `${names.length} Kinder gehören zu einer anderen Schule als der Pool: ${names.join(", ")}.`}
      </p>
    </div>
  );
}
