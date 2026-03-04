-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonSessionId" TEXT,
    "name" TEXT NOT NULL,
    "props" JSONB,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedImpression" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "postId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedImpression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "postId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareAttribution" (
    "id" TEXT NOT NULL,
    "tripId" TEXT,
    "postId" TEXT,
    "inviterId" TEXT,
    "channel" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "destination" TEXT,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_followerId_createdAt_idx" ON "Follow"("followerId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_followeeId_createdAt_idx" ON "Follow"("followeeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followeeId_key" ON "Follow"("followerId", "followeeId");

-- CreateIndex
CREATE INDEX "Block_blockerId_createdAt_idx" ON "Block"("blockerId", "createdAt");

-- CreateIndex
CREATE INDEX "Block_blockedId_createdAt_idx" ON "Block"("blockedId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");

-- CreateIndex
CREATE INDEX "Event_userId_createdAt_idx" ON "Event"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Event_anonSessionId_createdAt_idx" ON "Event"("anonSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "FeedImpression_postId_createdAt_idx" ON "FeedImpression"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedImpression_userId_createdAt_idx" ON "FeedImpression"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedImpression_sessionId_createdAt_idx" ON "FeedImpression"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedAction_postId_actionType_createdAt_idx" ON "FeedAction"("postId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "FeedAction_userId_createdAt_idx" ON "FeedAction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShareAttribution_token_key" ON "ShareAttribution"("token");

-- CreateIndex
CREATE INDEX "ShareAttribution_inviterId_createdAt_idx" ON "ShareAttribution"("inviterId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAttribution_tripId_createdAt_idx" ON "ShareAttribution"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAttribution_postId_createdAt_idx" ON "ShareAttribution"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareAttribution_channel_createdAt_idx" ON "ShareAttribution"("channel", "createdAt");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_anonSessionId_fkey" FOREIGN KEY ("anonSessionId") REFERENCES "AnonymousSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedImpression" ADD CONSTRAINT "FeedImpression_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAction" ADD CONSTRAINT "FeedAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedAction" ADD CONSTRAINT "FeedAction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAttribution" ADD CONSTRAINT "ShareAttribution_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAttribution" ADD CONSTRAINT "ShareAttribution_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareAttribution" ADD CONSTRAINT "ShareAttribution_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
