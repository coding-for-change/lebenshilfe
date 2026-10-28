import { auth } from "../../src/lib/auth";
import { prisma } from "../../src/lib/prisma";
import {
  EventType,
  Role,
  SchulbegleiterStatus,
} from "../../src/generated/prisma";
import type { SeedDataset, SeedUser } from "./types";

// Inserts a SeedDataset. Everything that used to be hardcoded in scripts/seed.ts
// lives here; the datasets carry only content. Re-running is safe: wipe() removes
// exactly the rows this dataset owns (matched by its own ids and emails) and
// leaves anything else — notably a real person invited into the demo — alone.

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

/** The date n weekdays before today (n=1 → the most recent weekday). */
function nthWeekdayBefore(n: number): Date {
  let count = 0;
  let i = 0;
  while (count < n) {
    i -= 1;
    if (!isWeekend(dayOffset(i))) count += 1;
  }
  return dayOffset(i);
}

// Sign-up runs through Better Auth rather than a raw prisma.user.create so the
// password is hashed the same way a real registration hashes it — and so the
// invitation-required hook in src/lib/auth.ts is exercised instead of bypassed.
// That hook is why each user needs a throwaway invitation first.
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

async function wipe(d: SeedDataset) {
  console.log("Wiping previous seed data…");
  const emails = [...d.users.map((u) => u.email), d.pendingInvitation.email];
  const childIds = d.children.map((c) => c.id);
  const workshopIds = d.workshops.map((w) => w.id);

  await prisma.event.deleteMany({ where: { user: { email: { in: emails } } } });
  await prisma.monthlyReport.deleteMany({
    where: { user: { email: { in: emails } } },
  });
  await prisma.childAssignment.deleteMany({
    where: { profile: { email: { in: emails } } },
  });
  await prisma.childAbsence.deleteMany({
    where: { childId: { in: childIds } },
  });
  await prisma.childVertretung.deleteMany({
    where: { childId: { in: childIds } },
  });
  await prisma.schedule.deleteMany({ where: { childId: { in: childIds } } });
  await prisma.child.deleteMany({ where: { id: { in: childIds } } });
  await prisma.school.deleteMany({
    where: { id: { in: d.schools.map((s) => s.id) } },
  });
  // HolidayPlanEntry rows cascade when their plan is removed.
  await prisma.holidayPlan.deleteMany({
    where: { id: { in: d.holidayPlans.map((p) => p.id) } },
  });
  await prisma.kostentraeger.deleteMany({
    where: { id: { in: d.kostentraeger.map((k) => k.id) } },
  });
  await prisma.workshopAttendance.deleteMany({
    where: { workshop: { id: { in: workshopIds } } },
  });
  await prisma.workshop.deleteMany({ where: { id: { in: workshopIds } } });
  await prisma.schoolAssistantProfile.deleteMany({
    where: { email: { in: emails } },
  });
  await prisma.invitation.deleteMany({ where: { email: { in: emails } } });
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
}

/** Maps Schulbegleiter email → SchoolAssistantProfile id. */
async function profileIdsByEmail(emails: string[]) {
  const profiles = await prisma.schoolAssistantProfile.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  return Object.fromEntries(profiles.map((p) => [p.email, p.id]));
}

export async function runSeed(d: SeedDataset) {
  await wipe(d);

  console.log(`Creating users via Better Auth (${d.label})…`);
  for (const u of d.users) {
    console.log(`  • ${u.role.padEnd(18)} ${u.email}`);
    await createUserViaAuth(u);
  }

  const created = await prisma.user.findMany({
    where: { email: { in: d.users.map((u) => u.email) } },
    select: { id: true, email: true },
  });
  const userIds = Object.fromEntries(created.map((u) => [u.email, u.id]));

  console.log("Creating pending invitation (no user signed up yet)…");
  await prisma.schoolAssistantProfile.create({
    data: {
      email: d.pendingInvitation.email,
      name: d.pendingInvitation.name,
      status: SchulbegleiterStatus.INVITATION_PENDING,
      weeklyHours: d.pendingInvitation.weeklyHours,
    },
  });
  await prisma.invitation.create({
    data: {
      email: d.pendingInvitation.email,
      role: d.pendingInvitation.role,
      token: d.pendingInvitation.token,
      expiresAt: dayOffset(7),
      isUsed: false,
    },
  });

  console.log("Seeding Kostenträger…");
  for (const k of d.kostentraeger) {
    await prisma.kostentraeger.create({ data: k });
  }

  console.log("Seeding holiday plans & ranges…");
  for (const p of d.holidayPlans) {
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

  console.log("Seeding schools…");
  for (const s of d.schools) {
    await prisma.school.create({ data: s });
  }

  console.log("Seeding children & weekly schedules…");
  for (const c of d.children) {
    await prisma.child.create({ data: c });
    for (const block of d.childSchedules[c.id] ?? []) {
      await prisma.schedule.create({ data: { childId: c.id, ...block } });
    }
  }

  console.log("Assigning children to school assistants per weekday…");
  const profileIds = await profileIdsByEmail(
    d.assignments
      .map((a) => a.profileEmail)
      .concat(d.vertretungen.map((v) => v.substituteEmail))
      .concat(d.attendances.map((a) => a.profileEmail))
      .concat(Object.keys(d.profileDetails)),
  );
  for (const a of d.assignments) {
    const profileId = profileIds[a.profileEmail];
    if (!profileId) throw new Error(`No profile for ${a.profileEmail}`);
    await prisma.childAssignment.create({
      data: {
        childId: a.childId,
        profileId,
        weekday: a.weekday,
        startTime: a.startTime,
        endTime: a.endTime,
        tandem: a.tandem,
      },
    });
  }

  console.log("Seeding Vertretungen (substitute coverage)…");
  for (const v of d.vertretungen) {
    const date = nthWeekdayBefore(v.weekdaysAgo);
    // Copy the child's Stundenplan blocks for that weekday, exactly like
    // ChildrenFacade.createVertretung does. Mon=0..Sun=6.
    const weekday = (date.getUTCDay() + 6) % 7;
    const blocks = await prisma.schedule.findMany({
      where: { childId: v.childId, weekday },
      select: { startTime: true, endTime: true },
    });
    const timeBlocks =
      blocks.length > 0 ? blocks : [{ startTime: "08:00", endTime: "13:00" }];
    await prisma.childVertretung.createMany({
      data: timeBlocks.map((b) => ({
        childId: v.childId,
        substituteProfileId: profileIds[v.substituteEmail],
        date,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
    });
  }

  console.log("Seeding Krankheitstage for children…");
  for (const a of d.absences) {
    const date = dayOffset(a.offset);
    if (isWeekend(date)) continue;
    await prisma.childAbsence.create({
      data: { childId: a.childId, date, note: a.note },
    });
  }

  console.log("Enriching Schulbegleiter profiles with varied flags…");
  for (const [email, p] of Object.entries(d.profileDetails)) {
    await prisma.schoolAssistantProfile.update({
      where: { email },
      data: {
        leosOne: p.leosOne,
        outlook: p.outlook,
        weeklyHours: p.weeklyHours,
        introductionDay: nthWeekdayBefore(p.introductionDayWeekdaysAgo),
        zvNeuNachBescheid: p.zvNeuNachBescheid,
        ...(p.zvNeuNote ? { zvNeuNote: p.zvNeuNote } : {}),
      },
    });
  }

  console.log("Seeding events…");
  let events = 0;
  let earliestEvent = 0;
  for (const [email, plan] of Object.entries(d.eventPlans)) {
    const userId = userIds[email];
    if (!userId) throw new Error(`No user for ${email}`);
    for (const e of plan) {
      const date = dayOffset(e.offset);
      if (isWeekend(date)) continue;
      earliestEvent = Math.min(earliestEvent, e.offset);
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
      events += 1;
    }
  }

  if (d.autoEvents) {
    const { emails, fromOffset, toOffset } = d.autoEvents;
    earliestEvent = Math.min(earliestEvent, fromOffset);
    // Days the generated history must leave alone, so it never contradicts the
    // hand-written parts of the dataset.
    const absenceDays = new Set(
      d.absences.map(
        (a) => `${a.childId}@${dayOffset(a.offset).toISOString()}`,
      ),
    );
    const holidayDays = new Set<string>();
    for (const plan of d.holidayPlans) {
      for (const entry of plan.entries) {
        for (let o = entry.startOffset; o <= entry.endOffset; o += 1) {
          holidayDays.add(`${plan.id}@${dayOffset(o).toISOString()}`);
        }
      }
    }
    const holidayPlanBySchool = Object.fromEntries(
      d.schools.map((s) => [s.id, s.holidayPlanId]),
    );
    const planByChild = Object.fromEntries(
      d.children.map((c) => [
        c.id,
        c.schoolId ? holidayPlanBySchool[c.schoolId] : null,
      ]),
    );

    for (const email of emails) {
      const userId = userIds[email];
      if (!userId) throw new Error(`No user for ${email}`);
      const taken = new Set(
        (d.eventPlans[email] ?? []).map((e) =>
          dayOffset(e.offset).toISOString(),
        ),
      );
      const mine = d.assignments.filter((a) => a.profileEmail === email);

      for (let o = fromOffset; o <= toOffset; o += 1) {
        const date = dayOffset(o);
        if (isWeekend(date)) continue;
        if (taken.has(date.toISOString())) continue;

        const weekday = (date.getUTCDay() + 6) % 7;
        const assignment = mine.find((a) => a.weekday === weekday);
        if (!assignment) continue;
        if (absenceDays.has(`${assignment.childId}@${date.toISOString()}`))
          continue;
        const planId = planByChild[assignment.childId];
        if (planId && holidayDays.has(`${planId}@${date.toISOString()}`))
          continue;

        await prisma.event.create({
          data: {
            userId,
            childId: assignment.childId,
            type: EventType.WORK,
            date,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            note: null,
            signatureKey: `seed/signatures/${userId}-${date.toISOString().slice(0, 10)}.png`,
          },
        });
        events += 1;
      }
    }
  }

  console.log(`  → ${events} events`);

  console.log("Seeding monthly reports for the previous month…");
  const previousMonth = new Date(TODAY);
  previousMonth.setUTCDate(1);
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1);
  const year = previousMonth.getUTCFullYear();
  const month = previousMonth.getUTCMonth() + 1;
  for (const email of d.monthlyReports.emails) {
    const userId = userIds[email];
    await prisma.monthlyReport.create({
      data: {
        userId,
        year,
        month,
        supervisorName: d.monthlyReports.supervisorName,
        supervisorSignatureKey: `seed/signatures/supervisor-${userId}-${year}-${month}.png`,
      },
    });
  }

  console.log("Seeding workshops & attendances…");
  for (const w of d.workshops) {
    await prisma.workshop.create({ data: w });
  }
  for (const a of d.attendances) {
    await prisma.workshopAttendance.create({
      data: {
        workshopId: a.workshopId,
        profileId: profileIds[a.profileEmail],
        attendedOn: nthWeekdayBefore(a.weekdaysAgo),
      },
    });
  }

  console.log(`\n=========== SEED COMPLETE (${d.label}) ===========`);
  for (const u of d.users) {
    console.log(`${u.role.padEnd(18)} ${u.email.padEnd(38)} pw: ${u.password}`);
  }
  console.log(
    `PENDING (no login)  ${d.pendingInvitation.email.padEnd(38)} (invitation only)`,
  );
  console.log(
    `Events span ${dayOffset(earliestEvent).toISOString().slice(0, 10)} → ${TODAY.toISOString().slice(0, 10)} (past through today; no future entries).`,
  );
}

export async function seedMain(dataset: SeedDataset) {
  try {
    await runSeed(dataset);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
