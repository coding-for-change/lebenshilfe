"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  LifeBuoy,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoutButton } from "@/components/logout-button";

type AdminShellProps = {
  currentUser: { id: string; name: string; email: string };
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    href: "/admin/schulbegleiter",
    label: "Schulbegleiter",
    icon: Users,
  },
  {
    href: "/admin/workshops",
    label: "Workshops",
    icon: BookOpen,
  },
] as const;

function deriveBreadcrumb(pathname: string): string {
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  return match?.label ?? "Übersicht";
}

export function AdminShell({ currentUser, children }: AdminShellProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  const userInitials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const breadcrumb = deriveBreadcrumb(pathname);

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
              <Link
                href="/admin"
                aria-label="Zur Übersicht"
              >
                <Image
                  src="/lebenshilfe-muenchen-logo_2026.svg"
                  alt="Lebenshilfe München"
                  width={160}
                  height={160}
                  priority
                  className="h-20 w-auto object-contain transition-all group-data-[collapsible=icon]:h-8"
                />
              </Link>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Verwaltung</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
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
              <span className="font-medium text-foreground">{breadcrumb}</span>
            </nav>
          </header>
          <div className="mx-auto w-full max-w-7xl px-6 py-8">{children}</div>
        </SidebarInset>

        <Dialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Einstellungen</DialogTitle>
              <DialogDescription>Profil und Konto-Aktionen.</DialogDescription>
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
