"use client";

import {
  CalendarDays,
  CalendarRange,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "tag" | "woche" | "monat" | "mehr";

const TABS: Array<{ id: TabId; label: string; Icon: typeof Clock }> = [
  { id: "tag", label: "Tag", Icon: Clock },
  { id: "woche", label: "Woche", Icon: CalendarDays },
  { id: "monat", label: "Lehrer", Icon: CalendarRange },
  { id: "mehr", label: "Einstellungen", Icon: Settings },
];

type Props = {
  active: TabId;
  onChange: (tab: TabId) => void;
};

export function BottomTabBar({ active, onChange }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2.5 text-xs",
                active === id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-5" />
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
