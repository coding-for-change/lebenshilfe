-- AlterTable
ALTER TABLE `child` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `event` ADD COLUMN `modifiedByAdmin` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `signatureKey` VARCHAR(191) NULL;
