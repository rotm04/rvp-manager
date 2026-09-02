/*
  Warnings:

  - You are about to drop the column `gCode` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `gDescription` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `kkCode` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `kkDescription` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `ovuCode` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `ovuDescription` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `ptCode` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - You are about to drop the column `ptDescription` on the `CurriculumPlanItem` table. All the data in the column will be lost.
  - Added the required column `konec` to the `Lesson` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "OcekavanyVystup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "grade" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Gramotnost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "KlicovaKompetence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PrurezoveTema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CurriculumPlanItemToOcekavanyVystup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CurriculumPlanItemToOcekavanyVystup_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumPlanItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CurriculumPlanItemToOcekavanyVystup_B_fkey" FOREIGN KEY ("B") REFERENCES "OcekavanyVystup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CurriculumPlanItemToGramotnost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CurriculumPlanItemToGramotnost_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumPlanItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CurriculumPlanItemToGramotnost_B_fkey" FOREIGN KEY ("B") REFERENCES "Gramotnost" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CurriculumPlanItemToKlicovaKompetence" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CurriculumPlanItemToKlicovaKompetence_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumPlanItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CurriculumPlanItemToKlicovaKompetence_B_fkey" FOREIGN KEY ("B") REFERENCES "KlicovaKompetence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CurriculumPlanItemToPrurezoveTema" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CurriculumPlanItemToPrurezoveTema_A_fkey" FOREIGN KEY ("A") REFERENCES "CurriculumPlanItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CurriculumPlanItemToPrurezoveTema_B_fkey" FOREIGN KEY ("B") REFERENCES "PrurezoveTema" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CurriculumPlanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pocetHodin" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    CONSTRAINT "CurriculumPlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CurriculumPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CurriculumPlanItem" ("description", "id", "order", "planId", "topic") SELECT "description", "id", "order", "planId", "topic" FROM "CurriculumPlanItem";
DROP TABLE "CurriculumPlanItem";
ALTER TABLE "new_CurriculumPlanItem" RENAME TO "CurriculumPlanItem";
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "delkaTrvani" INTEGER NOT NULL DEFAULT 45,
    "konec" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ovuCode" TEXT NOT NULL,
    "ovuDescription" TEXT NOT NULL,
    "gCode" TEXT NOT NULL,
    "gDescription" TEXT NOT NULL,
    "kkCode" TEXT NOT NULL,
    "kkDescription" TEXT NOT NULL,
    "ptCode" TEXT NOT NULL,
    "ptDescription" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("classId", "createdAt", "date", "description", "gCode", "gDescription", "id", "kkCode", "kkDescription", "ovuCode", "ovuDescription", "ptCode", "ptDescription", "status", "topic") SELECT "classId", "createdAt", "date", "description", "gCode", "gDescription", "id", "kkCode", "kkDescription", "ovuCode", "ovuDescription", "ptCode", "ptDescription", "status", "topic" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxPoints" INTEGER,
    "maxGrade" TEXT,
    "filePlaceholder" TEXT,
    "datumZadani" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("classId", "createdAt", "description", "dueDate", "filePlaceholder", "id", "maxGrade", "maxPoints", "title") SELECT "classId", "createdAt", "description", "dueDate", "filePlaceholder", "id", "maxGrade", "maxPoints", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "OcekavanyVystup_code_key" ON "OcekavanyVystup"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Gramotnost_code_key" ON "Gramotnost"("code");

-- CreateIndex
CREATE UNIQUE INDEX "KlicovaKompetence_code_key" ON "KlicovaKompetence"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PrurezoveTema_code_key" ON "PrurezoveTema"("code");

-- CreateIndex
CREATE UNIQUE INDEX "_CurriculumPlanItemToOcekavanyVystup_AB_unique" ON "_CurriculumPlanItemToOcekavanyVystup"("A", "B");

-- CreateIndex
CREATE INDEX "_CurriculumPlanItemToOcekavanyVystup_B_index" ON "_CurriculumPlanItemToOcekavanyVystup"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurriculumPlanItemToGramotnost_AB_unique" ON "_CurriculumPlanItemToGramotnost"("A", "B");

-- CreateIndex
CREATE INDEX "_CurriculumPlanItemToGramotnost_B_index" ON "_CurriculumPlanItemToGramotnost"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurriculumPlanItemToKlicovaKompetence_AB_unique" ON "_CurriculumPlanItemToKlicovaKompetence"("A", "B");

-- CreateIndex
CREATE INDEX "_CurriculumPlanItemToKlicovaKompetence_B_index" ON "_CurriculumPlanItemToKlicovaKompetence"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CurriculumPlanItemToPrurezoveTema_AB_unique" ON "_CurriculumPlanItemToPrurezoveTema"("A", "B");

-- CreateIndex
CREATE INDEX "_CurriculumPlanItemToPrurezoveTema_B_index" ON "_CurriculumPlanItemToPrurezoveTema"("B");
