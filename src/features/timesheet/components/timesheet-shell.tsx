"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock,
  LifeBuoy,
  Send,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NavUser } from "@/components/nav-user";
import { BottomTabBar, type TabId } from "./bottom-tab-bar";
import { NewEntrySheet } from "./new-entry-sheet";
import { TabDay } from "./tab-day";
import { TabWoche } from "./tab-woche";
import { TabMonat } from "./tab-monat";
import { SettingsDialog } from "./settings-dialog";
import { startOfDayUtc } from "@/lib/dates";
import type { ChildOption } from "./children-filter";
import type { ChildAbsence, Event, Schedule } from "@/generated/prisma";
import type { AssignmentsByWeekday } from "../weekday";

type EventWithChild = Event & {
  child: { firstName: string; lastName: string } | null;
};

// Date-Spalte ist `@db.Date`; serialisiert als YYYY-MM-DD über die RSC-Grenze.
export type ChildAbsenceItem = Pick<ChildAbsence, "childId" | "note"> & {
  date: string;
};

type Props = {
  currentUser: { id: string; name: string; email: string };
  assignedChildren: ChildOption[];
  events: EventWithChild[];
  schedules: Schedule[];
  lockedMonthKeys: string[];
  childAbsences: ChildAbsenceItem[];
  assignmentsByWeekday: AssignmentsByWeekday;
};

const NAV_ITEMS: Array<{
  id: Exclude<TabId, "mehr">;
  label: string;
  Icon: typeof Clock;
}> = [
  { id: "tag", label: "Tag", Icon: Clock },
  { id: "woche", label: "Woche", Icon: CalendarDays },
  { id: "monat", label: "Lehrer Ansicht", Icon: CalendarRange },
];

function greet(name: string): string {
  const h = new Date().getHours();
  const firstName = name.split(" ")[0] || name;
  if (h < 5) return `Gute Nacht, ${firstName}`;
  if (h < 11) return `Guten Morgen, ${firstName}`;
  if (h < 14) return `Hallo, ${firstName}`;
  if (h < 18) return `Guten Nachmittag, ${firstName}`;
  return `Guten Abend, ${firstName}`;
}

export function SchoolAssistantApp({
  currentUser,
  assignedChildren,
  events,
  schedules,
  lockedMonthKeys,
  childAbsences,
  assignmentsByWeekday,
}: Props) {
  const today = useMemo(() => startOfDayUtc(new Date()), []);
  const [activeTab, setActiveTab] = useState<Exclude<TabId, "mehr">>("tag");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthViewDate, setMonthViewDate] = useState(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
  );
  const [weekAnchor, setWeekAnchor] = useState(today);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    assignedChildren.map((c) => c.id),
  );
  const [newEntryOpen, setNewEntryOpen] = useState(false);

  const lockedMonths = useMemo(
    () => new Set(lockedMonthKeys),
    [lockedMonthKeys],
  );

  const openNewEntry = () => setNewEntryOpen(true);

  const jumpToDay = (d: Date) => {
    setSelectedDate(d);
    setActiveTab("tag");
  };

  const handleTabChange = (id: TabId) => {
    if (id === "mehr") {
      setSettingsOpen(true);
      return;
    }
    setActiveTab(id);
  };

  const lastWorkEntry = useMemo(() => {
    const work = events.filter(
      (e) => e.type === "WORK" && e.startTime && e.endTime,
    );
    if (work.length === 0) return null;
    const sorted = [...work].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
    return sorted[0];
  }, [events]);

  const greeting = useMemo(() => greet(currentUser.name), [currentUser.name]);

  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab);

  const tabContent = (() => {
    switch (activeTab) {
      case "tag":
        return (
          <TabDay
            selectedDate={selectedDate}
            today={today}
            onSelectDate={setSelectedDate}
            onRequestNewEntry={openNewEntry}
            events={events}
            lockedMonths={lockedMonths}
            assignedChildren={assignedChildren}
            childAbsences={childAbsences}
            schedules={schedules}
          />
        );
      case "woche":
        return (
          <TabWoche
            anchorDate={weekAnchor}
            onAnchorDateChange={setWeekAnchor}
            today={today}
            onSelectDay={jumpToDay}
            onRequestNewEntry={openNewEntry}
            assignedChildren={assignedChildren}
            selectedChildIds={selectedChildIds}
            onSelectedChildIdsChange={setSelectedChildIds}
            events={events}
            schedules={schedules}
          />
        );
      case "monat":
        return (
          <TabMonat
            viewDate={monthViewDate}
            today={today}
            selectedDate={selectedDate}
            onViewDateChange={setMonthViewDate}
            onSelectDay={jumpToDay}
            events={events}
            lockedMonths={lockedMonths}
          />
        );
    }
  })();

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-20 hidden bg-cover bg-center sm:block"
        style={{ backgroundImage: "url('/login.webp')" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 hidden bg-white/40 backdrop-blur-[2px] sm:block"
      />
      <SidebarProvider
        defaultOpen
        className="sm:bg-transparent! sm:[&_[data-slot=sidebar-inner]]:rounded-xl sm:[&_[data-slot=sidebar-inner]]:bg-sidebar/60 sm:[&_[data-slot=sidebar-inner]]:shadow-sm"
      >
        <Sidebar
          variant="inset"
          collapsible="icon"
        >
          <SidebarHeader>
            <div className="flex items-center justify-center px-2 py-3 group-data-[collapsible=icon]:p-0">
              <Image
                src="/lebenshilfe-muenchen-logo_2026.svg"
                alt="Lebenshilfe München"
                width={160}
                height={160}
                priority
                className="h-20 w-auto object-contain transition-all group-data-[collapsible=icon]:h-8"
              />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Übersicht</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map(({ id, label, Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        tooltip={label}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Konto</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setSettingsOpen(true)}
                      tooltip="Einstellungen"
                    >
                      <Settings />
                      <span>Einstellungen</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Support"
                    >
                      <a
                        href="mailto:support@lebenshilfe-muenchen.de"
                        className="text-muted-foreground"
                      >
                        <LifeBuoy />
                        <span>Support</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Feedback"
                    >
                      <a
                        href="mailto:feedback@lebenshilfe-muenchen.de"
                        className="text-muted-foreground"
                      >
                        <Send />
                        <span>Feedback</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              user={currentUser}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="hidden h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-border bg-background/60 px-4 backdrop-blur sm:flex">
            <SidebarTrigger className="-ml-1" />
            <SidebarSeparator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <nav
              aria-label="Pfad"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <span>Zeiterfassung</span>
              <ChevronRight className="size-3.5 opacity-60" />
              <span className="font-medium text-foreground">
                {activeNav?.label ?? "Tag"}
              </span>
            </nav>
          </header>
          <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28 sm:pb-10">
            <div className="mb-4 sm:hidden">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Zeiterfassung
              </p>
              <p className="text-lg font-semibold">
                <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">
                  {greeting}
                </span>
              </p>
            </div>
            {tabContent}
          </div>
        </SidebarInset>

        <BottomTabBar
          active={activeTab}
          onChange={handleTabChange}
        />

        <NewEntrySheet
          open={newEntryOpen}
          onOpenChange={setNewEntryOpen}
          defaultDate={selectedDate}
          assignedChildren={assignedChildren}
          assignmentsByWeekday={assignmentsByWeekday}
          currentUserName={currentUser.name}
          schedules={schedules}
          lastEntry={
            lastWorkEntry
              ? {
                  startTime: lastWorkEntry.startTime ?? null,
                  endTime: lastWorkEntry.endTime ?? null,
                }
              : null
          }
        />

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          name={currentUser.name}
          email={currentUser.email}
        />

        <Toaster
          position="bottom-right"
          richColors
        />
      </SidebarProvider>
    </>
  );
}
