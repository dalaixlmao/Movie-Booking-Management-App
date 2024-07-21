-- CreateTable
CREATE TABLE "Slots" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "slots" TIMESTAMP(3)[],
    "audiId" INTEGER NOT NULL,

    CONSTRAINT "Slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Slots" ADD CONSTRAINT "Slots_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slots" ADD CONSTRAINT "Slots_audiId_fkey" FOREIGN KEY ("audiId") REFERENCES "Audi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
