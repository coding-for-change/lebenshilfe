"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  rejectIndirectRequestAction,
  resolveIndirectRequestAction,
} from "../actions";

type ChildOption = { id: string; firstName: string; lastName: string };

type Request = {
  id: string;
  childNameText: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  substituteUser: { id: string; name: string; email: string };
};

type Props = {
  requests: Request[];
  childOptions: ChildOption[];
};

function ChildPicker({
  childOptions,
  value,
  onChange,
  defaultQuery,
}: {
  childOptions: ChildOption[];
  value: string;
  onChange: (id: string) => void;
  defaultQuery: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = childOptions.find((c) => c.id === value);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          size="sm"
          className="h-8 w-full justify-between font-normal"
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? `${selected.firstName} ${selected.lastName}`
              : "Kind wählen…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command defaultValue={defaultQuery}>
          <CommandInput placeholder="Vor- oder Nachname tippen…" />
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>
            <CommandGroup>
              {childOptions.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.firstName} ${c.lastName}`}
                  onSelect={() => {
                    onChange(c.id === value ? "" : c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === c.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {c.firstName} {c.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function RequestRow({
  request,
  childOptions,
}: {
  request: Request;
  childOptions: ChildOption[];
}) {
  const [selectedChildId, setSelectedChildId] = useState("");
  const [pending, startTransition] = useTransition();

  const handleResolve = () => {
    if (!selectedChildId) return;
    startTransition(async () => {
      try {
        await resolveIndirectRequestAction(request.id, {
          childId: selectedChildId,
        });
        toast.success("Zuordnung gespeichert.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Speichern.");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        await rejectIndirectRequestAction(request.id);
        toast.success("Antrag abgelehnt.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Fehler.");
      }
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {request.substituteUser.name}
      </TableCell>
      <TableCell>{request.childNameText}</TableCell>
      <TableCell className="tabular-nums">{request.date}</TableCell>
      <TableCell className="tabular-nums">
        {request.startTime}–{request.endTime}
      </TableCell>
      <TableCell className="max-w-xs text-sm text-muted-foreground">
        {request.note ?? "—"}
      </TableCell>
      <TableCell className="min-w-48">
        <ChildPicker
          childOptions={childOptions}
          value={selectedChildId}
          onChange={setSelectedChildId}
          defaultQuery={request.childNameText}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            size="sm"
            disabled={!selectedChildId || pending}
            onClick={handleResolve}
            className="h-8"
          >
            <Check className="size-3.5" /> Zuordnen
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={handleReject}
            className="h-8 text-destructive hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PendingIndirectRequestsTable({
  requests,
  childOptions,
}: Props) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Keine offenen indirekten Leistungen.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Schulbegleiter</TableHead>
          <TableHead>Eingegebener Name</TableHead>
          <TableHead>Datum</TableHead>
          <TableHead>Zeiten</TableHead>
          <TableHead>Notiz</TableHead>
          <TableHead>Kind zuordnen</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r) => (
          <RequestRow
            key={r.id}
            request={r}
            childOptions={childOptions}
          />
        ))}
      </TableBody>
    </Table>
  );
}
