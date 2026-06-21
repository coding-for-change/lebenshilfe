-- When an admin edits a *signed* event we soft-delete the original and create
-- a new (unsigned) replacement. This pointer lets `restore` undo the edit by
-- removing the replacement row alongside un-deleting the original.
ALTER TABLE `event` ADD COLUMN `replacesEventId` VARCHAR(191) NULL;

CREATE INDEX `event_replacesEventId_idx` ON `event`(`replacesEventId`);

ALTER TABLE `event` ADD CONSTRAINT `event_replacesEventId_fkey` FOREIGN KEY (`replacesEventId`) REFERENCES `event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
