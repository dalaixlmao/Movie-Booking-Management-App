# API Schema Documentation

This document provides a comprehensive overview of the API schema used in the Movie Booking App, including request and response formats for all endpoints.

## API Endpoints Overview

The Movie Booking App exposes several API endpoints to support its functionality:

1. **Authentication APIs**: User registration, login, and session management
2. **Booking APIs**: Movie selection, cinema selection, and seat booking
3. **Express Server API**: Queue-based seat booking transaction processing

## Authentication API

### Base Path: `/api/auth/[...nextauth]`

NextAuth.js handles authentication routes. For detailed information, see the [Authentication Guide](./authentication-guide.md).

## Booking API

### Get Movie Details

Retrieves detailed information about a specific movie.

#### Endpoint: `GET /api/booking`

#### Request:

```json
{
  "id": 1
}
```

#### Response:

```json
{
  "movie": {
    "id": 1,
    "name": "Avengers: Endgame",
    "languages": ["English", "Hindi"],
    "certificate": "PG-13",
    "rating": "4.7",
    "dates": ["2025-08-01T12:00:00Z", "2025-08-02T14:00:00Z"],
    "poster": "https://example.com/poster.jpg"
  },
  "message": "Fetched Movie!"
}
```

#### Error Response:

```json
{
  "error": "Movie not found",
  "message": "The requested movie does not exist"
}
```

### Get Available Cinemas and Time Slots

Retrieves cinemas showing a specific movie on a specific date, along with available time slots.

#### Endpoint: `POST /api/booking`

#### Request:

```json
{
  "movieId": 1,
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
        "name": "PVR Cinemas",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "timeSlots": [
        "2025-08-01T10:00:00Z",
        "2025-08-01T13:00:00Z",
        "2025-08-01T16:00:00Z",
        "2025-08-01T19:00:00Z"
      ]
    },
    {
      "cinema": {
        "id": 2,
        "name": "INOX Cinemas",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "timeSlots": [
        "2025-08-01T11:00:00Z",
        "2025-08-01T14:00:00Z",
        "2025-08-01T17:00:00Z",
        "2025-08-01T20:00:00Z"
      ]
    }
  ]
}
```

#### Error Response:

```json
{
  "error": "Invalid data",
  "message": "Missing or invalid parameters"
}
```

### Get Auditorium and Seat Information

Retrieves details about an auditorium and its seats for a specific cinema and time slot.

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
    "rows": 10,
    "cols": 12,
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
      {
        "id": 2,
        "row": 1,
        "col": 2,
        "audiId": 1,
        "booked": true,
        "bookingId": 123,
        "price": 250
      }
      // ... more seats
    ]
  }
}
```

#### Error Response:

```json
{
  "error": "Auditorium not found",
  "message": "No auditorium found for the selected cinema and time slot"
}
```

## Express Server API

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

## Worker Service

The worker service does not expose public APIs but processes booking requests from the Redis queue. For internal documentation purposes, here is the data structure it expects:

### Queue Item Structure:

```json
{
  "bookedSeat": [1, 2, 3],
  "userId": 123,
  "startTime": 1722700800000,
  "cinemaId": 1
}
```

## Data Types

### Movie

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| name | String | Movie title |
| languages | String[] | Available languages |
| certificate | String | Age rating certificate (e.g., "PG-13") |
| rating | String | Movie rating (e.g., "4.5") |
| dates | DateTime[] | Available dates |
| poster | String? | URL to movie poster image |

### Cinema

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| name | String | Cinema name |
| city | String | City location |
| state | String | State location |
| zip | String | Postal code |

### Auditorium (Audi)

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| name | String | Auditorium name |
| rows | Integer | Number of rows |
| cols | Integer | Number of columns |
| cinemaId | Integer | Reference to cinema |

### Seat

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier |
| row | Integer | Row number |
| col | Integer | Column number |
| audiId | Integer | Reference to auditorium |
| booked | Boolean | Whether seat is booked |
| bookingId | Integer? | Reference to booking (if booked) |
| price | Integer | Price in smallest currency unit |

### Time Slot

| Field | Type | Description |
|-------|------|-------------|
| DateTime | ISO 8601 string | Start time of movie showing |

## Error Codes and Messages

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | INVALID_REQUEST | Invalid request parameters |
| 401 | UNAUTHORIZED | User not authenticated |
| 403 | FORBIDDEN | User not authorized for this operation |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., seat already booked) |
| 500 | SERVER_ERROR | Internal server error |

## Request Examples

### Booking Flow Example

#### 1. Get Movie Details:

```http
GET /api/booking
Content-Type: application/json

{
  "id": 1
}
```

#### 2. Get Cinemas and Time Slots:

```http
POST /api/booking
Content-Type: application/json

{
  "movieId": 1,
  "currDate": "2025-08-01T00:00:00Z"
}
```

#### 3. Get Auditorium and Seats:

```http
POST /api/booking/slots
Content-Type: application/json

{
  "cinemaId": 1,
  "timeStamp": 1722700800000
}
```

#### 4. Submit Booking:

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

## Response Examples

### Successful Booking Flow

#### 1. Get Movie Details Response:

```json
{
  "movie": {
    "id": 1,
    "name": "Avengers: Endgame",
    "languages": ["English", "Hindi"],
    "certificate": "PG-13",
    "rating": "4.7",
    "dates": ["2025-08-01T12:00:00Z", "2025-08-02T14:00:00Z"],
    "poster": "https://example.com/poster.jpg"
  },
  "message": "Fetched Movie!"
}
```

#### 2. Get Cinemas and Time Slots Response:

```json
{
  "cinema": [
    {
      "cinema": {
        "id": 1,
        "name": "PVR Cinemas",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "timeSlots": [
        "2025-08-01T10:00:00Z",
        "2025-08-01T13:00:00Z"
      ]
    }
  ]
}
```

#### 3. Get Auditorium and Seats Response:

```json
{
  "audi": {
    "id": 1,
    "name": "Audi 1",
    "rows": 10,
    "cols": 12,
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
      {
        "id": 2,
        "row": 1,
        "col": 2,
        "audiId": 1,
        "booked": false,
        "bookingId": null,
        "price": 250
      },
      {
        "id": 3,
        "row": 1,
        "col": 3,
        "audiId": 1,
        "booked": true,
        "bookingId": 456,
        "price": 250
      }
      // ... more seats
    ]
  }
}
```

#### 4. Submit Booking Response:

```json
{
  "message": "Booking seat request added to queue"
}
```

## Common Error Responses

### Authentication Error:

```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

### Invalid Parameters:

```json
{
  "error": "Bad Request",
  "message": "Invalid or missing parameters"
}
```

### Resource Not Found:

```json
{
  "error": "Not Found",
  "message": "The requested resource does not exist"
}
```

### Seat Already Booked:

```json
{
  "error": "Conflict",
  "message": "One or more selected seats are already booked"
}
```

### Insufficient Funds:

```json
{
  "error": "Payment Required",
  "message": "Insufficient funds to complete the booking"
}
```

## API Security Considerations

1. **Authentication**: All booking-related endpoints require user authentication via NextAuth.
2. **Input Validation**: All inputs should be validated to prevent injection attacks.
3. **Rate Limiting**: API endpoints should implement rate limiting to prevent abuse.
4. **HTTPS**: All API requests must be made over HTTPS in production.
5. **Error Handling**: Error responses should provide enough information for debugging without exposing sensitive details.

## API Versioning

Currently, the API does not use explicit versioning. Future versions will be implemented using URL path versioning (e.g., `/api/v2/booking`).