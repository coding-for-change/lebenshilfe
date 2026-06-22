"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS, isNavActive } from "./nav-items";
import { cn } from "@/lib/utils";

/**
 * Route-based bottom navigation for phones. Unlike the timesheet's in-memory
 * tab bar, this drives real navigation (so admin stays deep-linkable) and is
 * hidden from `md` up, where the inset sidebar takes over. Account/logout live
 * in the sidebar drawer's `NavUser` menu, not here.
 */
export function AdminBottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {ALL_NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] leading-none transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="max-w-full truncate">
                  {shortLabel ?? label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
