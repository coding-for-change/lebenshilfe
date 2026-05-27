-- Allow multiple time-block rows per (childId, date), mirroring how
-- ChildAssignment allows multiple blocks per (childId, weekday).
--
-- Create the regular index FIRST so the childId foreign key always has
-- a backing index, then drop the unique constraint.

CREATE INDEX `child_vertretung_childId_date_idx` ON `child_vertretung`(`childId`, `date`);

DROP INDEX `child_vertretung_childId_date_key` ON `child_vertretung`;
