/*
  Warnings:

  - Added the required column `updatedAt` to the `Channel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('DM', 'GROUP');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "type" "ChannelType" NOT NULL DEFAULT 'GROUP',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;
