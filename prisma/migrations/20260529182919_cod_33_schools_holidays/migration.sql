/*
  Warnings:

  - You are about to drop the column `schoolAddress` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `schoolLat` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `schoolLng` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `schoolName` on the `child` table. All the data in the column will be lost.
  - You are about to drop the column `schoolPlaceId` on the `child` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `child` DROP COLUMN `schoolAddress`,
    DROP COLUMN `schoolLat`,
    DROP COLUMN `schoolLng`,
    DROP COLUMN `schoolName`,
    DROP COLUMN `schoolPlaceId`,
    ADD COLUMN `schoolId` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- CreateTable
CREATE TABLE `school` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `placeId` VARCHAR(191) NULL,
    `lat` DECIMAL(10, 7) NULL,
    `lng` DECIMAL(10, 7) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `school_holiday` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `school_holiday_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `child_schoolId_idx` ON `child`(`schoolId`);

-- AddForeignKey
ALTER TABLE `child` ADD CONSTRAINT `child_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `school_holiday` ADD CONSTRAINT `school_holiday_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `school`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
