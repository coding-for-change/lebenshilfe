import { requireAdmin } from "@/lib/auth-guards";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ALL_NAV_ITEMS } from "./_components/nav-items";

export default async function AdminDashboard() {
  // Every admin page checks access itself. The admin layout's check is not
  // enough: on client navigation Next.js renders only the segments below the
  // shared layout, so a request can reach this page without the layout running.
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-6 py-6 shadow-none sm:px-8 sm:py-8">
        <h1 className="text-xl font-semibold sm:text-2xl">
          Willkommen im Verwaltungsbereich.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle einen Bereich, um zu beginnen.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {ALL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-5 rounded-xl border bg-card px-5 py-5 shadow-none transition-all hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98] active:brightness-95 sm:gap-4 sm:px-4 sm:py-4"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-11">
                  <Icon className="size-6 sm:size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-base font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground sm:text-xs">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:size-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
