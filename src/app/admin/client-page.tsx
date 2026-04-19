"use client";

import { useState } from "react";
import { inviteMemberUseCase } from "@/use-cases/invite-member";
import { Role } from "@/generated/prisma";
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

type UserItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

type InvitationItem = {
  id: string;
  email: string;
  role: string;
  isUsed: boolean;
  createdAt: Date;
};

export function AdminDashboardClient({
  initialUsers,
  invitations,
}: {
  initialUsers: UserItem[];
  invitations: InvitationItem[];
}) {
  const users = initialUsers;
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.SCHOOL_ASSISTANT);
  const [open, setOpen] = useState(false);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Schulbegleiter Liste</h2>
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
              <div className="p-4 bg-green-50 text-green-700 rounded-md text-center">
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
      </div>

      <div className="border rounded-xl overflow-hidden">
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
                  className="text-center py-6 text-muted-foreground"
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      Entfernen
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-12 pt-8">
        <h2 className="text-xl font-medium">Alle Einladungen</h2>
      </div>

      <div className="border rounded-xl overflow-hidden mt-4">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  Noch keine Einladungen verschickt.
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.email}</TableCell>
                  <TableCell>
                    {inv.role === "ADMIN" ? "Admin" : "Schulbegleiter"}
                  </TableCell>
                  <TableCell>
                    {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.isUsed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Angenommen
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Ausstehend
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
