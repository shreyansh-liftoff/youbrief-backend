/*
  Warnings:

  - You are about to drop the column `audioDurations` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `audioUrls` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `summaries` on the `Video` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[url]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "audioDurations",
DROP COLUMN "audioUrls",
DROP COLUMN "duration",
DROP COLUMN "summaries";

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioUrl" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Summary_videoId_idx" ON "Summary"("videoId");

-- CreateIndex
CREATE INDEX "Summary_language_idx" ON "Summary"("language");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_videoId_language_key" ON "Summary"("videoId", "language");

-- CreateIndex
CREATE INDEX "AudioUrl_videoId_idx" ON "AudioUrl"("videoId");

-- CreateIndex
CREATE INDEX "AudioUrl_language_idx" ON "AudioUrl"("language");

-- CreateIndex
CREATE UNIQUE INDEX "AudioUrl_videoId_language_key" ON "AudioUrl"("videoId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "Video_url_key" ON "Video"("url");

-- CreateIndex
CREATE INDEX "Video_url_idx" ON "Video"("url");
