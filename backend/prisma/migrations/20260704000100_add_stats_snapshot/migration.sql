-- CreateTable
CREATE TABLE "DeckDailyReviewLimit" (
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "dailyReviewLimit" INTEGER NOT NULL DEFAULT 100,

    PRIMARY KEY ("userId", "deckId"),
    CONSTRAINT "DeckDailyReviewLimit_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyStatsSnapshot" (
    "userId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "totalCards" INTEGER NOT NULL DEFAULT 0,
    "newCards" INTEGER NOT NULL DEFAULT 0,
    "learningCards" INTEGER NOT NULL DEFAULT 0,
    "reviewCards" INTEGER NOT NULL DEFAULT 0,
    "relearningCards" INTEGER NOT NULL DEFAULT 0,
    "dueCards" INTEGER NOT NULL DEFAULT 0,
    "startedCards" INTEGER NOT NULL DEFAULT 0,
    "masteredCards" INTEGER NOT NULL DEFAULT 0,
    "masteryRate" REAL NOT NULL DEFAULT 0,
    "favoritedCards" INTEGER NOT NULL DEFAULT 0,
    "todayNewLimit" INTEGER NOT NULL DEFAULT 0,
    "todayNewRemaining" INTEGER NOT NULL DEFAULT 0,
    "todayReviewLimit" INTEGER NOT NULL DEFAULT 0,
    "todayReviewRemaining" INTEGER NOT NULL DEFAULT 0,
    "todayStudiedCards" INTEGER NOT NULL DEFAULT 0,
    "todayReviewCount" INTEGER NOT NULL DEFAULT 0,
    "todayCorrectCount" INTEGER NOT NULL DEFAULT 0,
    "todayWrongCount" INTEGER NOT NULL DEFAULT 0,
    "correctRate" REAL,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("userId", "scopeType", "scopeId")
);

-- CreateIndex
CREATE INDEX "StudyStatsSnapshot_userId_scopeType_idx" ON "StudyStatsSnapshot"("userId", "scopeType");
