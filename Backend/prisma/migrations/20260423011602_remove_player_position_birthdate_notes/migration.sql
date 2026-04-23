/*
  Warnings:

  - You are about to drop the column `birth_date` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `players` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "birth_date",
DROP COLUMN "notes",
DROP COLUMN "position";
