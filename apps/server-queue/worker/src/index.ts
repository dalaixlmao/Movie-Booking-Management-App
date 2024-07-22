import { createClient } from "redis";
import {PrismaClient} from '@repo/db';

const prisma = new PrismaClient();
const client = createClient();

client.on("error", (e) => {
  console.log("Worker error");
});

async function startTransaction(seats:any, amount:number){
    

}


async function applyBooking(bookedSeat: string) {
    const seatArr = JSON.parse(bookedSeat);
    const seats = seatArr.bookedSeat;
    let amount = 0;
    for(let i=0;i<seats.length;i++)
    {
        const seat = await prisma.seat.findUnique({
            where:{id:seats[i].id}
        })
        if(!seat)
            console.log('Database error');
        else
        amount+=seat.price;
    }
    
    
}

async function startWorker() {
  try {
    await client.connect();
    console.log("Redis worker Client connected");
    while (true) {
      try {
        const bookedSeats = await client.brPop("bookedSeats", 0);
        if(bookedSeats?.element)
        await applyBooking(bookedSeats.element);
      } catch (e) {
        console.log("cant get the elements from queue");
      }
    }
  } catch (e) {
    console.log("Error in connecting worker");
  }
}
