import express from "express";
import { createClient } from "redis";
import cors from 'cors';

// Create Express app with middlewares
const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow configurable origins
  methods: ['POST'],
}));

// Initialize Redis client with connection options
const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff for reconnection attempts
      return Math.min(retries * 50, 3000); // Max 3 seconds between retries
    }
  }
});

// Redis error handling
client.on("error", (e) => {
  console.error("Redis client error:", e);
});

// Health check endpoint
app.get('/health', (_, res) => {
  const redisStatus = client.isReady ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'ok',
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});

/**
 * Booking endpoint - receives seat booking requests and adds them to Redis queue
 * Validates input data before processing
 */
app.post('/', async (req, res) => {
    // Extract and validate request data
    const { bookedSeats, userId, startTime, cinemaId } = req.body;
    
    // Input validation
    if (!bookedSeats || !Array.isArray(bookedSeats) || bookedSeats.length === 0) {
      return res.status(400).json({ error: 'Invalid or missing bookedSeats array' });
    }
    
    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ error: 'Invalid or missing userId' });
    }
    
    if (!startTime) {
      return res.status(400).json({ error: 'Invalid or missing startTime' });
    }
    
    if (!cinemaId || isNaN(Number(cinemaId))) {
      return res.status(400).json({ error: 'Invalid or missing cinemaId' });
    }
    
    try {
        // Check Redis connection status
        if (!client.isReady) {
          await client.connect();
        }
        
        // Add booking request to Redis queue
        await client.lPush('bookedSeat', JSON.stringify({
          bookedSeat: bookedSeats, 
          userId, 
          startTime, 
          cinemaId
        }));
        
        // Return success response
        res.status(200).json({
          success: true,
          message: 'Booking seat request added to queue',
          requestId: `booking-${Date.now()}` // For tracking/debugging
        });
    } catch (error) {
        console.error('Redis error during queue push:', error);
        res.status(503).json({
          success: false,
          error: 'Service temporarily unavailable',
          message: 'Unable to process booking request'
        });
    }
});

/**
 * Server startup with graceful error handling
 */
async function startServer() {
  try {
    // Connect to Redis
    await client.connect();
    console.log("Redis Client Connected");
    
    // Start Express server
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error("Error in starting the server:", error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown function
 */
async function shutdown() {
  console.log('Shutting down server...');
  try {
    await client.quit();
    console.log('Redis connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

startServer();