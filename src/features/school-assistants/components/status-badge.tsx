import { SchulbegleiterStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

const STYLES: Record<SchulbegleiterStatus, string> = {
  INVITATION_PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  ACCEPTED: "bg-green-100 text-green-800 ring-green-200",
};

const LABELS: Record<SchulbegleiterStatus, string> = {
  INVITATION_PENDING: "Eingeladen",
  ACCEPTED: "Angenommen",
};

export function StatusBadge({ status }: { status: SchulbegleiterStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
