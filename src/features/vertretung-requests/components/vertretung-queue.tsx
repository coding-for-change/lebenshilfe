"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronsUpDown, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  confirmVertretungRequestAction,
  rejectVertretungRequestAction,
} from "../actions";
import type { SerializedVertretungRequest } from "../serialize";

export type QueueChildOption = {
  id: string;
  firstName: string;
  lastName: string;
};

type Props = {
  requests: SerializedVertretungRequest[];
  /** Full roster — admin-only; never exposed to the reporting companion. */
  childOptions: QueueChildOption[];
};

function formatGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/**
 * Admin resolution queue ("Zuzuordnen") for Schulbegleiter-reported
 * Vertretungen with a free-text child name (COD-51). Self-contained: pass the
 * pending `requests` and the `childOptions` roster as props so it can be mounted
 * directly into COD-50's "Handlungsbedarf" tab.
 */
export function VertretungQueue({ requests, childOptions }: Props) {
  if (requests.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
        Keine offenen Vertretungs-Meldungen.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <QueueRow
          key={request.id}
          request={request}
          childOptions={childOptions}
        />
      ))}
    </ul>
  );
}

function QueueRow({
  request,
  childOptions,
}: {
  request: SerializedVertretungRequest;
  childOptions: QueueChildOption[];
}) {
  const router = useRouter();
  const [childId, setChildId] = useState<string | null>(
    request.suggestedChildId,
  );
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const matchPercent =
    request.matchScore != null ? Math.round(request.matchScore * 100) : null;

  async function handleConfirm() {
    if (!childId) {
      toast.error("Bitte zuerst ein Kind auswählen.");
      return;
    }
    setBusy(true);
    try {
      await confirmVertretungRequestAction({
        requestId: request.id,
        childId,
      });
      toast.success("Vertretung zugeordnet und Eintrag erstellt.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Zuordnen fehlgeschlagen.",
      );
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    try {
      await rejectVertretungRequestAction({
        requestId: request.id,
        reason: reason.trim() || undefined,
      });
      toast.success("Meldung abgelehnt.");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ablehnen fehlgeschlagen.",
      );
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 shrink-0 text-amber-600" />
            <span className="truncate text-sm font-semibold">
              „{request.childNameText}“
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gemeldet von {request.reportedByUserName} ·{" "}
            {formatGermanDate(request.date)} · {request.startTime}–
            {request.endTime}
          </p>
          {request.note ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Notiz: {request.note}
            </p>
          ) : null}
        </div>
        {request.suggestedChildName ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Vorschlag: {request.suggestedChildName}
            {matchPercent != null ? ` · ${matchPercent}%` : ""}
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Kein eindeutiger Treffer
          </span>
        )}
      </div>

      {rejecting ? (
        <div className="mt-3 space-y-2">
          <Label
            htmlFor={`reason-${request.id}`}
            className="text-xs text-muted-foreground"
          >
            Grund (optional)
          </Label>
          <Textarea
            id={`reason-${request.id}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="z.B. kein passendes Kind im Bestand"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRejecting(false)}
              disabled={busy}
            >
              Zurück
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={busy}
            >
              {busy ? "…" : "Ablehnen bestätigen"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Kind</Label>
            <ChildCombobox
              options={childOptions}
              value={childId}
              onChange={setChildId}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejecting(true)}
              disabled={busy}
            >
              Ablehnen
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={busy || !childId}
            >
              {busy ? "Speichert…" : "Bestätigen"}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function ChildCombobox({
  options,
  value,
  onChange,
}: {
  options: QueueChildOption[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

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
          className="h-9 w-full justify-between font-normal"
          disabled={options.length === 0}
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected
              ? `${selected.firstName} ${selected.lastName}`
              : "Kind auswählen…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Kind suchen…" />
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.firstName} ${o.lastName}`}
                  onSelect={() => {
                    onChange(o.id === value ? null : o.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === o.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {o.firstName} {o.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
