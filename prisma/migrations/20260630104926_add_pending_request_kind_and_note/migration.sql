-- AlterTable
ALTER TABLE `pending_vertretung_request` ADD COLUMN `kind` ENUM('VERTRETUNG', 'INDIRECT') NOT NULL DEFAULT 'VERTRETUNG',
    ADD COLUMN `note` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `pending_vertretung_request_kind_status_date_idx` ON `pending_vertretung_request`(`kind`, `status`, `date`);
