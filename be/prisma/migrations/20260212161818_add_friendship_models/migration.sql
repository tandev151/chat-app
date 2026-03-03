-- CreateEnum
CREATE TYPE "FriendshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "FriendShipRequest" (
    "id" TEXT NOT NULL,
    "requestUserId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "FriendShipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendShipRequest_requestUserId_addresseeId_key" ON "FriendShipRequest"("requestUserId", "addresseeId");

-- AddForeignKey
ALTER TABLE "FriendShipRequest" ADD CONSTRAINT "FriendShipRequest_requestUserId_fkey" FOREIGN KEY ("requestUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendShipRequest" ADD CONSTRAINT "FriendShipRequest_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
