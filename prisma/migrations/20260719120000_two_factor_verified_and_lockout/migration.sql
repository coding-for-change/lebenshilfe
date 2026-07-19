-- better-auth 1.6.x adds three fields to the twoFactor model. Without them,
-- every 2FA enroll/verify write throws `Unknown argument 'verified'` and 2FA
-- breaks. `verified` defaults to true so already-enrolled rows stay valid on
-- upgrade; failedVerificationCount/lockedUntil back the new 2FA lockout.

-- AlterTable
ALTER TABLE `two_factor` ADD COLUMN `verified` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `failedVerificationCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL;
