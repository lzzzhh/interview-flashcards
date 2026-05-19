-- CreateTable
CREATE TABLE "CardDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT,
    "deckId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'qa',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "tags" TEXT,
    "difficulty" TEXT,
    "subTopic" TEXT,
    "reason" TEXT,
    "qualityScore" REAL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT,
    "sourceType" TEXT NOT NULL,
    "parser" TEXT NOT NULL,
    "fullText" TEXT NOT NULL,
    "metadata" TEXT,
    "textHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SourceChunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "hash" TEXT NOT NULL,
    CONSTRAINT "SourceChunk_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceDocument" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPrepSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL DEFAULT 'awaiting_company',
    "company" TEXT,
    "role" TEXT,
    "location" TEXT,
    "targetDays" INTEGER,
    "dailyMinutes" INTEGER,
    "jdSource" TEXT,
    "jdText" TEXT,
    "jdSourceUrl" TEXT,
    "jobProfile" TEXT,
    "cardMatches" TEXT,
    "studyPlan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StudyQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL DEFAULT 'normal',
    "title" TEXT NOT NULL,
    "cardIds" TEXT NOT NULL,
    "planId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmbeddingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimension" INTEGER NOT NULL,
    "vectorStore" TEXT NOT NULL DEFAULT 'sqlite-vec',
    "vectorTable" TEXT NOT NULL,
    "vectorRowId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "textHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingRecord_objectType_objectId_model_key" ON "EmbeddingRecord"("objectType", "objectId", "model");
