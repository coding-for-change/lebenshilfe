-- CreateTable
CREATE TABLE `school_assistant_profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('INVITATION_PENDING', 'ACCEPTED') NOT NULL DEFAULT 'INVITATION_PENDING',
    `leosOne` BOOLEAN NOT NULL DEFAULT false,
    `outlook` BOOLEAN NOT NULL DEFAULT false,
    `weeklyHours` DECIMAL(5, 2) NULL,
    `zvNeuNachBescheid` BOOLEAN NOT NULL DEFAULT false,
    `zvNeuNote` TEXT NULL,
    `introductionDay` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_assistant_profile_userId_key`(`userId`),
    UNIQUE INDEX `school_assistant_profile_email_key`(`email`),
    INDEX `school_assistant_profile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `workshop_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `workshopId` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `attendedOn` DATE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `workshop_attendance_profileId_idx`(`profileId`),
    UNIQUE INDEX `workshop_attendance_workshopId_profileId_key`(`workshopId`, `profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `school_assistant_profile` ADD CONSTRAINT `school_assistant_profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_attendance` ADD CONSTRAINT `workshop_attendance_workshopId_fkey` FOREIGN KEY (`workshopId`) REFERENCES `workshop`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workshop_attendance` ADD CONSTRAINT `workshop_attendance_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `school_assistant_profile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
