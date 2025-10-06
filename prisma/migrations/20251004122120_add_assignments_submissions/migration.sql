/*
  Warnings:

  - Changed the type of `type` on the `Resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('NOTE', 'VIDEO', 'ASSIGNMENT', 'HOMEWORK');

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "dueAt" TIMESTAMP(3),
ADD COLUMN     "points" INTEGER,
DROP COLUMN "type",
ADD COLUMN     "type" "ResourceType" NOT NULL;

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,
    "graded" BOOLEAN NOT NULL DEFAULT false,
    "grade" INTEGER,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceView" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_resourceId_studentId_key" ON "Submission"("resourceId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceView_resourceId_userId_key" ON "ResourceView"("resourceId", "userId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceView" ADD CONSTRAINT "ResourceView_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceView" ADD CONSTRAINT "ResourceView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
