"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { CalendarDays, CalendarRange, Clock, Menu } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { BottomTabBar, type TabId } from "./bottom-tab-bar";
import { NewEntrySheet } from "./new-entry-sheet";
import { TabTag } from "./tab-tag";
import { TabWoche } from "./tab-woche";
import { TabMonat } from "./tab-monat";
import { TabMehr } from "./tab-mehr";
import { startOfDayUtc } from "./date-utils";
import type { ChildOption } from "./children-filter";
import type { Event, Schedule } from "@/generated/prisma";

type EventWithChild = Event & {
  child: { firstName: string; lastName: string } | null;
};

type Props = {
  currentUser: { id: string; name: string; email: string };
  assignedChildren: ChildOption[];
  events: EventWithChild[];
  schedules: Schedule[];
  lockedMonthKeys: string[];
};

const NAV_ITEMS: Array<{ id: TabId; label: string; Icon: typeof Clock }> = [
  { id: "tag", label: "Tag", Icon: Clock },
  { id: "woche", label: "Woche", Icon: CalendarDays },
  { id: "monat", label: "Monat", Icon: CalendarRange },
  { id: "mehr", label: "Mehr", Icon: Menu },
];

export function SchulbegleiterApp({
  currentUser,
  assignedChildren,
  events,
  schedules,
  lockedMonthKeys,
}: Props) {
  const today = useMemo(() => startOfDayUtc(new Date()), []);
  const [activeTab, setActiveTab] = useState<TabId>("tag");
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthViewDate, setMonthViewDate] = useState(
    new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    ),
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

  const tabContent = (() => {
    switch (activeTab) {
      case "tag":
        return (
          <TabTag
            selectedDate={selectedDate}
            today={today}
            onSelectDate={setSelectedDate}
            onRequestNewEntry={openNewEntry}
            events={events}
            lockedMonths={lockedMonths}
            assignedChildren={assignedChildren}
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
      case "mehr":
        return <TabMehr name={currentUser.name} email={currentUser.email} />;
    }
  })();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="hidden sm:flex">
        <SidebarHeader className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative size-10 shrink-0">
              <Image
                src="/lebenshilfe-muenchen-logo_2026.svg"
                alt="Lebenshilfe München Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-tight">
                Lebenshilfe
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Zeiterfassung
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
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
        </SidebarContent>
        <SidebarFooter className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p className="truncate">{currentUser.name}</p>
          <p className="truncate">{currentUser.email}</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28 sm:pb-10">
          {/* Mobile header with logo */}
          <div className="mb-4 flex items-center gap-2 sm:hidden">
            <div className="relative size-8">
              <Image
                src="/lebenshilfe-muenchen-logo_2026.svg"
                alt="Lebenshilfe München Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm font-semibold">Lebenshilfe Zeiterfassung</p>
          </div>
          {tabContent}
        </div>
      </SidebarInset>

      <BottomTabBar active={activeTab} onChange={setActiveTab} />

      <NewEntrySheet
        open={newEntryOpen}
        onOpenChange={setNewEntryOpen}
        defaultDate={selectedDate}
        assignedChildren={assignedChildren}
        currentUserName={currentUser.name}
      />

      <Toaster position="top-center" richColors />
    </SidebarProvider>
  );
}
