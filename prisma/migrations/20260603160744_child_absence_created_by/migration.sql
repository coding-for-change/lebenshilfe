-- AlterTable
ALTER TABLE `child_absence` ADD COLUMN `createdByUserId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `child_absence_createdByUserId_idx` ON `child_absence`(`createdByUserId`);

-- AddForeignKey
ALTER TABLE `child_absence` ADD CONSTRAINT `child_absence_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
