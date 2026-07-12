import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { EventType, Role, SchulbegleiterStatus } from "../src/generated/prisma";

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

const SEED_PASSWORD = "Lebenshilfe-Dev-2026!";

const USERS: SeedUser[] = [
  {
    email: "owner@lebenshilfe.de",
    password: SEED_PASSWORD,
    name: "Olivia Owner",
    role: Role.OWNER,
  },
  {
    email: "admin@lebenshilfe.de",
    password: SEED_PASSWORD,
    name: "System Admin",
    role: Role.ADMIN,
  },
  {
    email: "anna.schmidt@lebenshilfe.de",
    password: SEED_PASSWORD,
    name: "Anna Schmidt",
    role: Role.SCHOOL_ASSISTANT,
  },
  {
    email: "ben.weber@lebenshilfe.de",
    password: SEED_PASSWORD,
    name: "Ben Weber",
    role: Role.SCHOOL_ASSISTANT,
  },
  {
    email: "clara.becker@lebenshilfe.de",
    password: SEED_PASSWORD,
    name: "Clara Becker",
    role: Role.SCHOOL_ASSISTANT,
  },
];

// A Begleiter who has been invited but has not yet signed up. Populates the
// admin "pending invitations" views without a corresponding user account.
const PENDING_INVITATION = {
  email: "daniela.huber@lebenshilfe.de",
  name: "Daniela Huber",
  role: Role.SCHOOL_ASSISTANT,
  token: "seed-pending-daniela",
  weeklyHours: 18,
};

const KOSTENTRAEGER = [
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
];

// Holiday plans are shared across schools. Offsets are relative to "today" so a
// reseed always lands a current closure (to exercise the "Heute sind
// Schulferien" banner) plus a future range. Most schools use the standard plan;
// the Realschule models a special plan with its own extra closure.
type SeedHolidayPlan = {
  id: string;
  name: string;
  entries: {
    name: string | null;
    startOffset: number;
    endOffset: number;
  }[];
};

const HOLIDAY_PLANS: SeedHolidayPlan[] = [
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
];

type SeedSchool = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  holidayPlanId: string | null;
};

const SCHOOLS: SeedSchool[] = [
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
];

type SeedChild = {
  id: string;
  firstName: string;
  lastName: string;
  leosOne: boolean;
  bescheid: string | null;
  sbIb: string | null;
  schweigepflichtsentbindung: boolean;
  bemerkung: string | null;
  schoolId: string | null;
  kostentraegerId: string | null;
};

const CHILDREN: SeedChild[] = [
  {
    id: "seed-lena-fischer",
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
    id: "seed-max-huber",
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
    id: "seed-mia-bauer",
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
    id: "seed-paul-koch",
    firstName: "Paul",
    lastName: "Koch",
    leosOne: false,
    bescheid: "Bescheid Jugendamt Freising, neue Anschlussförderung beantragt.",
    sbIb: "IB",
    schweigepflichtsentbindung: true,
    bemerkung: "Therapiestunden mittwochs 11–12 Uhr außerhalb der Schule.",
    schoolId: "seed-school-meichelbeck",
    kostentraegerId: "seed-kt-jugendamt-fs",
  },
];

const WORKSHOPS = [
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
];

const TODAY = (() => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
})();

function dayOffset(offsetDays: number): Date {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
}

// Returns the date n weekdays before today (n=1 → yesterday's-or-earlier weekday).
function nthWeekdayBefore(n: number): Date {
  let count = 0;
  let i = 0;
  while (count < n) {
    i -= 1;
    if (!isWeekend(dayOffset(i))) count += 1;
  }
  return dayOffset(i);
}

async function createUserViaAuth(user: SeedUser) {
  await prisma.invitation.deleteMany({ where: { email: user.email } });
  await prisma.invitation.create({
    data: {
      email: user.email,
      role: user.role,
      token: `seed-token-${user.email}`,
      expiresAt: dayOffset(1),
      isUsed: false,
    },
  });

  if (user.role === Role.SCHOOL_ASSISTANT) {
    await prisma.schoolAssistantProfile.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: {
        email: user.email,
        name: user.name,
        status: SchulbegleiterStatus.INVITATION_PENDING,
        weeklyHours: 20,
      },
    });
  }

  const req = new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.name,
    }),
  });

  const response = await auth.handler(req);
  if (response.status !== 200) {
    const text = await response.text();
    throw new Error(
      `Sign-up failed for ${user.email} (${response.status}): ${text}`,
    );
  }

  await prisma.invitation.update({
    where: { token: `seed-token-${user.email}` },
    data: { isUsed: true },
  });
}

async function wipeSeedData() {
  console.log("Wiping previous seed data…");
  const seedEmails = [...USERS.map((u) => u.email), PENDING_INVITATION.email];
  const childIds = CHILDREN.map((c) => c.id);
  const workshopIds = WORKSHOPS.map((w) => w.id);
  const kostentraegerIds = KOSTENTRAEGER.map((k) => k.id);
  const schoolIds = SCHOOLS.map((s) => s.id);
  const holidayPlanIds = HOLIDAY_PLANS.map((p) => p.id);

  await prisma.event.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.monthlyReport.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.childAssignment.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.childAbsence.deleteMany({
    where: { childId: { in: childIds } },
  });
  await prisma.childVertretung.deleteMany({
    where: { childId: { in: childIds } },
  });
  await prisma.schedule.deleteMany({ where: { childId: { in: childIds } } });
  await prisma.child.deleteMany({ where: { id: { in: childIds } } });
  await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
  // HolidayPlanEntry rows cascade when their plan is removed.
  await prisma.holidayPlan.deleteMany({
    where: { id: { in: holidayPlanIds } },
  });
  await prisma.kostentraeger.deleteMany({
    where: { id: { in: kostentraegerIds } },
  });
  await prisma.workshopAttendance.deleteMany({
    where: { workshop: { id: { in: workshopIds } } },
  });
  await prisma.workshop.deleteMany({ where: { id: { in: workshopIds } } });
  await prisma.schoolAssistantProfile.deleteMany({
    where: { email: { in: seedEmails } },
  });
  await prisma.invitation.deleteMany({ where: { email: { in: seedEmails } } });
  await prisma.user.deleteMany({ where: { email: { in: seedEmails } } });
}

async function seedPendingInvitation() {
  console.log("Creating pending invitation (no user signed up yet)…");
  await prisma.schoolAssistantProfile.create({
    data: {
      email: PENDING_INVITATION.email,
      name: PENDING_INVITATION.name,
      status: SchulbegleiterStatus.INVITATION_PENDING,
      weeklyHours: PENDING_INVITATION.weeklyHours,
    },
  });
  await prisma.invitation.create({
    data: {
      email: PENDING_INVITATION.email,
      role: PENDING_INVITATION.role,
      token: PENDING_INVITATION.token,
      expiresAt: dayOffset(7),
      isUsed: false,
    },
  });
}

async function seedCostBearers() {
  console.log("Seeding Kostenträger…");
  for (const k of KOSTENTRAEGER) {
    await prisma.kostentraeger.create({ data: k });
  }
}

async function seedHolidayPlans() {
  console.log("Seeding holiday plans & ranges…");
  for (const p of HOLIDAY_PLANS) {
    await prisma.holidayPlan.create({
      data: {
        id: p.id,
        name: p.name,
        holidays: {
          create: p.entries.map((e) => ({
            name: e.name,
            startDate: dayOffset(e.startOffset),
            endDate: dayOffset(e.endOffset),
          })),
        },
      },
    });
  }
}

async function seedSchools() {
  console.log("Seeding schools…");
  for (const s of SCHOOLS) {
    await prisma.school.create({ data: s });
  }
}

// Per-child weekly Stundenplan (the child's school timetable). weekday uses
// Mon=0..Sun=6, matching Schedule.weekday everywhere in the app. Multiple
// blocks on the same weekday are intentional (e.g. a therapy gap) and mirror
// what the data model and Vertretung copy logic already support.
const CHILD_SCHEDULES: Record<
  string,
  { weekday: number; startTime: string; endTime: string }[]
> = {
  // Lena: Mon–Fri 08:00–13:00 (Anna covers the full window).
  "seed-lena-fischer": [0, 1, 2, 3, 4].map((weekday) => ({
    weekday,
    startTime: "08:00",
    endTime: "13:00",
  })),
  // Max: Mon–Fri 08:00–13:00 (Anna covers until 12:30).
  "seed-max-huber": [0, 1, 2, 3, 4].map((weekday) => ({
    weekday,
    startTime: "08:00",
    endTime: "13:00",
  })),
  // Mia: longer school days, Mon–Fri 08:00–14:00 (Ben covers 09:00–14:00).
  "seed-mia-bauer": [0, 1, 2, 3, 4].map((weekday) => ({
    weekday,
    startTime: "08:00",
    endTime: "14:00",
  })),
  // Paul: Mon–Fri 08:00–13:00, but Wednesday (weekday 2) is split around the
  // 11–12 therapy slot that takes place outside of school.
  "seed-paul-koch": [
    { weekday: 0, startTime: "08:00", endTime: "13:00" },
    { weekday: 1, startTime: "08:00", endTime: "13:00" },
    { weekday: 2, startTime: "08:00", endTime: "11:00" },
    { weekday: 2, startTime: "12:00", endTime: "13:00" },
    { weekday: 3, startTime: "08:00", endTime: "13:00" },
    { weekday: 4, startTime: "08:00", endTime: "13:00" },
  ],
};

async function seedChildrenAndSchedules() {
  console.log("Seeding children & weekly schedules…");
  for (const c of CHILDREN) {
    await prisma.child.create({ data: c });
    for (const block of CHILD_SCHEDULES[c.id] ?? []) {
      await prisma.schedule.create({
        data: {
          childId: c.id,
          weekday: block.weekday,
          startTime: block.startTime,
          endTime: block.endTime,
        },
      });
    }
  }
}

async function seedChildAbsences() {
  console.log("Seeding Krankheitstage for children…");
  const absences: Array<{
    childId: string;
    offset: number;
    note: string | null;
  }> = [
    { childId: "seed-lena-fischer", offset: -3, note: "Magen-Darm-Infekt" },
    { childId: "seed-max-huber", offset: -1, note: null },
    { childId: "seed-mia-bauer", offset: 2, note: "Arzttermin angekündigt" },
    { childId: "seed-paul-koch", offset: 4, note: "Familienreise mit Attest" },
  ];

  for (const a of absences) {
    const date = dayOffset(a.offset);
    if (isWeekend(date)) continue;
    await prisma.childAbsence.create({
      data: { childId: a.childId, date, note: a.note },
    });
  }
}

async function enrichProfiles() {
  console.log("Enriching Schulbegleiter profiles with varied flags…");
  await prisma.schoolAssistantProfile.update({
    where: { email: "anna.schmidt@lebenshilfe.de" },
    data: {
      leosOne: true,
      outlook: true,
      weeklyHours: 20,
      introductionDay: nthWeekdayBefore(20),
      zvNeuNachBescheid: false,
    },
  });
  await prisma.schoolAssistantProfile.update({
    where: { email: "ben.weber@lebenshilfe.de" },
    data: {
      leosOne: false,
      outlook: true,
      weeklyHours: 25,
      introductionDay: nthWeekdayBefore(40),
      zvNeuNachBescheid: true,
      zvNeuNote:
        "Bescheid liegt vor — Aufstockung von 20 auf 25 Wochenstunden ab kommendem Monat.",
    },
  });
  await prisma.schoolAssistantProfile.update({
    where: { email: "clara.becker@lebenshilfe.de" },
    data: {
      leosOne: true,
      outlook: false,
      weeklyHours: 15,
      introductionDay: nthWeekdayBefore(5),
      zvNeuNachBescheid: false,
    },
  });
}

async function assignChildren(usersByEmail: Record<string, string>) {
  console.log("Assigning children to school assistants per weekday…");
  const annaId = usersByEmail["anna.schmidt@lebenshilfe.de"];
  const benId = usersByEmail["ben.weber@lebenshilfe.de"];
  const claraId = usersByEmail["clara.becker@lebenshilfe.de"];

  // Anna splits her week: Lena Mon/Wed/Fri, Max Tue/Thu.
  // Ben covers Mia all five weekdays. Clara covers Paul all five weekdays.
  // One day per pair is flagged tandem=true so the UI surfaces that variation.
  // weekday uses Mon=0..Sun=6 (matches Schedule/ChildAssignment everywhere in
  // the app: WEEKDAYS[0]="mon" and (getUTCDay()+6)%7), so Mon=0 … Fri=4.
  const assignments: Array<{
    childId: string;
    userId: string;
    weekday: number;
    startTime: string;
    endTime: string;
    tandem: boolean;
  }> = [
    // Anna ↔ Lena (Mon/Wed/Fri)
    {
      childId: "seed-lena-fischer",
      userId: annaId,
      weekday: 0,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    {
      childId: "seed-lena-fischer",
      userId: annaId,
      weekday: 2,
      startTime: "08:00",
      endTime: "13:00",
      tandem: true,
    },
    {
      childId: "seed-lena-fischer",
      userId: annaId,
      weekday: 4,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    // Anna ↔ Max (Tue/Thu)
    {
      childId: "seed-max-huber",
      userId: annaId,
      weekday: 1,
      startTime: "08:00",
      endTime: "12:30",
      tandem: false,
    },
    {
      childId: "seed-max-huber",
      userId: annaId,
      weekday: 3,
      startTime: "08:00",
      endTime: "12:30",
      tandem: false,
    },
    // Ben ↔ Mia (full week)
    {
      childId: "seed-mia-bauer",
      userId: benId,
      weekday: 0,
      startTime: "09:00",
      endTime: "14:00",
      tandem: false,
    },
    {
      childId: "seed-mia-bauer",
      userId: benId,
      weekday: 1,
      startTime: "09:00",
      endTime: "14:00",
      tandem: false,
    },
    {
      childId: "seed-mia-bauer",
      userId: benId,
      weekday: 2,
      startTime: "09:00",
      endTime: "14:00",
      tandem: false,
    },
    {
      childId: "seed-mia-bauer",
      userId: benId,
      weekday: 3,
      startTime: "09:00",
      endTime: "14:00",
      tandem: true,
    },
    {
      childId: "seed-mia-bauer",
      userId: benId,
      weekday: 4,
      startTime: "09:00",
      endTime: "14:00",
      tandem: false,
    },
    // Clara ↔ Paul (full week)
    {
      childId: "seed-paul-koch",
      userId: claraId,
      weekday: 0,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    {
      childId: "seed-paul-koch",
      userId: claraId,
      weekday: 1,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    {
      childId: "seed-paul-koch",
      userId: claraId,
      weekday: 2,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    {
      childId: "seed-paul-koch",
      userId: claraId,
      weekday: 3,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
    {
      childId: "seed-paul-koch",
      userId: claraId,
      weekday: 4,
      startTime: "08:00",
      endTime: "13:00",
      tandem: false,
    },
  ];

  for (const a of assignments) {
    await prisma.childAssignment.create({ data: a });
  }
}

async function seedVertretungen(usersByEmail: Record<string, string>) {
  console.log("Seeding Vertretungen (substitute coverage)…");
  const annaId = usersByEmail["anna.schmidt@lebenshilfe.de"];
  const claraId = usersByEmail["clara.becker@lebenshilfe.de"];

  // Illustrative substitute coverage so the Vertretung UI (homepage cards,
  // week calendar, admin views) has data to render. Each record copies the
  // child's Stundenplan blocks for that weekday — exactly like
  // ChildrenFacade.createVertretung — and uses a recent past weekday so no
  // Vertretung lands in the future.
  const vertretungen: Array<{
    childId: string;
    substituteUserId: string;
    date: Date;
  }> = [
    // Anna steps in for Paul (normally Clara's) — populates Anna's homepage.
    {
      childId: "seed-paul-koch",
      substituteUserId: annaId,
      date: nthWeekdayBefore(4),
    },
    // Clara steps in for Max (normally Anna's).
    {
      childId: "seed-max-huber",
      substituteUserId: claraId,
      date: nthWeekdayBefore(6),
    },
  ];

  for (const v of vertretungen) {
    // Mon=0..Sun=6, matching Schedule.weekday.
    const weekday = (v.date.getUTCDay() + 6) % 7;
    const blocks = await prisma.schedule.findMany({
      where: { childId: v.childId, weekday },
      select: { startTime: true, endTime: true },
    });
    const timeBlocks =
      blocks.length > 0 ? blocks : [{ startTime: "08:00", endTime: "13:00" }];
    await prisma.childVertretung.createMany({
      data: timeBlocks.map((b) => ({
        childId: v.childId,
        substituteUserId: v.substituteUserId,
        date: v.date,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  }
}

type DraftEvent = {
  offset: number;
  child: string | null;
  type: EventType;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
};

const ANNA_PLAN: DraftEvent[] = [
  // Previous week
  {
    offset: -7,
    child: "seed-lena-fischer",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: -6,
    child: "seed-max-huber",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "12:30",
    note: null,
  },
  // Current week
  {
    offset: -3,
    child: "seed-lena-fischer",
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
    child: "seed-lena-fischer",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: "Wiedereinstieg nach Krankheit",
  },
];

const BEN_PLAN: DraftEvent[] = [
  {
    offset: -7,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: -6,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: "Vorlesetag",
  },
  {
    offset: -3,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: -2,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: -1,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: 0,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
];

const CLARA_PLAN: DraftEvent[] = [
  {
    offset: -7,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: -6,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: -3,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: -2,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: -1,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: "Therapiestunde 11–12 Uhr",
  },
  {
    offset: 0,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
];

async function seedEvents(usersByEmail: Record<string, string>) {
  console.log("Seeding events within ±7 days of today…");

  const plans: Array<{ userId: string; plan: DraftEvent[] }> = [
    { userId: usersByEmail["anna.schmidt@lebenshilfe.de"], plan: ANNA_PLAN },
    { userId: usersByEmail["ben.weber@lebenshilfe.de"], plan: BEN_PLAN },
    { userId: usersByEmail["clara.becker@lebenshilfe.de"], plan: CLARA_PLAN },
  ];

  let created = 0;
  for (const { userId, plan } of plans) {
    for (const e of plan) {
      const date = dayOffset(e.offset);
      if (isWeekend(date)) continue;
      await prisma.event.create({
        data: {
          userId,
          childId: e.child,
          type: e.type,
          date,
          startTime: e.startTime,
          endTime: e.endTime,
          note: e.note,
          signatureKey: `seed/signatures/${userId}-${date.toISOString().slice(0, 10)}.png`,
        },
      });
      created += 1;
    }
  }
  console.log(`  → ${created} events`);
}

async function seedMonthlyReports(usersByEmail: Record<string, string>) {
  console.log("Seeding monthly reports for the previous month…");
  const previousMonth = new Date(TODAY);
  previousMonth.setUTCDate(1);
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const year = previousMonth.getUTCFullYear();
  const month = previousMonth.getUTCMonth() + 1;

  for (const email of [
    "anna.schmidt@lebenshilfe.de",
    "ben.weber@lebenshilfe.de",
    "clara.becker@lebenshilfe.de",
  ]) {
    const userId = usersByEmail[email];
    await prisma.monthlyReport.create({
      data: {
        userId,
        year,
        month,
        supervisorName: "Stefan Vorgesetzter",
        supervisorSignatureKey: `seed/signatures/supervisor-${userId}-${year}-${month}.png`,
      },
    });
  }
}

async function seedWorkshopsAndAttendances() {
  console.log("Seeding workshops & attendances…");
  for (const w of WORKSHOPS) {
    await prisma.workshop.create({ data: w });
  }

  const profiles = await prisma.schoolAssistantProfile.findMany({
    where: {
      email: {
        in: [
          "anna.schmidt@lebenshilfe.de",
          "ben.weber@lebenshilfe.de",
          "clara.becker@lebenshilfe.de",
        ],
      },
    },
    select: { id: true, email: true },
  });
  const byEmail = Object.fromEntries(profiles.map((p) => [p.email, p.id]));

  const attendances = [
    {
      workshopId: "seed-ws-deeskalation",
      profileId: byEmail["anna.schmidt@lebenshilfe.de"],
      attendedOn: nthWeekdayBefore(4),
    },
    {
      workshopId: "seed-ws-erste-hilfe",
      profileId: byEmail["anna.schmidt@lebenshilfe.de"],
      attendedOn: nthWeekdayBefore(2),
    },
    {
      workshopId: "seed-ws-deeskalation",
      profileId: byEmail["ben.weber@lebenshilfe.de"],
      attendedOn: nthWeekdayBefore(4),
    },
    {
      workshopId: "seed-ws-autismus",
      profileId: byEmail["clara.becker@lebenshilfe.de"],
      attendedOn: nthWeekdayBefore(8),
    },
  ];

  for (const a of attendances) {
    await prisma.workshopAttendance.create({ data: a });
  }
}

async function main() {
  await wipeSeedData();

  console.log("Creating users via Better Auth…");
  for (const u of USERS) {
    console.log(`  • ${u.role.padEnd(18)} ${u.email}`);
    await createUserViaAuth(u);
  }

  const created = await prisma.user.findMany({
    where: { email: { in: USERS.map((u) => u.email) } },
    select: { id: true, email: true },
  });
  const usersByEmail = Object.fromEntries(created.map((u) => [u.email, u.id]));

  await seedPendingInvitation();
  await seedCostBearers();
  await seedHolidayPlans();
  await seedSchools();
  await seedChildrenAndSchedules();
  await assignChildren(usersByEmail);
  await seedVertretungen(usersByEmail);
  await seedChildAbsences();
  await enrichProfiles();
  await seedEvents(usersByEmail);
  await seedMonthlyReports(usersByEmail);
  await seedWorkshopsAndAttendances();

  console.log("\n=========== SEED COMPLETE ===========");
  for (const u of USERS) {
    console.log(`${u.role.padEnd(18)} ${u.email.padEnd(35)} pw: ${u.password}`);
  }
  console.log(
    `PENDING (no login)  ${PENDING_INVITATION.email.padEnd(35)} (invitation only)`,
  );
  console.log("=====================================");
  console.log(
    `Events span ${dayOffset(-7).toISOString().slice(0, 10)} → ${TODAY.toISOString().slice(0, 10)} (past through today; no future entries).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
