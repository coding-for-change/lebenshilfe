import { getLatestConsent, recordConsentEvent } from "./services";
import { ConsentType } from "./schemas";

export const ConsentFacade = {
  async recordMapsConsent(userId: string, granted: boolean) {
    return recordConsentEvent(userId, ConsentType.GOOGLE_MAPS, granted);
  },

  async getMapsConsent(userId: string) {
    return getLatestConsent(userId, ConsentType.GOOGLE_MAPS);
  },
};
