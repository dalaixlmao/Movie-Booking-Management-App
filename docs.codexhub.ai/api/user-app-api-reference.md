# User App API Reference

This document provides a comprehensive reference for all API endpoints available in the user-app component of the Movie Booking App.

## Authentication Endpoints

### NextAuth Authentication

The user-app uses NextAuth.js for authentication. The authentication endpoints are automatically handled by NextAuth.

#### Base Path: `/api/auth/[...nextauth]`

#### Endpoints:

- `POST /api/auth/signin`: Sign in endpoint
- `POST /api/auth/signout`: Sign out endpoint
- `GET /api/auth/session`: Get current session information
- `GET /api/auth/csrf`: Get CSRF token
- `POST /api/auth/callback/:provider`: OAuth callback endpoint

#### Authentication Provider:

The app uses Credentials provider for authentication.

```typescript
// From /lib/auth.ts
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmit@next.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        // Sign in logic
        // ...
      },
    }),
  ],
  // ...
}
```

#### Authentication Flow:

1. **Sign Up**:
   - Validates email, password, name, and phone
   - Hashes password using bcrypt
   - Creates new user in database
   - Returns user ID for session

2. **Sign In**:
   - Validates email and password
   - Verifies password hash with bcrypt
   - Returns user ID for session

## Booking API Endpoints

### Get Movie Details

Retrieves details for a specific movie.

#### Endpoint: `GET /api/booking`

#### Request:

```json
{
  "id": 123
}
```

#### Response:

```json
{
  "movie": {
    "id": 123,
    "name": "Movie Title",
    "languages": ["English", "Hindi"],
    "certificate": "PG-13",
    "rating": "4.5",
    "dates": ["2025-08-01T12:00:00Z", "2025-08-02T14:00:00Z"],
    "poster": "movie-poster-url.jpg"
  },
  "message": "Fetched Movie!"
}
```

#### Error Response:

```json
{
  "message": "Movie not found",
  "error": "Error details"
}
```

### Get Cinema and Slot Details

Retrieves available cinemas and time slots for a movie on a specific date.

#### Endpoint: `POST /api/booking`

#### Request:

```json
{
  "movieId": 123,
  "currDate": "2025-08-01T00:00:00Z"
}
```

#### Response:

```json
{
  "cinema": [
    {
      "cinema": {
        "id": 1,
        "name": "PVR Cinema",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "timeSlots": [
        "2025-08-01T14:00:00Z",
        "2025-08-01T17:30:00Z",
        "2025-08-01T21:00:00Z"
      ]
    }
  ]
}
```

#### Implementation Details:

```typescript
// From /api/booking/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number(session.user.id);
  const c = await prisma.user.findUnique({
    where: { id: userId },
    select: { city: true },
  });
  const city = c?.city || "";

  const body = await req.json();
  const movieId = body.movieId;
  const currDate: string = body.currDate;
  const cd: Date = new Date(Date.parse(currDate));
  
  // Fetch slots for this movie in the user's city
  const slots = await prisma.slots.findMany({
    where: {
      movieId: movieId,
      audi: {
        cinema: {
          city: city,
        },
      },
    },
    select: {
      slots: true,
      audi: {
        select: {
          cinema: true,
        },
      },
      audiId: true,
    },
  });
  
  // Format and return results
  // ...
}
```

### Get Auditorium and Seat Information

Retrieves auditorium details and seat information for a specific cinema and time slot.

#### Endpoint: `POST /api/booking/slots`

#### Request:

```json
{
  "cinemaId": 1,
  "timeStamp": 1722700800000
}
```

#### Response:

```json
{
  "audi": {
    "id": 1,
    "name": "Audi 1",
    "rows": 8,
    "cols": 10,
    "seats": [
      {
        "id": 1,
        "row": 1,
        "col": 1,
        "audiId": 1,
        "booked": false,
        "bookingId": null,
        "price": 250
      },
      // ... more seats
    ]
  }
}
```

#### Implementation Details:

```typescript
// From /api/booking/slots/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const cinemaId = body.cinemaId;
  const timeStamp = body.timeStamp;
  const dateTime = new Date(timeStamp);
  
  const audi = await prisma.audi.findMany({
    where:{
      cinemaId: cinemaId,
      slots: {
        some: {
          slots: {
            has: dateTime
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      seats: true,
      rows: true,
      cols: true,
    }
  });

  return NextResponse.json({audi: audi[0]});
}
```

## Express Server API Endpoints

### Submit Booking Request

Adds a seat booking request to the Redis queue for processing.

#### Endpoint: `POST /` (Express Server)

#### Request:

```json
{
  "bookedSeats": [1, 2, 3],
  "userId": 123,
  "startTime": 1722700800000,
  "cinemaId": 1
}
```

#### Response (Success):

```json
{
  "message": "Booking seat request added to queue"
}
```

#### Response (Error):

```json
{
  "message": "Error in sending message to queue"
}
```

#### Implementation Details:

```typescript
// From express-server/src/index.ts
app.post('/', async (req, res) => {
  const bookedSeat = req.body.bookedSeats;
  const userId = req.body.userId;
  const startTime = req.body.startTime;
  const cinemaId = req.body.cinemaId;
  
  try {
    await client.lPush('bookedSeat', JSON.stringify({
      bookedSeat, 
      userId, 
      startTime, 
      cinemaId
    }));
    res.status(200).json({message:'Booking seat request added to queue'});
  }
  catch(e) {
    console.log('Redis pushing error');
    res.status(500).json({message:'Error in sending message to queue'});
  }
});
```

## Error Codes and Handling

| HTTP Status | Description | Possible Causes |
|-------------|-------------|----------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User does not have permission |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

### Common Error Messages:

- `"Invalid User Session"`: User authentication issue
- `"Insufficient Funds"`: User doesn't have enough balance for booking
- `"Seats X, Y, Z are already booked"`: One or more selected seats are unavailable
- `"Error in sending message to queue"`: Redis connection or operation failed

## Example: Complete Seat Booking Flow

### 1. Get available cinemas and time slots:

**Request:**
```http
POST /api/booking
Content-Type: application/json

{
  "movieId": 123,
  "currDate": "2025-08-01T00:00:00Z"
}
```

**Response:**
```json
{
  "cinema": [
    {
      "cinema": {
        "id": 1,
        "name": "PVR Cinema",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "timeSlots": ["2025-08-01T14:00:00Z", "2025-08-01T17:30:00Z"]
    }
  ]
}
```

### 2. Get auditorium and seat information:

**Request:**
```http
POST /api/booking/slots
Content-Type: application/json

{
  "cinemaId": 1,
  "timeStamp": 1722700800000
}
```

**Response:**
```json
{
  "audi": {
    "id": 1,
    "name": "Audi 1",
    "rows": 8,
    "cols": 10,
    "seats": [
      {
        "id": 1,
        "row": 1,
        "col": 1,
        "audiId": 1,
        "booked": false,
        "bookingId": null,
        "price": 250
      }
      // ... more seats
    ]
  }
}
```

### 3. Submit booking request:

**Request:**
```http
POST http://localhost:8080/
Content-Type: application/json

{
  "bookedSeats": [1, 2, 3],
  "userId": 123,
  "startTime": 1722700800000,
  "cinemaId": 1
}
```

**Response:**
```json
{
  "message": "Booking seat request added to queue"
}
```

The worker service will then process this booking request from the Redis queue, performing the necessary database operations and seat booking.