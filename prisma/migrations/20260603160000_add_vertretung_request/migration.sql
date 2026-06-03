-- CreateTable
CREATE TABLE `vertretung_request` (
    `id` VARCHAR(191) NOT NULL,
    `reportedByUserId` VARCHAR(191) NOT NULL,
    `childNameText` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `signatureKey` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `suggestedChildId` VARCHAR(191) NULL,
    `matchScore` DOUBLE NULL,
    `resolvedChildId` VARCHAR(191) NULL,
    `resolvedByUserId` VARCHAR(191) NULL,
    `resolvedEventId` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vertretung_request_status_idx`(`status`),
    INDEX `vertretung_request_reportedByUserId_idx`(`reportedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vertretung_request` ADD CONSTRAINT `vertretung_request_reportedByUserId_fkey` FOREIGN KEY (`reportedByUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vertretung_request` ADD CONSTRAINT `vertretung_request_suggestedChildId_fkey` FOREIGN KEY (`suggestedChildId`) REFERENCES `child`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
