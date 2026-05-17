"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LifeBuoy, Send } from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEMS, ALL_NAV_ITEMS } from "./nav-items";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { NavUser } from "@/components/nav-user";

type AdminShellProps = {
  currentUser: { id: string; name: string; email: string };
  children: ReactNode;
};

function deriveBreadcrumb(pathname: string): string {
  const match = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  return match?.label ?? "Übersicht";
}

function NavLink({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={label}
      >
        <Link
          href={href}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminShell({ currentUser, children }: AdminShellProps) {
  const pathname = usePathname();
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
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={item.icon}
                      isActive={pathname.startsWith(item.href)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ADMIN_NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={item.icon}
                      isActive={pathname.startsWith(item.href)}
                    />
                  ))}
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
            <NavUser
              user={{ name: currentUser.name, email: currentUser.email }}
            />
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

        <Toaster
          position="bottom-right"
          richColors
        />
      </SidebarProvider>
    </>
  );
}
