/*
  Warnings:

  - You are about to drop the `school_holiday` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `school_holiday` DROP FOREIGN KEY `school_holiday_schoolId_fkey`;

-- AlterTable
ALTER TABLE `school` ADD COLUMN `holidayPlanId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `school_holiday`;

-- CreateTable
CREATE TABLE `holiday_plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holiday_plan_entry` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `holiday_plan_entry_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `school_holidayPlanId_idx` ON `school`(`holidayPlanId`);

-- AddForeignKey
ALTER TABLE `school` ADD CONSTRAINT `school_holidayPlanId_fkey` FOREIGN KEY (`holidayPlanId`) REFERENCES `holiday_plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `holiday_plan_entry` ADD CONSTRAINT `holiday_plan_entry_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `holiday_plan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
