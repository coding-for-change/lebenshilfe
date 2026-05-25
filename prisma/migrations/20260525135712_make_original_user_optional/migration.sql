-- DropForeignKey
ALTER TABLE `child_vertretung` DROP FOREIGN KEY `child_vertretung_originalUserId_fkey`;

-- AlterTable
ALTER TABLE `child_vertretung` MODIFY `originalUserId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `child_vertretung` ADD CONSTRAINT `child_vertretung_originalUserId_fkey` FOREIGN KEY (`originalUserId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
