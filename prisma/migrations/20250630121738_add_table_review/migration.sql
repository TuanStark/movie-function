/*
  Warnings:

  - Added the required column `actors` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `movies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `writer` to the `movies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "actors" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL,
ADD COLUMN     "writer" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "movieReviews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movieReviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movieReviews_userId_movieId_key" ON "movieReviews"("userId", "movieId");

-- AddForeignKey
ALTER TABLE "movieReviews" ADD CONSTRAINT "movieReviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movieReviews" ADD CONSTRAINT "movieReviews_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
