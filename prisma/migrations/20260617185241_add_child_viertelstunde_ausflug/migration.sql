-- AlterTable
ALTER TABLE `child` ADD COLUMN `vorviertelstunde` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nachviertelstunde` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `ausflugSchullandheim` BOOLEAN NOT NULL DEFAULT false,
    ALTER COLUMN `updatedAt` DROP DEFAULT;
