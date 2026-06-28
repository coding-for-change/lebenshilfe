-- CreateTable
CREATE TABLE `pool` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `kostentraegerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pool_schoolId_idx`(`schoolId`),
    INDEX `pool_kostentraegerId_idx`(`kostentraegerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `child` ADD COLUMN `poolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `poolId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `school_assistant_profile` ADD COLUMN `poolId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `child_poolId_idx` ON `child`(`poolId`);

-- CreateIndex
CREATE INDEX `event_poolId_date_idx` ON `event`(`poolId`, `date`);

-- CreateIndex
CREATE INDEX `school_assistant_profile_poolId_idx` ON `school_assistant_profile`(`poolId`);

-- AddForeignKey
ALTER TABLE `child` ADD CONSTRAINT `child_poolId_fkey` FOREIGN KEY (`poolId`) REFERENCES `pool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_poolId_fkey` FOREIGN KEY (`poolId`) REFERENCES `pool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_assistant_profile` ADD CONSTRAINT `school_assistant_profile_poolId_fkey` FOREIGN KEY (`poolId`) REFERENCES `pool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool` ADD CONSTRAINT `pool_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool` ADD CONSTRAINT `pool_kostentraegerId_fkey` FOREIGN KEY (`kostentraegerId`) REFERENCES `kostentraeger`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
