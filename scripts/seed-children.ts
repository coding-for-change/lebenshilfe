import { prisma } from "../src/lib/prisma";

/**
 * Seed one or more children and assign them to a Schulbegleiter (by email).
 *
 * Usage:
 *   npx tsx scripts/seed-children.ts <schulbegleiter-email> [--schedules]
 *
 * By default seeds two children: "Lena Fischer" and "Max Huber".
 * With --schedules, also adds a simple weekly schedule for each.
 */
async function run() {
  const email = process.argv[2];
  const withSchedules = process.argv.includes("--schedules");

  if (!email) {
    console.error(
      "Usage: npx tsx scripts/seed-children.ts <schulbegleiter-email> [--schedules]",
    );
    process.exit(1);
  }

  const profile = await prisma.schoolAssistantProfile.findUnique({
    where: { email },
  });
  if (!profile) {
    console.error(`No Schulbegleiter profile found with email ${email}`);
    process.exit(1);
  }

  const children = [
    { firstName: "Lena", lastName: "Fischer" },
    { firstName: "Max", lastName: "Huber" },
  ];

  for (const c of children) {
    const child = await prisma.child.upsert({
      where: {
        id: `seed-${c.firstName.toLowerCase()}-${c.lastName.toLowerCase()}`,
      },
      update: {},
      create: {
        id: `seed-${c.firstName.toLowerCase()}-${c.lastName.toLowerCase()}`,
        firstName: c.firstName,
        lastName: c.lastName,
      },
    });

    const existingAssignment = await prisma.childAssignment.findFirst({
      where: { childId: child.id, profileId: profile.id },
    });
    if (!existingAssignment) {
      await prisma.childAssignment.create({
        data: { childId: child.id, profileId: profile.id },
      });
    }
    console.log(
      `  assigned ${child.firstName} ${child.lastName} → ${profile.email}`,
    );

    if (withSchedules) {
      for (let wd = 0; wd < 5; wd++) {
        await prisma.schedule.create({
          data: {
            childId: child.id,
            weekday: wd,
            startTime: c.firstName === "Lena" ? "08:00" : "09:00",
            endTime: c.firstName === "Lena" ? "13:00" : "14:30",
          },
        });
      }
      console.log(`  added Mon–Fri schedule for ${child.firstName}`);
    }
  }

  console.log("Done.");
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
