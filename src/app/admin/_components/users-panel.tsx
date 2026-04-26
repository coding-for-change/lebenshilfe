"use client";

import { useState } from "react";
import { Role } from "@/generated/prisma";
import { inviteMemberUseCase } from "@/use-cases/invite-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageSection } from "@/components/page-section";

type UserItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export function UsersPanel({ users }: { users: UserItem[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.SCHOOL_ASSISTANT);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleInvite(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      await inviteMemberUseCase(email, role);
      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setEmail("");
        setRole(Role.SCHOOL_ASSISTANT);
      }, 2000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Fehler beim Einladen.",
      );
    }
  }

  return (
    <PageSection
      title="Schulbegleiter Liste"
      action={
        <Dialog
          open={open}
          onOpenChange={setOpen}
        >
          <DialogTrigger asChild>
            <Button>+ Mitglied einladen</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Mitglied einladen</DialogTitle>
            </DialogHeader>
            {status === "success" ? (
              <div className="rounded-md bg-green-50 p-4 text-center text-green-700">
                Einladung erfolgreich gesendet!
              </div>
            ) : (
              <form
                onSubmit={handleInvite}
                className="space-y-4 py-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-Mail</label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.de"
                    disabled={status === "loading"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rolle</label>
                  <Select
                    value={role}
                    onValueChange={(v: string) => setRole(v as Role)}
                    disabled={status === "loading"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.SCHOOL_ASSISTANT}>
                        Schulbegleiter
                      </SelectItem>
                      <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {status === "error" && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading"
                    ? "Wird gesendet..."
                    : "Einladung senden"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      }
    >
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Erstellt am</TableHead>
            <TableHead className="text-right">Aktion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="py-6 text-center text-muted-foreground"
              >
                Keine Schulbegleiter gefunden.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  {new Date(u.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Entfernen
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PageSection>
  );
}
