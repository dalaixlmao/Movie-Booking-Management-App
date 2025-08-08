-- CreateEnum
CREATE TYPE "SharedTicketStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "SharedTicket" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "sharedByUserId" INTEGER NOT NULL,
    "recipientUserId" INTEGER NOT NULL,
    "message" TEXT,
    "status" "SharedTicketStatus" NOT NULL DEFAULT 'PENDING',
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "SharedTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedSeat" (
    "id" SERIAL NOT NULL,
    "sharedTicketId" INTEGER NOT NULL,
    "seatId" INTEGER NOT NULL,

    CONSTRAINT "SharedSeat_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedTicket" ADD CONSTRAINT "SharedTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTicket" ADD CONSTRAINT "SharedTicket_sharedByUserId_fkey" FOREIGN KEY ("sharedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedTicket" ADD CONSTRAINT "SharedTicket_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSeat" ADD CONSTRAINT "SharedSeat_sharedTicketId_fkey" FOREIGN KEY ("sharedTicketId") REFERENCES "SharedTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedSeat" ADD CONSTRAINT "SharedSeat_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "Seat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX "SharedTicket_bookingId_idx" ON "SharedTicket"("bookingId");
CREATE INDEX "SharedTicket_sharedByUserId_idx" ON "SharedTicket"("sharedByUserId");
CREATE INDEX "SharedTicket_recipientUserId_idx" ON "SharedTicket"("recipientUserId");
CREATE INDEX "SharedTicket_status_idx" ON "SharedTicket"("status");
CREATE INDEX "SharedSeat_sharedTicketId_idx" ON "SharedSeat"("sharedTicketId");
CREATE INDEX "SharedSeat_seatId_idx" ON "SharedSeat"("seatId");