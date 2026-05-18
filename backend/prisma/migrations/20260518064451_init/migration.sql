-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'builtin',
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'qa',
    "number" INTEGER,
    "title" TEXT,
    "titleCn" TEXT,
    "question" TEXT,
    "answer" TEXT,
    "description" TEXT,
    "approach" TEXT,
    "difficulty" TEXT,
    "tags" TEXT,
    "subTopic" TEXT,
    "source" TEXT,
    "codes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Card_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CardProgress" (
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'new',
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "nextReview" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" DATETIME,
    "favorited" BOOLEAN NOT NULL DEFAULT false,
    "userNotes" TEXT,

    PRIMARY KEY ("userId", "cardId"),
    CONSTRAINT "CardProgress_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL,
    "rating" INTEGER NOT NULL,
    "stateBefore" TEXT NOT NULL,
    "stateAfter" TEXT NOT NULL,
    "intervalBefore" INTEGER NOT NULL,
    "intervalAfter" INTEGER NOT NULL,
    "easeBefore" REAL NOT NULL,
    "easeAfter" REAL NOT NULL,
    "elapsedDays" REAL NOT NULL,
    "scheduledDays" INTEGER NOT NULL,
    CONSTRAINT "ReviewLog_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeckDailyLimit" (
    "userId" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 20,

    PRIMARY KEY ("userId", "deckId"),
    CONSTRAINT "DeckDailyLimit_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
