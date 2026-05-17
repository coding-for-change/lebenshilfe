import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ALL_NAV_ITEMS } from "./_components/nav-items";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-6 py-6 shadow-sm sm:px-8 sm:py-8">
        <h1 className="text-xl font-semibold sm:text-2xl">
          Willkommen im Verwaltungsbereich.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle einen Bereich, um zu beginnen.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-4 rounded-xl border bg-card px-4 py-4 shadow-sm transition-all hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98] active:brightness-95"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
