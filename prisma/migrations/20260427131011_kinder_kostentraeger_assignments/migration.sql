-- AlterTable: add columns to child_assignment first so the new index can cover the FK on childId
ALTER TABLE `child_assignment`
    ADD COLUMN `weekday` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `startTime` VARCHAR(191) NOT NULL DEFAULT '08:00',
    ADD COLUMN `endTime` VARCHAR(191) NOT NULL DEFAULT '14:00',
    ADD COLUMN `tandem` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: add the compound (childId, weekday) index BEFORE dropping the old unique,
-- so the childId foreign key still has a covering index.
CREATE INDEX `child_assignment_childId_weekday_idx` ON `child_assignment`(`childId`, `weekday`);

-- DropIndex: now safe to drop the old unique
DROP INDEX `child_assignment_childId_userId_key` ON `child_assignment`;

-- AlterTable: extend child with admin/school metadata + Kostenträger FK
ALTER TABLE `child`
    ADD COLUMN `leosOne` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bescheid` TEXT NULL,
    ADD COLUMN `sbIb` VARCHAR(191) NULL,
    ADD COLUMN `schweigepflichtsentbindung` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `bemerkung` TEXT NULL,
    ADD COLUMN `schoolName` VARCHAR(191) NULL,
    ADD COLUMN `schoolAddress` VARCHAR(191) NULL,
    ADD COLUMN `schoolPlaceId` VARCHAR(191) NULL,
    ADD COLUMN `schoolLat` DECIMAL(10, 7) NULL,
    ADD COLUMN `schoolLng` DECIMAL(10, 7) NULL,
    ADD COLUMN `kostentraegerId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `child_kostentraegerId_idx` ON `child`(`kostentraegerId`);

-- CreateTable
CREATE TABLE `kostentraeger` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `child_absence` (
    `id` VARCHAR(191) NOT NULL,
    `childId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `child_absence_childId_date_idx`(`childId`, `date`),
    UNIQUE INDEX `child_absence_childId_date_key`(`childId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `child` ADD CONSTRAINT `child_kostentraegerId_fkey` FOREIGN KEY (`kostentraegerId`) REFERENCES `kostentraeger`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `child_absence` ADD CONSTRAINT `child_absence_childId_fkey` FOREIGN KEY (`childId`) REFERENCES `child`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
