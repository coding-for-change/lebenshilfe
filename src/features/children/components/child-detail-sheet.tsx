"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabGeneral } from "./tabs/tab-general";
import { TabHistory } from "./tabs/tab-history";
import { TabCalendar } from "./tabs/tab-calendar";
import type { CostBearerOption } from "@/features/cost-bearers";
import type { SerializedChild } from "../serialize";

export type DetailTab = "general" | "history" | "calendar";

type Props = {
  child: SerializedChild | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab?: DetailTab;
  onTabChange?: (next: DetailTab) => void;
  costBearerOptions: CostBearerOption[];
  schoolAssistantOptions: { id: string; name: string }[];
  onCostBearerCreated: (created: CostBearerOption) => void;
};

export function ChildDetailSheet({
  child,
  open,
  onOpenChange,
  tab,
  onTabChange,
  costBearerOptions,
  schoolAssistantOptions,
  onCostBearerCreated,
}: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className={[
          // Floating: nudge in from every edge, round all corners, full border + extra shadow.
          "inset-y-3 right-3 h-auto rounded-2xl border shadow-2xl",
          "flex w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
        ].join(" ")}
      >
        {child ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle>
                {child.firstName} {child.lastName}
              </SheetTitle>
              <SheetDescription>
                {child.schoolName ?? "Keine Schule hinterlegt"}
                {child.costBearer?.name ? ` · ${child.costBearer.name}` : ""}
              </SheetDescription>
            </SheetHeader>

            <Tabs
              value={tab ?? "general"}
              onValueChange={(v) => onTabChange?.(v as DetailTab)}
              className="flex flex-1 flex-col gap-3 overflow-hidden p-4"
            >
              <TabsList>
                <TabsTrigger value="general">Allgemeines</TabsTrigger>
                <TabsTrigger value="history">Historie</TabsTrigger>
                <TabsTrigger value="calendar">Kalender</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-1">
                <TabsContent value="general">
                  <TabGeneral
                    key={child.id}
                    child={child}
                    costBearerOptions={costBearerOptions}
                    onCostBearerCreated={onCostBearerCreated}
                  />
                </TabsContent>
                <TabsContent value="history">
                  <TabHistory child={child} />
                </TabsContent>
                <TabsContent value="calendar">
                  <TabCalendar
                    child={child}
                    schoolAssistantOptions={schoolAssistantOptions}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
