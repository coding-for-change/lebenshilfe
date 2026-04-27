"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabAllgemeines } from "./tabs/tab-allgemeines";
import { TabHistorie } from "./tabs/tab-historie";
import { TabKalender } from "./tabs/tab-kalender";
import type { KostentraegerOption } from "./kostentraeger-combobox";
import type { SerializedChild } from "./serialize";

type Props = {
  child: SerializedChild | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kostentraegerOptions: KostentraegerOption[];
  schulbegleiterOptions: { id: string; name: string }[];
  onKostentraegerCreated: (created: KostentraegerOption) => void;
};

export function KindDetailSheet({
  child,
  open,
  onOpenChange,
  kostentraegerOptions,
  schulbegleiterOptions,
  onKostentraegerCreated,
}: Props) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        {child ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle>
                {child.firstName} {child.lastName}
              </SheetTitle>
              <SheetDescription>
                {child.schoolName ?? "Keine Schule hinterlegt"}
                {child.kostentraeger?.name
                  ? ` · ${child.kostentraeger.name}`
                  : ""}
              </SheetDescription>
            </SheetHeader>

            <Tabs
              defaultValue="allgemeines"
              className="flex flex-1 flex-col gap-3 overflow-hidden p-4"
            >
              <TabsList>
                <TabsTrigger value="allgemeines">Allgemeines</TabsTrigger>
                <TabsTrigger value="historie">Historie</TabsTrigger>
                <TabsTrigger value="kalender">Kalender</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto pr-1">
                <TabsContent value="allgemeines">
                  <TabAllgemeines
                    child={child}
                    kostentraegerOptions={kostentraegerOptions}
                    onKostentraegerCreated={onKostentraegerCreated}
                  />
                </TabsContent>
                <TabsContent value="historie">
                  <TabHistorie child={child} />
                </TabsContent>
                <TabsContent value="kalender">
                  <TabKalender
                    child={child}
                    schulbegleiterOptions={schulbegleiterOptions}
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
