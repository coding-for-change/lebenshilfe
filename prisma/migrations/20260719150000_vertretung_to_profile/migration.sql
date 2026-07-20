-- Repoint ChildVertretung (Vertretung) from the auth User to the
-- SchoolAssistantProfile, mirroring the ChildAssignment change. A Vertretung is
-- a per-date plan of WHO substitutes; modelling it on the profile (which exists
-- from creation) lets an admin schedule a substitute before they accept their
-- invitation, consistent with how Zuweisungen already work.

-- Add the new FK column, nullable for the backfill window.
ALTER TABLE `child_vertretung` ADD COLUMN `substituteProfileId` VARCHAR(191) NULL;

-- Backfill: every existing Vertretung points at a registered assistant (whether
-- created by an admin from the accepted-only dropdown or self-submitted by a
-- logged-in Schulbegleiter), whose profile is uniquely linked via
-- SchoolAssistantProfile.userId.
UPDATE `child_vertretung` `cv`
JOIN `school_assistant_profile` `p` ON `p`.`userId` = `cv`.`substituteUserId`
SET `cv`.`substituteProfileId` = `p`.`id`;

-- Safety net: drop any Vertretung that could not be matched to a profile
-- (would otherwise block the NOT NULL + FK below). None are expected.
DELETE FROM `child_vertretung` WHERE `substituteProfileId` IS NULL;

-- Drop the old User FK, its index, and the column.
ALTER TABLE `child_vertretung` DROP FOREIGN KEY `child_vertretung_substituteUserId_fkey`;
DROP INDEX `child_vertretung_substituteUserId_date_idx` ON `child_vertretung`;
ALTER TABLE `child_vertretung` DROP COLUMN `substituteUserId`;

-- Finalise the new column: NOT NULL, indexed, FK to the profile.
ALTER TABLE `child_vertretung` MODIFY `substituteProfileId` VARCHAR(191) NOT NULL;
CREATE INDEX `child_vertretung_substituteProfileId_date_idx` ON `child_vertretung`(`substituteProfileId`, `date`);
ALTER TABLE `child_vertretung` ADD CONSTRAINT `child_vertretung_substituteProfileId_fkey` FOREIGN KEY (`substituteProfileId`) REFERENCES `school_assistant_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
