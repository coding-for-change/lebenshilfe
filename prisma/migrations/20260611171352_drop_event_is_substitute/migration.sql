-- AlterTable: drop the isSubstitute flag — the Einspringen flow is being
-- replaced by the dedicated Vertretung request feature, so the column is no
-- longer written or read by application code.
ALTER TABLE `event` DROP COLUMN `isSubstitute`;
