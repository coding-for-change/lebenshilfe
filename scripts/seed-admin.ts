import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { Role } from "../src/generated/prisma";

async function seed() {
  const email = "admin@lebenshilfe.de";
  const password = "Lebenshilfe-Dev-2026!";

  console.log("Seeding database...");

  // Remove existing if rerunning
  await prisma.user.deleteMany({ where: { email } });
  await prisma.invitation.deleteMany({ where: { email } });

  console.log("1. Creating fake invitation to satisfy security hooks...");
  await prisma.invitation.create({
    data: {
      email,
      role: Role.ADMIN,
      token: "admin-seed-token",
      expiresAt: new Date(Date.now() + 86400000),
      isUsed: false,
    },
  });

  console.log("2. Routing sign-up through Better Auth directly...");
  const req = new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name: "System Admin" }),
  });

  const response = await auth.handler(req);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (response.status !== 200) {
    console.error(
      "Failed to seed admin. Status:",
      response.status,
      "Data:",
      data,
    );
    return;
  }

  console.log("3. Burning invitation token...");
  await prisma.invitation.update({
    where: { token: "admin-seed-token" },
    data: { isUsed: true },
  });

  console.log("===========================");
  console.log("Admin seeded successfully!");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log("===========================");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
