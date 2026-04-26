"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  LifeBuoy,
  Mail,
  Send,
  Settings,
  Users,
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
  DialogDescription,
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
import { LogoutButton } from "@/components/logout-button";
import { inviteMemberUseCase } from "@/use-cases/invite-member";
import { Role } from "@/generated/prisma";

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

type Props = {
  currentUser: { id: string; name: string; email: string };
  schoolAssistants: UserItem[];
  invitations: InvitationItem[];
};

export function AdminApp({
  currentUser,
  schoolAssistants,
  invitations,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(Role.SCHOOL_ASSISTANT);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const userInitials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleInvite(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    try {
      await inviteMemberUseCase(email, role);
      setStatus("success");
      setTimeout(() => {
        setInviteOpen(false);
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
    <>
      <div
        aria-hidden
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/login.webp')" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-white/40 backdrop-blur-[2px]"
      />
      <SidebarProvider
        defaultOpen
        className="bg-transparent! [&_[data-slot=sidebar-inner]]:rounded-xl [&_[data-slot=sidebar-inner]]:bg-sidebar/60 [&_[data-slot=sidebar-inner]]:shadow-sm"
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
              <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive
                      tooltip="Schulbegleiter"
                    >
                      <Users />
                      <span>Schulbegleiter</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Einladungen">
                      <Mail />
                      <span>Einladungen</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  onClick={() => setSettingsOpen(true)}
                  tooltip={currentUser.name}
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                    {userInitials}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {currentUser.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentUser.email}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-border bg-background/60 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <SidebarSeparator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <nav
              aria-label="Pfad"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <span>Verwaltung</span>
              <ChevronRight className="size-3.5 opacity-60" />
              <span className="font-medium text-foreground">Schulbegleiter</span>
            </nav>
          </header>
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Schulbegleiter Liste</h2>
                <Dialog
                  open={inviteOpen}
                  onOpenChange={setInviteOpen}
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
                          <p className="text-sm text-destructive">
                            {errorMessage}
                          </p>
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

              <div className="border rounded-xl overflow-hidden bg-card">
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
                    {schoolAssistants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-6 text-muted-foreground"
                        >
                          Keine Schulbegleiter gefunden.
                        </TableCell>
                      </TableRow>
                    ) : (
                      schoolAssistants.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.name}
                          </TableCell>
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

              <div className="border rounded-xl overflow-hidden mt-4 bg-card">
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
                          <TableCell className="font-medium">
                            {inv.email}
                          </TableCell>
                          <TableCell>
                            {inv.role === "ADMIN"
                              ? "Admin"
                              : "Schulbegleiter"}
                          </TableCell>
                          <TableCell>
                            {new Date(inv.createdAt).toLocaleDateString(
                              "de-DE",
                            )}
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
          </div>
        </SidebarInset>

        <Dialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Einstellungen</DialogTitle>
              <DialogDescription>
                Profil und Konto-Aktionen.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 py-2">
              <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
                {userInitials}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{currentUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
            </div>
            <div className="pt-2">
              <LogoutButton />
            </div>
          </DialogContent>
        </Dialog>

        <Toaster
          position="top-center"
          richColors
        />
      </SidebarProvider>
    </>
  );
}
