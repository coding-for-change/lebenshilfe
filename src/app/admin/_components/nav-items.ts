import {
  Baby,
  BookOpen,
  Home,
  Palmtree,
  School,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
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
];

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/admin/user-management",
    label: "Benutzerverwaltung",
    description: "Rollen und Zugänge steuern.",
    icon: ShieldCheck,
  },
];

export const ALL_NAV_ITEMS: readonly NavItem[] = [
  ...NAV_ITEMS,
  ...ADMIN_NAV_ITEMS,
];
