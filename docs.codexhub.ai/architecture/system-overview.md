# Movie Booking App Architecture Overview

This document provides a comprehensive overview of the Movie Booking App architecture, explaining the Turborepo monorepo setup and the relationships between different services.

## Monorepo Structure

The Movie Booking App is built as a monorepo using Turborepo, which allows for efficient management of multiple packages and applications within a single repository.

### Root Structure

```
movie-booking-app/
├── apps/                # Individual applications
│   ├── user-app/        # Next.js frontend for users
│   ├── express-server/  # Express.js API server
│   └── worker/          # Redis queue worker service
├── packages/            # Shared packages and libraries
│   ├── db/              # Database client and schema
│   ├── store/           # Shared state management 
│   ├── ui/              # Shared UI components
│   ├── eslint-config/   # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── docs.codexhub.ai/    # Documentation
└── turbo.json           # Turborepo configuration
```

## Service Relationships

The application consists of three main services that work together to provide a seamless movie booking experience:

### 1. User-App (Next.js Frontend)

- **Purpose**: Provides the user interface for customers to browse movies, select showtimes, choose seats, and complete bookings.
- **Technology**: Built with Next.js, using React Server Components and Client Components where appropriate.
- **Key Features**:
  - Movie browsing and search
  - Cinema and showtime selection
  - Seat selection interface
  - Payment processing UI
  - User authentication with NextAuth

### 2. Express-Server (API Server)

- **Purpose**: Handles incoming booking requests and adds them to the Redis queue.
- **Technology**: Express.js server that receives HTTP requests and interacts with Redis.
- **Key Features**:
  - Receives seat booking requests from the user-app
  - Adds booking requests to Redis queue for processing
  - Prevents direct database access from the frontend

### 3. Worker Service (Queue Processor)

- **Purpose**: Processes booking requests from the Redis queue to ensure booking consistency and prevent conflicts.
- **Technology**: Node.js service that consumes from Redis queue and interacts with the database.
- **Key Features**:
  - Processes booking requests sequentially to prevent seat conflicts
  - Validates seat availability
  - Performs payment processing
  - Updates the database with booking information
  - Handles database transactions with proper locking mechanisms

## Data Flow for Seat Booking

The following diagram illustrates how the three services work together during the seat booking process:

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│              │     │                │     │              │     │              │
│   User App   │────▶│ Express Server │────▶│  Redis Queue │────▶│    Worker    │
│  (Next.js)   │     │  (API Server)  │     │              │     │   Service    │
│              │     │                │     │              │     │              │
└──────────────┘     └────────────────┘     └──────────────┘     └──────┬───────┘
                                                                        │
                                                                        │
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │                  │
                                                              │   PostgreSQL     │
                                                              │   Database       │
                                                              │   (via Prisma)   │
                                                              │                  │
                                                              └──────────────────┘
```

## Redis Queue System for Preventing Booking Conflicts

The Redis queue system is a critical component that ensures seat booking transactions are processed reliably and consistently, preventing double bookings and race conditions.

### How It Works:

1. **Request Submission**:
   - When a user selects seats and confirms their booking, the user-app sends a request to the express-server.
   - The express-server adds the booking information (selected seats, user ID, timestamp, cinema ID) to a Redis queue.
   - The server responds immediately, indicating that the booking request is being processed.

2. **Queue Processing**:
   - The worker service continuously monitors the Redis queue for new booking requests.
   - Requests are processed one at a time (FIFO - First In, First Out), which eliminates the possibility of concurrent conflicting operations.

3. **Transaction Handling**:
   - For each booking request, the worker service:
     - Locks the selected seats using database row-level locking to prevent other transactions from modifying them.
     - Verifies that all requested seats are still available.
     - Checks that the user has sufficient funds.
     - Processes the payment transaction.
     - Updates the seat status to "booked" and creates a booking record.
     - All of these operations are performed within a single database transaction to ensure ACID compliance.

4. **Conflict Resolution**:
   - If a seat has already been booked by another user, the transaction fails and rolls back.
   - The sequential processing ensures that conflicts are detected and handled properly.

## Database Schema

The application uses PostgreSQL with Prisma ORM for data storage. Key entities include:

- **User**: Stores user information and balance for payments
- **Movie**: Contains movie information including available dates and associated cinemas
- **Cinema**: Represents movie theaters with auditoriums
- **Audi**: Represents individual auditoriums with seat layouts
- **Seat**: Individual seats that can be booked
- **Booking**: Records of completed bookings
- **Slots**: Available time slots for movies at specific auditoriums

The complete schema can be found in the [Database Documentation](../guides/database-schema.md).