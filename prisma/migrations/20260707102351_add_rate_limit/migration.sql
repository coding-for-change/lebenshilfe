-- CreateTable
CREATE TABLE `rate_limit` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NULL,
    `count` INTEGER NULL,
    `lastRequest` BIGINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
