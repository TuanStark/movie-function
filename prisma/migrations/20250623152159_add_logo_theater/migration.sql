/*
  Warnings:

  - Added the required column `logo` to the `theaters` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "theaters" ADD COLUMN     "logo" TEXT NOT NULL;
