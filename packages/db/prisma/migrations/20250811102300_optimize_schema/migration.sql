-- Add indexes to improve query performance
CREATE INDEX "Seat_audiId_booked_idx" ON "Seat"("audiId", "booked");
CREATE INDEX "Booking_userId_startTime_idx" ON "Booking"("userId", "startTime");
CREATE INDEX "Slots_movieId_idx" ON "Slots"("movieId");
CREATE INDEX "Slots_audiId_idx" ON "Slots"("audiId");

-- Add transaction history table
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bookingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- Add refund status to booking
ALTER TABLE "Booking" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE "Booking" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add constraints
ALTER TABLE "Seat" ADD CONSTRAINT "seat_row_col_audi_unique" UNIQUE ("row", "col", "audiId");
ALTER TABLE "User" ADD CONSTRAINT "balance_check" CHECK ("balance" >= 0);
ALTER TABLE "Bank" ADD CONSTRAINT "balance_check" CHECK ("balance" >= 0);

-- Add necessary foreign keys
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" 
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create trigger to update timestamp on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_updated_at BEFORE UPDATE
ON "Booking" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_transaction_updated_at BEFORE UPDATE
ON "Transaction" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();