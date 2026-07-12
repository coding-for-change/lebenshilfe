import { prisma } from "@/lib/prisma";

// Appends a consent decision. The log is append-only: a withdrawal is a new row
// with granted=false, never an update/delete, so the full history is preserved.
export async function recordConsentEvent(
  userId: string,
  type: string,
  granted: boolean,
) {
  return prisma.consentEvent.create({ data: { userId, type, granted } });
}

// Current consent for a (user, type) is the most recent event; none means no
// consent (default false).
export async function getLatestConsent(
  userId: string,
  type: string,
): Promise<boolean> {
  const latest = await prisma.consentEvent.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { granted: true },
  });
  return latest?.granted ?? false;
}
