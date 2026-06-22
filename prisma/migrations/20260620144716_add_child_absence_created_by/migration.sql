-- AlterTable
ALTER TABLE `child_absence` ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `child_absence` ADD CONSTRAINT `child_absence_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
