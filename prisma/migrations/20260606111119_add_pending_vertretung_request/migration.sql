-- CreateTable
CREATE TABLE `pending_vertretung_request` (
    `id` VARCHAR(191) NOT NULL,
    `substituteUserId` VARCHAR(191) NOT NULL,
    `childNameText` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `signatureKey` VARCHAR(191) NOT NULL,
    `matchedChildId` VARCHAR(191) NULL,
    `matchConfidence` DOUBLE NULL,
    `status` ENUM('PENDING', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `resolvedChildId` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pending_vertretung_request_substituteUserId_status_idx`(`substituteUserId`, `status`),
    INDEX `pending_vertretung_request_status_date_idx`(`status`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pending_vertretung_request` ADD CONSTRAINT `pending_vertretung_request_substituteUserId_fkey` FOREIGN KEY (`substituteUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pending_vertretung_request` ADD CONSTRAINT `pending_vertretung_request_resolvedChildId_fkey` FOREIGN KEY (`resolvedChildId`) REFERENCES `child`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pending_vertretung_request` ADD CONSTRAINT `pending_vertretung_request_resolvedByUserId_fkey` FOREIGN KEY (`resolvedByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
