-- AlterTable
ALTER TABLE `child` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `monthly_report` ADD COLUMN `signedSnapshot` JSON NULL;

-- CreateTable
CREATE TABLE `event_edit` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `editedByUserId` VARCHAR(191) NOT NULL,
    `editedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kind` ENUM('EDIT', 'DELETE') NOT NULL,
    `prevDate` DATE NULL,
    `prevStartTime` VARCHAR(191) NULL,
    `prevEndTime` VARCHAR(191) NULL,
    `prevNote` TEXT NULL,
    `prevChildId` VARCHAR(191) NULL,
    `nextDate` DATE NULL,
    `nextStartTime` VARCHAR(191) NULL,
    `nextEndTime` VARCHAR(191) NULL,
    `nextNote` TEXT NULL,
    `nextChildId` VARCHAR(191) NULL,

    INDEX `event_edit_eventId_editedAt_idx`(`eventId`, `editedAt`),
    INDEX `event_edit_editedByUserId_editedAt_idx`(`editedByUserId`, `editedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_edit` ADD CONSTRAINT `event_edit_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_edit` ADD CONSTRAINT `event_edit_editedByUserId_fkey` FOREIGN KEY (`editedByUserId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
