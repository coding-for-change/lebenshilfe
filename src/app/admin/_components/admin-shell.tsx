"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_ITEMS,
  ADMIN_NAV_ITEMS,
  ALL_NAV_ITEMS,
  isNavActive,
} from "./nav-items";
import { AdminBottomTabBar } from "./admin-bottom-tab-bar";
import { ChevronRight, LifeBuoy, Send } from "lucide-react";
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
  const match = ALL_NAV_ITEMS.find((item) => isNavActive(pathname, item.href));
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
      {/* Decorative chrome is desktop-only: it is never visible behind the
          full-bleed mobile layout and its compositing layers hurt scroll/paint
          on mid-range phones. */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20 hidden bg-cover bg-center md:block"
        style={{ backgroundImage: "url('/login.webp')" }}
      />
      <div
        aria-hidden
        className="fixed inset-0 -z-10 hidden bg-white/40 backdrop-blur-[2px] md:block"
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
                  className="h-14 w-auto object-contain transition-all group-data-[collapsible=icon]:h-8 md:h-20"
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
                      isActive={isNavActive(pathname, item.href)}
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
                      isActive={isNavActive(pathname, item.href)}
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
          <header className="flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b border-border bg-background/60 px-4 md:backdrop-blur">
            <SidebarTrigger className="-ml-1 size-11 md:size-7" />
            <SidebarSeparator
              orientation="vertical"
              className="mr-2 hidden h-4 md:block"
            />
            <nav
              aria-label="Pfad"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <Link
                href="/admin"
                className="hidden md:inline"
              >
                Verwaltung
              </Link>
              <ChevronRight className="hidden size-3.5 opacity-60 md:inline" />
              <span className="font-medium text-foreground">{breadcrumb}</span>
            </nav>
          </header>
          {pathname.startsWith("/admin/map") ? (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-xl">
              {children}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
              {children}
            </div>
          )}
        </SidebarInset>

        <AdminBottomTabBar />

        <Toaster
          position="bottom-right"
          richColors
          // Lift toasts above the mobile bottom tab bar (~56px + safe area).
          mobileOffset={{ bottom: "6rem" }}
        />
      </SidebarProvider>
    </>
  );
}
