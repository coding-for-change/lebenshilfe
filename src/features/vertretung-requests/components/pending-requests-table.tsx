"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  resolveVertretungRequestAction,
  rejectVertretungRequestAction,
} from "../actions";

type ChildOption = { id: string; firstName: string; lastName: string };

type Request = {
  id: string;
  childNameText: string;
  date: string;
  startTime: string;
  endTime: string;
  substituteUser: { id: string; name: string; email: string };
};

type Props = {
  requests: Request[];
  childOptions: ChildOption[];
};

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
        await resolveVertretungRequestAction(request.id, {
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
        await rejectVertretungRequestAction(request.id);
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
      <TableCell className="min-w-48">
        <Select
          value={selectedChildId}
          onValueChange={setSelectedChildId}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Kind wählen…" />
          </SelectTrigger>
          <SelectContent>
            {childOptions.map((c) => (
              <SelectItem
                key={c.id}
                value={c.id}
              >
                {c.firstName} {c.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

export function PendingRequestsTable({ requests, childOptions }: Props) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Keine offenen Vertretungs-Anträge.
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
