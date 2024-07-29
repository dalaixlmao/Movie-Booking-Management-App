import express from "express";
import { createClient } from "redis";
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const client = createClient();
client.on("error", (e) => {
  console.log("Redis client error:", e);
});

app.post('/', async (req, res)=>{
    const bookedSeat = req.body.bookedSeats;
    const userId = req.body.userId;
    const startTime = req.body.startTime;
    const cinemaId = req.body.cinemaId;
    try{
        await client.lPush('bookedSeat', JSON.stringify({bookedSeat, userId, startTime, cinemaId}));
        res.status(200).json({message:'Booking seat request added to queue'});
    }
    catch(e){
        console.log('Redis pushing error');
        res.status(500).json({message:'Error in sending message to queue'});
    }
})

async function startServer() {
  try {
    client.connect();
    console.log("Redis Client Connected");
    app.listen(8080, () => {
      console.log("Server running on port 8080");
    });
  } catch (e) {
    console.log("Error in starting the server: ", e);
  }
}

startServer();