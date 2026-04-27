import { Crown, Shield, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminRoleVariant = "OWNER" | "ADMIN" | "PENDING";

const STYLES: Record<AdminRoleVariant, string> = {
  OWNER: "bg-violet-100 text-violet-800 ring-violet-200",
  ADMIN: "bg-blue-100 text-blue-800 ring-blue-200",
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
};

const LABELS: Record<AdminRoleVariant, string> = {
  OWNER: "Hauptadmin",
  ADMIN: "Admin",
  PENDING: "Eingeladen",
};

const ICONS: Record<
  AdminRoleVariant,
  React.ComponentType<{ className?: string }>
> = {
  OWNER: Crown,
  ADMIN: Shield,
  PENDING: Mail,
};

export function RoleBadge({ variant }: { variant: AdminRoleVariant }) {
  const Icon = ICONS[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[variant],
      )}
    >
      <Icon className="size-3" />
      {LABELS[variant]}
    </span>
  );
}
