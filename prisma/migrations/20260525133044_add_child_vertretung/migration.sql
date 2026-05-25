-- AlterTable
ALTER TABLE `child` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `child_vertretung` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `originalUserId` VARCHAR(191) NOT NULL,
    `substituteUserId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `child_vertretung_childId_date_idx`(`childId`, `date`),
    INDEX `child_vertretung_originalUserId_date_idx`(`originalUserId`, `date`),
    INDEX `child_vertretung_substituteUserId_date_idx`(`substituteUserId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `child_vertretung` ADD CONSTRAINT `child_vertretung_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `child_vertretung` ADD CONSTRAINT `child_vertretung_originalUserId_fkey` FOREIGN KEY (`originalUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `child_vertretung` ADD CONSTRAINT `child_vertretung_substituteUserId_fkey` FOREIGN KEY (`substituteUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
