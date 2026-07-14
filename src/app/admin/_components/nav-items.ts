import {
  Baby,
  BookOpen,
  Home,
  MapPinned,
  Palmtree,
  School,
  ShieldCheck,
  TriangleAlert,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Compact label for the mobile bottom tab bar (falls back to `label`). */
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/admin",
    label: "Übersicht",
    description: "Zurück zur Übersicht.",
    icon: Home,
  },
  {
    href: "/admin/school-assistants",
    label: "Schulbegleiter",
    shortLabel: "Schulbeg.",
    description: "Profile, Verträge und Workshops verwalten.",
    icon: Users,
  },
  {
    href: "/admin/children",
    label: "Kinder",
    description: "Stammdaten, Kalender und Kontakte.",
    icon: Baby,
  },
  {
    href: "/admin/pools",
    label: "Pools",
    description: "Gruppen aus Kindern und Schulbegleitern verwalten.",
    icon: UsersRound,
  },
  {
    href: "/admin/schools",
    label: "Schulen",
    description: "Schulen verwalten und Ferienplan zuweisen.",
    icon: School,
  },
  {
    href: "/admin/holiday-plans",
    label: "Ferien",
    description: "Ferienpläne mit mehreren Zeiträumen verwalten.",
    icon: Palmtree,
  },
  {
    href: "/admin/workshops",
    label: "Workshops",
    description: "Fortbildungen anlegen und planen.",
    icon: BookOpen,
  },
  {
    href: "/admin/handlungsbedarf",
    label: "Handlungsbedarf",
    description: "Offene Vertretungs-Anträge zuordnen.",
    icon: TriangleAlert,
  },
  {
    href: "/admin/map",
    label: "Karte",
    description: "Einsätze eines Tages auf der Karte anzeigen.",
    icon: MapPinned,
  },
];

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/admin/user-management",
    label: "Benutzerverwaltung",
    shortLabel: "Benutzer",
    description: "Rollen und Zugänge steuern.",
    icon: ShieldCheck,
  },
];

export const ALL_NAV_ITEMS: readonly NavItem[] = [
  ...NAV_ITEMS,
  ...ADMIN_NAV_ITEMS,
];

/**
 * Whether a nav item is active for the current path. `/admin` (Übersicht) must
 * match exactly — a plain `startsWith` would light it up on every sub-route
 * (e.g. `/admin/children`), since it is a prefix of all of them.
 */
export function isNavActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}
