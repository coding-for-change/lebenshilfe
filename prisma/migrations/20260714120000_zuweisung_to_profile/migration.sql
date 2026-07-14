-- Repoint ChildAssignment (Zuweisung) from the auth User to the
-- SchoolAssistantProfile, so an assistant can be assigned to a child before
-- they accept their invitation (a profile exists from creation; a User only
-- exists after acceptance).

-- Add the new FK column, nullable for the backfill window.
ALTER TABLE `child_assignment` ADD COLUMN `profileId` VARCHAR(191) NULL;

-- Backfill: every existing assignment points at an accepted assistant, whose
-- profile is uniquely linked via SchoolAssistantProfile.userId.
UPDATE `child_assignment` `ca`
JOIN `school_assistant_profile` `p` ON `p`.`userId` = `ca`.`userId`
SET `ca`.`profileId` = `p`.`id`;

-- Safety net: drop any assignment that could not be matched to a profile
-- (would otherwise block the NOT NULL + FK below). None are expected.
DELETE FROM `child_assignment` WHERE `profileId` IS NULL;

-- Drop the old User FK, its index, and the column.
ALTER TABLE `child_assignment` DROP FOREIGN KEY `child_assignment_userId_fkey`;
DROP INDEX `child_assignment_userId_idx` ON `child_assignment`;
ALTER TABLE `child_assignment` DROP COLUMN `userId`;

-- Finalise the new column: NOT NULL, indexed, FK to the profile.
ALTER TABLE `child_assignment` MODIFY `profileId` VARCHAR(191) NOT NULL;
CREATE INDEX `child_assignment_profileId_idx` ON `child_assignment`(`profileId`);
ALTER TABLE `child_assignment` ADD CONSTRAINT `child_assignment_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `school_assistant_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
