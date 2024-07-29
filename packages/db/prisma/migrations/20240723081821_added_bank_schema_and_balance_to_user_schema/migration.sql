/*
  Warnings:

  - You are about to drop the column `name` on the `Bank` table. All the data in the column will be lost.
  - You are about to drop the column `bankId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_bankId_fkey";

-- AlterTable
ALTER TABLE "Bank" DROP COLUMN "name",
ADD COLUMN     "balance" INTEGER NOT NULL DEFAULT 10000000;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bankId";
