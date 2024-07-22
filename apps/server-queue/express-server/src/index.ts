import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const client = createClient();
client.on("error", (e) => {
  console.log("Redis client error:", e);
});

app.post('/', async (req, res)=>{
    const bookedSeat = req.body.bookedSeat;
    try{
        await client.lPush('bookedSeat', JSON.stringify({bookedSeat}));
        res.status(200).json({message:'Booking seat request added to queue'});
    }
    catch(e){
        console.log('Redis pushing error');
        res.status(500).json({message:'Eroor in sending message to queue'});
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