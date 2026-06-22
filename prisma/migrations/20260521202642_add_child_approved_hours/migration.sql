-- AlterTable
ALTER TABLE `child` ADD COLUMN `approvedDirectHours` DECIMAL(6, 2) NULL,
    ADD COLUMN `approvedIndirectHours` DECIMAL(6, 2) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
