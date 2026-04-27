-- AlterTable: extend Role enum with OWNER
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN', 'SCHOOL_ASSISTANT', 'OWNER') NOT NULL DEFAULT 'SCHOOL_ASSISTANT';
ALTER TABLE `invitation` MODIFY `role` ENUM('ADMIN', 'SCHOOL_ASSISTANT', 'OWNER') NOT NULL DEFAULT 'SCHOOL_ASSISTANT';

-- Promote the oldest existing ADMIN to OWNER if no OWNER exists yet, so the
-- "always at least one owner" invariant holds from day one.
SET @existing_owner := (SELECT `id` FROM `user` WHERE `role` = 'OWNER' LIMIT 1);
SET @oldest_admin := (SELECT `id` FROM `user` WHERE `role` = 'ADMIN' ORDER BY `createdAt` ASC LIMIT 1);
UPDATE `user`
   SET `role` = 'OWNER'
 WHERE `id` = @oldest_admin
   AND @existing_owner IS NULL
   AND @oldest_admin IS NOT NULL;
