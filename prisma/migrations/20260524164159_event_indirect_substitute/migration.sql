-- AlterTable: extend event with isSubstitute, plus add INDIRECT to the type enum
ALTER TABLE `event`
    MODIFY `type` ENUM('WORK', 'SICK', 'INDIRECT') NOT NULL,
    ADD COLUMN `isSubstitute` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: lookup events per child for the admin calendar/history view
CREATE INDEX `event_childId_date_idx` ON `event`(`childId`, `date`);
