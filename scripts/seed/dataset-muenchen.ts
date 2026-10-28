import { EventType, Role } from "../../src/generated/prisma";
import type { SeedDataset } from "./types";

// Local development dataset. Deliberately full of awkward cases — a pending
// invitation with no account, a split Wednesday timetable, a sick streak, a
// Vertretung, an Aufstockung awaiting a Bescheid — because its job is to
// exercise the UI, not to look tidy. The demo dataset
// (dataset-hamburg-demo.ts) makes the opposite trade.

const PASSWORD = "Lebenshilfe-Dev-2026!";

const ANNA = "anna.schmidt@lebenshilfe.de";
const BEN = "ben.weber@lebenshilfe.de";
const CLARA = "clara.becker@lebenshilfe.de";

const LENA = "seed-lena-fischer";
const MAX = "seed-max-huber";
const MIA = "seed-mia-bauer";
const PAUL = "seed-paul-koch";

/** Mon–Fri, same hours every day. */
function weekdays(startTime: string, endTime: string) {
  return [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime, endTime }));
}

export const muenchenDataset: SeedDataset = {
  label: "München (Entwicklung)",

  users: [
    {
      email: "owner@lebenshilfe.de",
      password: PASSWORD,
      name: "Olivia Owner",
      role: Role.OWNER,
    },
    {
      email: "admin@lebenshilfe.de",
      password: PASSWORD,
      name: "System Admin",
      role: Role.ADMIN,
    },
    {
      email: ANNA,
      password: PASSWORD,
      name: "Anna Schmidt",
      role: Role.SCHOOL_ASSISTANT,
    },
    {
      email: BEN,
      password: PASSWORD,
      name: "Ben Weber",
      role: Role.SCHOOL_ASSISTANT,
    },
    {
      email: CLARA,
      password: PASSWORD,
      name: "Clara Becker",
      role: Role.SCHOOL_ASSISTANT,
    },
  ],

  // Invited but never signed up — populates the admin "pending invitations"
  // views without a corresponding user account.
  pendingInvitation: {
    email: "daniela.huber@lebenshilfe.de",
    name: "Daniela Huber",
    role: Role.SCHOOL_ASSISTANT,
    token: "seed-pending-daniela",
    weeklyHours: 18,
  },

  kostentraeger: [
    {
      id: "seed-kt-bezirk-obb",
      name: "Bezirk Oberbayern",
      email: "schulbegleitung@bezirk-oberbayern.example",
      address: "Prinzregentenstraße 14, 80538 München",
    },
    {
      id: "seed-kt-stadt-muenchen",
      name: "Stadt München – Sozialreferat",
      email: "sozialreferat@muenchen.example",
      address: "Orleansplatz 11, 81667 München",
    },
    {
      id: "seed-kt-jugendamt-fs",
      name: "Jugendamt Landkreis Freising",
      email: "jugendamt@kreis-fs.example",
      address: "Landshuter Straße 31, 85356 Freising",
    },
  ],

  // Offsets are relative to "today" so a reseed always lands a current closure
  // (to exercise the "Heute sind Schulferien" banner) plus a future range.
  holidayPlans: [
    {
      id: "seed-plan-bayern",
      name: "Bayern Standard 2026/27",
      entries: [
        { name: "Pfingstferien", startOffset: -2, endOffset: 9 },
        { name: "Sommerferien", startOffset: 60, endOffset: 100 },
      ],
    },
    {
      id: "seed-plan-realschule",
      name: "Realschule Sonderplan",
      entries: [
        { name: "Bewegliche Ferientage", startOffset: -1, endOffset: 1 },
        { name: "Sommerferien", startOffset: 58, endOffset: 102 },
      ],
    },
  ],

  schools: [
    {
      id: "seed-school-bergmann",
      name: "Grundschule an der Bergmannstraße",
      address: "Bergmannstraße 36, 80339 München",
      lat: 48.1351,
      lng: 11.5538,
      holidayPlanId: "seed-plan-bayern",
    },
    {
      id: "seed-school-walliser",
      name: "Mittelschule an der Walliser Straße",
      address: "Walliser Straße 5, 81475 München",
      lat: 48.0928,
      lng: 11.5021,
      holidayPlanId: "seed-plan-bayern",
    },
    {
      id: "seed-school-impler",
      name: "Grundschule an der Implerstraße",
      address: "Implerstraße 35, 81371 München",
      lat: 48.1187,
      lng: 11.5447,
      holidayPlanId: "seed-plan-bayern",
    },
    {
      id: "seed-school-meichelbeck",
      name: "Karl-Meichelbeck-Realschule",
      address: "General-von-Nagel-Straße 6, 85354 Freising",
      lat: 48.4047,
      lng: 11.7474,
      holidayPlanId: "seed-plan-realschule",
    },
  ],

  children: [
    {
      id: LENA,
      firstName: "Lena",
      lastName: "Fischer",
      leosOne: true,
      bescheid: "Bescheid des Bezirks Oberbayern, gültig bis 31.07.2026.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: "Ruhig, braucht klare Strukturen und feste Abläufe.",
      schoolId: "seed-school-bergmann",
      kostentraegerId: "seed-kt-bezirk-obb",
    },
    {
      id: MAX,
      firstName: "Max",
      lastName: "Huber",
      leosOne: false,
      bescheid: null,
      sbIb: "IB",
      schweigepflichtsentbindung: false,
      bemerkung:
        "Schweigepflichtsentbindung noch ausstehend — Eltern angeschrieben.",
      schoolId: "seed-school-walliser",
      kostentraegerId: "seed-kt-stadt-muenchen",
    },
    {
      id: MIA,
      firstName: "Mia",
      lastName: "Bauer",
      leosOne: true,
      bescheid: "Folgebescheid Stadt München vom 12.03.2026.",
      sbIb: "SB",
      schweigepflichtsentbindung: true,
      bemerkung: null,
      schoolId: "seed-school-impler",
      kostentraegerId: "seed-kt-stadt-muenchen",
    },
    {
      id: PAUL,
      firstName: "Paul",
      lastName: "Koch",
      leosOne: false,
      bescheid:
        "Bescheid Jugendamt Freising, neue Anschlussförderung beantragt.",
      sbIb: "IB",
      schweigepflichtsentbindung: true,
      bemerkung: "Therapiestunden mittwochs 11–12 Uhr außerhalb der Schule.",
      schoolId: "seed-school-meichelbeck",
      kostentraegerId: "seed-kt-jugendamt-fs",
    },
  ],

  childSchedules: {
    [LENA]: weekdays("08:00", "13:00"),
    [MAX]: weekdays("08:00", "13:00"),
    [MIA]: weekdays("08:00", "14:00"),
    // Wednesday (weekday 2) is split around the 11–12 therapy slot that takes
    // place outside of school — two blocks on one day is supported everywhere.
    [PAUL]: [
      { weekday: 0, startTime: "08:00", endTime: "13:00" },
      { weekday: 1, startTime: "08:00", endTime: "13:00" },
      { weekday: 2, startTime: "08:00", endTime: "11:00" },
      { weekday: 2, startTime: "12:00", endTime: "13:00" },
      { weekday: 3, startTime: "08:00", endTime: "13:00" },
      { weekday: 4, startTime: "08:00", endTime: "13:00" },
    ],
  },

  absences: [
    { childId: LENA, offset: -3, note: "Magen-Darm-Infekt" },
    { childId: MAX, offset: -1, note: null },
    { childId: MIA, offset: 2, note: "Arzttermin angekündigt" },
    { childId: PAUL, offset: 4, note: "Familienreise mit Attest" },
  ],

  profileDetails: {
    [ANNA]: {
      leosOne: true,
      outlook: true,
      weeklyHours: 20,
      introductionDayWeekdaysAgo: 20,
      zvNeuNachBescheid: false,
    },
    [BEN]: {
      leosOne: false,
      outlook: true,
      weeklyHours: 25,
      introductionDayWeekdaysAgo: 40,
      zvNeuNachBescheid: true,
      zvNeuNote:
        "Bescheid liegt vor — Aufstockung von 20 auf 25 Wochenstunden ab kommendem Monat.",
    },
    [CLARA]: {
      leosOne: true,
      outlook: false,
      weeklyHours: 15,
      introductionDayWeekdaysAgo: 5,
      zvNeuNachBescheid: false,
    },
  },

  // Anna splits her week: Lena Mon/Wed/Fri, Max Tue/Thu. Ben covers Mia and
  // Clara covers Paul all five weekdays. One day per pair is tandem=true so the
  // UI surfaces that variation.
  assignments: [
    ...[0, 2, 4].map((weekday) => ({
      childId: LENA,
      profileEmail: ANNA,
      weekday,
      startTime: "08:00",
      endTime: "13:00",
      tandem: weekday === 2,
    })),
    ...[1, 3].map((weekday) => ({
      childId: MAX,
      profileEmail: ANNA,
      weekday,
      startTime: "08:00",
      endTime: "12:30",
      tandem: false,
    })),
    ...[0, 1, 2, 3, 4].map((weekday) => ({
      childId: MIA,
      profileEmail: BEN,
      weekday,
      startTime: "09:00",
      endTime: "14:00",
      tandem: weekday === 3,
    })),
    ...[0, 1, 2, 3, 4].map((weekday) => ({
      childId: PAUL,
      profileEmail: CLARA,
      weekday,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    })),
  ],

  vertretungen: [
    // Anna steps in for Paul (normally Clara's) — populates Anna's homepage.
    { childId: PAUL, substituteEmail: ANNA, weekdaysAgo: 4 },
    { childId: MAX, substituteEmail: CLARA, weekdaysAgo: 6 },
  ],

  eventPlans: {
    [ANNA]: [
      {
        offset: -7,
        child: LENA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: null,
      },
      {
        offset: -6,
        child: MAX,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "12:30",
        note: null,
      },
      {
        offset: -3,
        child: LENA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: "Schulausflug ins Museum",
      },
      {
        offset: -2,
        child: null,
        type: EventType.SICK,
        startTime: null,
        endTime: null,
        note: "Erkältung, AU folgt.",
      },
      {
        offset: -1,
        child: null,
        type: EventType.SICK,
        startTime: null,
        endTime: null,
        note: null,
      },
      {
        offset: 0,
        child: LENA,
        type: EventType.WORK,
        startTime: "08:00",
        endTime: "13:00",
        note: "Wiedereinstieg nach Krankheit",
      },
    ],
    [BEN]: [-7, -6, -3, -2, -1, 0].map((offset) => ({
      offset,
      child: MIA,
      type: EventType.WORK,
      startTime: "09:00",
      endTime: "14:00",
      note: offset === -6 ? "Vorlesetag" : null,
    })),
    [CLARA]: [-7, -6, -3, -2, -1, 0].map((offset) => ({
      offset,
      child: PAUL,
      type: EventType.WORK,
      startTime: "08:00",
      endTime: "13:00",
      note: offset === -1 ? "Therapiestunde 11–12 Uhr" : null,
    })),
  },

  monthlyReports: {
    supervisorName: "Stefan Vorgesetzter",
    emails: [ANNA, BEN, CLARA],
  },

  workshops: [
    {
      id: "seed-ws-deeskalation",
      name: "Deeskalation im Schulalltag",
      description:
        "Grundlagen der gewaltfreien Kommunikation und Konfliktlösung im Schulkontext.",
    },
    {
      id: "seed-ws-erste-hilfe",
      name: "Erste Hilfe für Schulbegleiter",
      description: "Auffrischung Erste-Hilfe-Maßnahmen mit Fokus auf Kinder.",
    },
    {
      id: "seed-ws-autismus",
      name: "Autismus-Spektrum in der Schulbegleitung",
      description:
        "Grundwissen zum Autismus-Spektrum und praktische Strategien für die Begleitung im Schulalltag.",
    },
  ],

  attendances: [
    {
      workshopId: "seed-ws-deeskalation",
      profileEmail: ANNA,
      weekdaysAgo: 4,
    },
    { workshopId: "seed-ws-erste-hilfe", profileEmail: ANNA, weekdaysAgo: 2 },
    { workshopId: "seed-ws-deeskalation", profileEmail: BEN, weekdaysAgo: 4 },
    { workshopId: "seed-ws-autismus", profileEmail: CLARA, weekdaysAgo: 8 },
  ],
};
