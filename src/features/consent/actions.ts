"use server";

import { requireAuth } from "@/lib/auth-guards";
import { ConsentFacade } from "./facade";

// Records the signed-in user's Google Maps consent decision against their
// account (demonstrable consent, Art. 7 DSGVO). requireAuth ties the record to
// the acting user and blocks anonymous callers.
export async function setMapsConsentAction(granted: boolean) {
  const user = await requireAuth();
  await ConsentFacade.recordMapsConsent(user.id, granted);
  return { success: true, granted };
}
