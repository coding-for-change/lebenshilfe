import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { EventType, Role, SchulbegleiterStatus } from "../src/generated/prisma";

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

const USERS: SeedUser[] = [
  {
    email: "owner@lebenshilfe.de",
    password: "password123",
    name: "Olivia Owner",
    role: Role.OWNER,
  },
  {
    email: "admin@lebenshilfe.de",
    password: "password123",
    name: "System Admin",
    role: Role.ADMIN,
  },
  {
    email: "anna.schmidt@lebenshilfe.de",
    password: "password123",
    name: "Anna Schmidt",
    role: Role.SCHOOL_ASSISTANT,
  },
  {
    email: "ben.weber@lebenshilfe.de",
    password: "password123",
    name: "Ben Weber",
    role: Role.SCHOOL_ASSISTANT,
  },
  {
    email: "clara.becker@lebenshilfe.de",
    password: "password123",
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

const CHILDREN = [
  { id: "seed-lena-fischer", firstName: "Lena", lastName: "Fischer" },
  { id: "seed-max-huber", firstName: "Max", lastName: "Huber" },
  { id: "seed-mia-bauer", firstName: "Mia", lastName: "Bauer" },
  { id: "seed-paul-koch", firstName: "Paul", lastName: "Koch" },
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

function nthWeekdayAfter(n: number): Date {
  let count = 0;
  let i = 0;
  while (count < n) {
    i += 1;
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

  await prisma.event.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.monthlyReport.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.childAssignment.deleteMany({
    where: { user: { email: { in: seedEmails } } },
  });
  await prisma.schedule.deleteMany({ where: { childId: { in: childIds } } });
  await prisma.child.deleteMany({ where: { id: { in: childIds } } });
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

async function seedChildrenAndSchedules() {
  console.log("Seeding children & weekly schedules…");
  for (const c of CHILDREN) {
    await prisma.child.create({ data: c });
    for (let weekday = 1; weekday <= 5; weekday++) {
      await prisma.schedule.create({
        data: {
          childId: c.id,
          weekday,
          startTime: "08:00",
          endTime: "13:00",
        },
      });
    }
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
  console.log("Assigning children to school assistants…");
  const annaId = usersByEmail["anna.schmidt@lebenshilfe.de"];
  const benId = usersByEmail["ben.weber@lebenshilfe.de"];
  const claraId = usersByEmail["clara.becker@lebenshilfe.de"];

  const assignments: Array<{ childId: string; userId: string }> = [
    { childId: "seed-lena-fischer", userId: annaId },
    { childId: "seed-max-huber", userId: annaId },
    { childId: "seed-mia-bauer", userId: benId },
    { childId: "seed-paul-koch", userId: claraId },
  ];

  for (const a of assignments) {
    await prisma.childAssignment.create({ data: a });
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
  {
    offset: 1,
    child: "seed-max-huber",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "12:30",
    note: null,
  },
  // Following week
  {
    offset: 4,
    child: "seed-lena-fischer",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: 5,
    child: "seed-max-huber",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "12:30",
    note: "Sportunterricht in der Halle",
  },
  {
    offset: 6,
    child: "seed-lena-fischer",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: 7,
    child: "seed-max-huber",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "12:30",
    note: null,
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
  {
    offset: 1,
    child: null,
    type: EventType.SICK,
    startTime: null,
    endTime: null,
    note: "Migräneanfall",
  },
  {
    offset: 4,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: "Schulfest-Vorbereitung",
  },
  {
    offset: 5,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: 6,
    child: "seed-mia-bauer",
    type: EventType.WORK,
    startTime: "09:00",
    endTime: "14:00",
    note: null,
  },
  {
    offset: 7,
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
  {
    offset: 1,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: 4,
    child: "seed-paul-koch",
    type: EventType.WORK,
    startTime: "08:00",
    endTime: "13:00",
    note: null,
  },
  {
    offset: 5,
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
      attendedOn: nthWeekdayAfter(2),
    },
    {
      workshopId: "seed-ws-deeskalation",
      profileId: byEmail["ben.weber@lebenshilfe.de"],
      attendedOn: nthWeekdayBefore(4),
    },
    {
      workshopId: "seed-ws-autismus",
      profileId: byEmail["clara.becker@lebenshilfe.de"],
      attendedOn: nthWeekdayAfter(4),
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
  await seedChildrenAndSchedules();
  await assignChildren(usersByEmail);
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
    `Events span ${dayOffset(-7).toISOString().slice(0, 10)} → ${dayOffset(7).toISOString().slice(0, 10)} (anchored to today).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
