# Ticket Sharing Feature Documentation

## Overview

The ticket sharing feature allows users to share movie tickets with other registered users. This document provides a comprehensive guide to the sharing feature's implementation, API endpoints, and usage.

## Feature Highlights

- Share one or multiple seats from a booking with another user
- Recipients can accept or decline shared tickets
- Automatic expiration for unresponded shared tickets
- Notification system for both sender and recipient
- Full ticket details transfer upon acceptance

## Database Schema

The ticket sharing feature introduces the following tables to the database schema:

### SharedTicket

Represents a ticket sharing transaction between users.

```prisma
enum SharedTicketStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

model SharedTicket {
  id Int @id @default(autoincrement())
  bookingId Int
  booking Booking @relation(fields: [bookingId], references: [id])
  sharedByUserId Int
  sharedByUser User @relation("SentBy", fields: [sharedByUserId], references: [id])
  recipientUserId Int
  recipientUser User @relation("ReceivedBy", fields: [recipientUserId], references: [id])
  message String?
  status SharedTicketStatus @default(PENDING)
  sharedAt DateTime @default(now())
  expiresAt DateTime
  respondedAt DateTime?
  sharedSeats SharedSeat[]
}
```

### SharedSeat

Links individual seats to a shared ticket transaction.

```prisma
model SharedSeat {
  id Int @id @default(autoincrement())
  sharedTicketId Int
  sharedTicket SharedTicket @relation(fields: [sharedTicketId], references: [id], onDelete: Cascade)
  seatId Int
  seat Seat @relation(fields: [seatId], references: [id])
}
```

## API Endpoints

### RESTful API

#### Share a Ticket

Allows a user to share one or more seats from their booking with another user.

**Endpoint:** `POST /api/tickets/share`

**Request Body:**
```json
{
  "bookingId": 123,
  "recipientUserId": 456,
  "seats": [1, 2],
  "message": "Here's a ticket for the movie tonight!"
}
```

**Response (200 OK):**
```json
{
  "sharedTicket": {
    "id": 1,
    "booking": {
      "id": 123,
      "cinema": {
        "id": 1,
        "name": "PVR Cinema"
      },
      "startTime": "2025-08-10T14:30:00Z"
    },
    "seats": [
      {
        "id": 1,
        "row": 1,
        "col": 1,
        "price": 250
      },
      {
        "id": 2,
        "row": 1,
        "col": 2,
        "price": 250
      }
    ],
    "sharedByUserId": 123,
    "sharedByUserName": "John Doe",
    "recipientUserId": 456,
    "recipientUserName": "Jane Smith",
    "message": "Here's a ticket for the movie tonight!",
    "status": "PENDING",
    "sharedAt": "2025-08-08T10:30:00Z",
    "expiresAt": "2025-08-10T14:30:00Z"
  },
  "message": "Ticket shared successfully"
}
```

#### Get Shared Tickets

Retrieves all tickets shared with the current user.

**Endpoint:** `GET /api/tickets/shared`

**Response (200 OK):**
```json
{
  "sharedTickets": [
    {
      "id": 1,
      "booking": {
        "id": 123,
        "cinema": {
          "id": 1,
          "name": "PVR Cinema"
        },
        "startTime": "2025-08-10T14:30:00Z",
        "movieDetails": {
          "id": 1,
          "name": "The Avengers",
          "poster": "https://example.com/poster.jpg"
        }
      },
      "seats": [
        {
          "id": 1,
          "row": 1,
          "col": 1,
          "price": 250
        },
        {
          "id": 2,
          "row": 1,
          "col": 2,
          "price": 250
        }
      ],
      "sharedByUserId": 123,
      "sharedByUserName": "John Doe",
      "recipientUserId": 456,
      "recipientUserName": "Jane Smith",
      "message": "Here's a ticket for the movie tonight!",
      "status": "PENDING",
      "sharedAt": "2025-08-08T10:30:00Z",
      "expiresAt": "2025-08-10T14:30:00Z"
    }
  ]
}
```

#### Accept Shared Ticket

Allows a recipient to accept a shared ticket.

**Endpoint:** `POST /api/tickets/shared/{sharedTicketId}/accept`

**Response (200 OK):**
```json
{
  "id": 1,
  "booking": {
    "id": 123,
    "cinema": {
      "id": 1,
      "name": "PVR Cinema"
    },
    "startTime": "2025-08-10T14:30:00Z"
  },
  "seats": [
    {
      "id": 1,
      "row": 1,
      "col": 1,
      "price": 250
    },
    {
      "id": 2,
      "row": 1,
      "col": 2,
      "price": 250
    }
  ],
  "sharedByUserId": 123,
  "sharedByUserName": "John Doe",
  "recipientUserId": 456,
  "recipientUserName": "Jane Smith",
  "message": "Here's a ticket for the movie tonight!",
  "status": "ACCEPTED",
  "sharedAt": "2025-08-08T10:30:00Z",
  "expiresAt": "2025-08-10T14:30:00Z",
  "respondedAt": "2025-08-08T11:15:00Z"
}
```

#### Decline Shared Ticket

Allows a recipient to decline a shared ticket.

**Endpoint:** `POST /api/tickets/shared/{sharedTicketId}/decline`

**Response (200 OK):**
```json
{
  "message": "Ticket declined successfully"
}
```

#### Search Users

Search for users to share tickets with.

**Endpoint:** `GET /api/users/search?query={search_term}`

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 456,
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    },
    {
      "id": 789,
      "name": "James Smith",
      "email": "james.smith@example.com"
    }
  ]
}
```

### GraphQL API

#### Share a Ticket

```graphql
mutation ShareTicket($input: TicketShareInput!) {
  shareTicket(input: $input) {
    sharedTicket {
      id
      booking {
        id
        cinema {
          name
        }
        startTime
      }
      seats {
        id
        row
        col
        price
      }
      sharedByUserId
      sharedByUserName
      recipientUserId
      recipientUserName
      message
      status
      sharedAt
      expiresAt
    }
    message
  }
}
```

Variables:
```json
{
  "input": {
    "bookingId": 123,
    "recipientUserId": 456,
    "seats": [1, 2],
    "message": "Here's a ticket for the movie tonight!"
  }
}
```

#### Get Shared Tickets

```graphql
query GetSharedTickets {
  sharedTickets {
    id
    booking {
      id
      cinema {
        name
      }
      startTime
      movieDetails {
        name
        poster
      }
    }
    seats {
      id
      row
      col
      price
    }
    sharedByUserId
    sharedByUserName
    recipientUserId
    recipientUserName
    message
    status
    sharedAt
    expiresAt
    respondedAt
  }
}
```

#### Accept Shared Ticket

```graphql
mutation AcceptSharedTicket($sharedTicketId: ID!) {
  acceptSharedTicket(sharedTicketId: $sharedTicketId) {
    id
    status
    respondedAt
  }
}
```

Variables:
```json
{
  "sharedTicketId": 1
}
```

#### Decline Shared Ticket

```graphql
mutation DeclineSharedTicket($sharedTicketId: ID!) {
  declineSharedTicket(sharedTicketId: $sharedTicketId)
}
```

Variables:
```json
{
  "sharedTicketId": 1
}
```

#### Search Users

```graphql
query SearchUsers($input: UserSearchInput!) {
  searchUsers(input: $input) {
    id
    name
    email
  }
}
```

Variables:
```json
{
  "input": {
    "query": "Smith"
  }
}
```

## Business Rules

1. **Ownership Validation**: Users can only share tickets they own (userId must match the booking's userId).

2. **Seat Validation**: Users can only share seats that belong to their booking.

3. **Expiration Logic**: Shared tickets automatically expire at the movie start time.

4. **Status Transitions**:
   - PENDING → ACCEPTED: Recipient accepts the shared ticket
   - PENDING → DECLINED: Recipient declines the shared ticket
   - PENDING → EXPIRED: Ticket reaches expiration time

5. **Seat Ownership Transfer**: When a recipient accepts a ticket, the seats are reassigned to them in the system (the bookingId remains the same, but the system recognizes the recipient as an authorized user for those seats).

6. **Validation Before Acceptance**:
   - Shared ticket must be in PENDING status
   - Current time must be before expiresAt

7. **User Search Limitations**:
   - Search queries must be at least 2 characters
   - Results are limited to 10 users
   - Users cannot share tickets with themselves

## Implementation Guidelines

### Backend Implementation

1. **Transaction Safety**: Implement database transactions when updating ticket status to ensure data consistency.

```typescript
await prisma.$transaction(async (tx) => {
  // Update shared ticket status
  const updatedTicket = await tx.sharedTicket.update({
    where: { id: sharedTicketId },
    data: {
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
    include: { sharedSeats: true },
  });
  
  // Handle seat transfers and other operations
});
```

2. **Security Checks**: Always verify user permissions before operations.

```typescript
// Verify the recipient is the current user
if (sharedTicket.recipientUserId !== currentUserId) {
  throw new Error("You are not authorized to accept this ticket");
}

// Verify ticket status
if (sharedTicket.status !== "PENDING") {
  throw new Error("This ticket cannot be accepted");
}

// Check expiration
if (new Date() > new Date(sharedTicket.expiresAt)) {
  throw new Error("This shared ticket has expired");
}
```

3. **Error Handling**: Use appropriate HTTP status codes for errors.

| Scenario | Status Code | Message |
|----------|-------------|---------|
| Invalid ticket ID | 404 | "Shared ticket not found" |
| Not authorized | 403 | "You are not authorized to perform this action" |
| Already accepted/declined | 409 | "This ticket has already been {status}" |
| Expired | 410 | "This shared ticket has expired" |
| Server error | 500 | "An error occurred while processing your request" |

### Frontend Implementation

1. **Ticket Sharing UI**:
   - User search field with autocomplete
   - Seat selection interface for shared tickets
   - Optional message field
   - Clear confirmation before sharing

2. **Shared Tickets Dashboard**:
   - List of received shared tickets
   - Clear visual status indicators
   - Accept/Decline buttons
   - Expiration countdown
   - Movie and showtime details

3. **Notifications**:
   - Real-time notification when receiving a shared ticket
   - Email notification option
   - Status update notifications

## Testing Guidelines

1. **Unit Tests**:
   - Verify permission checks
   - Test status transitions
   - Validate expiration logic

2. **Integration Tests**:
   - Test complete share-accept flow
   - Test share-decline flow
   - Test automatic expiration

3. **Edge Cases to Test**:
   - Sharing tickets close to showtime
   - Multiple shares of the same seats
   - Sharing with invalid user IDs
   - Accepting expired tickets

## Scalability Considerations

1. **Indexing**: Key database fields are indexed for performance:
   - SharedTicket.bookingId
   - SharedTicket.sharedByUserId
   - SharedTicket.recipientUserId
   - SharedTicket.status
   - SharedSeat.sharedTicketId
   - SharedSeat.seatId

2. **Expiration Handling**: A background job should run periodically to mark expired shared tickets:

```typescript
// Sample background job for expiring tickets
async function expireSharedTickets() {
  const now = new Date();
  
  await prisma.sharedTicket.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });
}
```

3. **Caching**: Implement caching for frequently accessed data:
   - User search results
   - Shared ticket listings
   - Booking details

## Security Considerations

1. **Authorization**: Always verify that users can only:
   - Share tickets they own
   - Accept/decline tickets shared with them
   - View their own shared tickets

2. **Rate Limiting**: Implement rate limiting for user search and ticket sharing endpoints to prevent abuse.

3. **Data Validation**: Thoroughly validate all input data to prevent injection attacks or data corruption.

## Example User Flows

### Sharing a Ticket

1. User navigates to "My Bookings"
2. User selects a booking and clicks "Share Tickets"
3. User selects seats to share
4. User searches for and selects a recipient
5. User adds optional message and confirms sharing
6. System creates SharedTicket record with PENDING status
7. Recipient receives notification

### Accepting a Shared Ticket

1. Recipient receives notification of shared ticket
2. Recipient views shared ticket details
3. Recipient clicks "Accept"
4. System updates ticket status to ACCEPTED
5. Seats are logically transferred to recipient
6. Both users receive confirmation

## Monitoring and Metrics

Track the following metrics to evaluate feature usage and performance:

1. **Usage Metrics**:
   - Number of tickets shared per day/week/month
   - Acceptance rate
   - Decline rate
   - Expiration rate
   - Most active sharers/recipients

2. **Performance Metrics**:
   - Response time for ticket sharing operations
   - Response time for user search
   - Error rates

## Future Enhancements

1. **Social Sharing**: Allow sharing tickets via social media or messaging platforms.

2. **Partial Acceptance**: Allow recipients to accept only some of the shared seats.

3. **Group Sharing**: Share tickets with multiple users at once.

4. **Transfer History**: Track the history of ticket transfers for audit purposes.

5. **QR Code Generation**: Generate unique QR codes for shared tickets.