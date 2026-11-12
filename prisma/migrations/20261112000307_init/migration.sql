-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CURATOR', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Figure" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "era" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "avatarKey" TEXT NOT NULL,

    CONSTRAINT "Figure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FigureTheme" (
    "figureId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FigureTheme_pkey" PRIMARY KEY ("figureId","themeId")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "figureId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "publicDomainConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "searchVector" tsvector GENERATED ALWAYS AS (to_tsvector('english', "text")) STORED,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "figureId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "topicKeywords" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "searchVector" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', "topicKeywords"), 'A') || setweight(to_tsvector('english', "body"), 'B')) STORED,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerPassage" (
    "answerId" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnswerPassage_pkey" PRIMARY KEY ("answerId","passageId")
);

-- CreateTable
CREATE TABLE "Roundtable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "themeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roundtable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundtableAnswer" (
    "id" TEXT NOT NULL,
    "roundtableId" TEXT NOT NULL,
    "figureId" TEXT NOT NULL,
    "answerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "RoundtableAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flag" (
    "id" TEXT NOT NULL,
    "roundtableAnswerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,

    CONSTRAINT "Flag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLimit" (
    "role" "Role" NOT NULL,
    "dailyRoundtables" INTEGER NOT NULL,

    CONSTRAINT "UsageLimit_pkey" PRIMARY KEY ("role")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Figure_slug_key" ON "Figure"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Work_figureId_title_key" ON "Work"("figureId", "title");

-- CreateIndex
CREATE INDEX "Passage_searchVector_idx" ON "Passage" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "Answer_searchVector_idx" ON "Answer" USING GIN ("searchVector");

-- CreateIndex
CREATE UNIQUE INDEX "RoundtableAnswer_roundtableId_figureId_key" ON "RoundtableAnswer"("roundtableId", "figureId");

-- AddForeignKey
ALTER TABLE "FigureTheme" ADD CONSTRAINT "FigureTheme_figureId_fkey" FOREIGN KEY ("figureId") REFERENCES "Figure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FigureTheme" ADD CONSTRAINT "FigureTheme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work" ADD CONSTRAINT "Work_figureId_fkey" FOREIGN KEY ("figureId") REFERENCES "Figure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_figureId_fkey" FOREIGN KEY ("figureId") REFERENCES "Figure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerPassage" ADD CONSTRAINT "AnswerPassage_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerPassage" ADD CONSTRAINT "AnswerPassage_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roundtable" ADD CONSTRAINT "Roundtable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roundtable" ADD CONSTRAINT "Roundtable_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundtableAnswer" ADD CONSTRAINT "RoundtableAnswer_roundtableId_fkey" FOREIGN KEY ("roundtableId") REFERENCES "Roundtable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundtableAnswer" ADD CONSTRAINT "RoundtableAnswer_figureId_fkey" FOREIGN KEY ("figureId") REFERENCES "Figure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundtableAnswer" ADD CONSTRAINT "RoundtableAnswer_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_roundtableAnswerId_fkey" FOREIGN KEY ("roundtableAnswerId") REFERENCES "RoundtableAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flag" ADD CONSTRAINT "Flag_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
