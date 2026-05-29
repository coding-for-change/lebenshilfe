-- Admins can create/edit work entries on behalf of a Schulbegleiter. We use
-- the signature to mark provenance: a non-null `signatureKey` means the entry
-- was signed by the Schulbegleiter, while NULL means it was created or edited
-- by an admin and is still awaiting the Schulbegleiter's confirmation.
ALTER TABLE `event` MODIFY `signatureKey` VARCHAR(191) NULL;

-- Soft delete. When an admin edits or removes a *signed* entry we keep the
-- original (deleted = true) for the audit/history view, while it disappears
-- from the Schulbegleiter's timesheet. Admin-created entries are hard deleted.
ALTER TABLE `event` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;
