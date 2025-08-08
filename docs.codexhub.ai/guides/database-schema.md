# Database Schema Documentation

This document provides a comprehensive overview of the database schema used in the Movie Booking App. The application uses PostgreSQL as the database and Prisma as the ORM (Object-Relational Mapping) tool.

## Schema Overview

The database schema is defined in `packages/db/prisma/schema.prisma`. It consists of several interconnected models that represent the core entities of the movie booking system.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Core Models

### User

Represents registered users of the application.

```prisma
model User {
  id Int @id @default(autoincrement())
  name String
  phone String
  email String @unique
  password String
  city String?
  state String?
  zip String?
  bookings Booking[]
  balance Int
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `name`: User's full name
- `phone`: User's phone number
- `email`: User's email address (unique)
- `password`: Hashed password
- `city`, `state`, `zip`: User's location information (optional)
- `bookings`: Relation to the user's bookings
- `balance`: User's account balance for transactions (in smallest currency unit, e.g., cents)

**Relationships:**
- One-to-many with `Booking`

### Bank

Represents the system bank that handles movie booking payments.

```prisma
model Bank {
  id Int @id @default(autoincrement())
  balance Int @default(10000000)
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `balance`: Total balance in the bank (default value of 10,000,000)

### Movie

Represents movie titles available for booking.

```prisma
model Movie {
  id Int @id @default(autoincrement())
  name String
  languages String[]
  certificate String
  rating String
  dates DateTime[]
  cinemas Cinema[]
  poster String?
  slots Slots[]
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `name`: Movie title
- `languages`: Array of languages the movie is available in
- `certificate`: Movie certification (e.g., PG, PG-13, R)
- `rating`: Movie rating (as a string)
- `dates`: Array of dates when the movie is showing
- `poster`: URL or path to the movie poster image (optional)

**Relationships:**
- Many-to-many with `Cinema`
- One-to-many with `Slots`

### Cinema

Represents movie theaters where movies are shown.

```prisma
model Cinema {
  id Int @id @default(autoincrement())
  name String
  auditoriums Audi[]
  movies Movie[]
  city String
  state String
  zip String
  bookings Booking[]
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `name`: Cinema name
- `city`, `state`, `zip`: Cinema location
- `auditoriums`: Relation to auditoriums in this cinema

**Relationships:**
- One-to-many with `Audi`
- Many-to-many with `Movie`
- One-to-many with `Booking`

### Audi (Auditorium)

Represents individual auditoriums within a cinema.

```prisma
model Audi {
  id Int @id @default(autoincrement())
  rows Int @default(1)
  cols Int @default(1)
  name String
  seats Seat[]
  cinemaId Int
  cinema Cinema @relation(fields: [cinemaId], references: [id])
  slots Slots[]
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `rows`: Number of seat rows in the auditorium
- `cols`: Number of seat columns in the auditorium
- `name`: Auditorium name
- `cinemaId`: Foreign key to the cinema
- `seats`: Relation to seats in this auditorium

**Relationships:**
- Many-to-one with `Cinema`
- One-to-many with `Seat`
- One-to-many with `Slots`

### Seat

Represents individual seats in an auditorium.

```prisma
model Seat {
  id Int @id @default(autoincrement())
  row Int
  col Int
  audiId Int
  audi Audi @relation(fields: [audiId], references: [id])
  booked Boolean @default(false)
  bookingId Int?
  booking Booking? @relation(fields: [bookingId], references: [id])
  price Int @default(0)
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `row`: Row number of the seat
- `col`: Column number of the seat
- `audiId`: Foreign key to the auditorium
- `booked`: Whether the seat is currently booked
- `bookingId`: Foreign key to the booking (optional)
- `price`: Seat price (in smallest currency unit)

**Relationships:**
- Many-to-one with `Audi`
- Many-to-one with `Booking` (optional)

### Slots

Represents movie showtime slots for a specific movie in a specific auditorium.

```prisma
model Slots {
  id Int @id @default(autoincrement())
  movieId Int
  slots DateTime[]
  audiId Int
  movie Movie @relation(fields: [movieId], references: [id])
  audi Audi @relation(fields: [audiId], references: [id])
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `movieId`: Foreign key to the movie
- `slots`: Array of datetime values representing showtimes
- `audiId`: Foreign key to the auditorium

**Relationships:**
- Many-to-one with `Movie`
- Many-to-one with `Audi`

### Booking

Represents a completed booking transaction.

```prisma
model Booking {
  id Int @id @default(autoincrement())
  cinemaId Int
  cinema Cinema @relation(fields: [cinemaId], references: [id])
  seats Seat[]
  startTime DateTime
  userId Int
  user User @relation(fields: [userId], references: [id])
}
```

**Fields:**
- `id`: Unique identifier (auto-incremented)
- `cinemaId`: Foreign key to the cinema
- `seats`: Relation to the booked seats
- `startTime`: Showtime of the movie
- `userId`: Foreign key to the user who made the booking

**Relationships:**
- Many-to-one with `Cinema`
- Many-to-one with `User`
- One-to-many with `Seat`

## Entity Relationships

Here's a visual representation of the relationships between entities:

```
┌───────┐       ┌─────────┐       ┌───────┐
│ User  │───┐   │ Booking │   ┌───│ Cinema│
└───────┘   │   └─────────┘   │   └───────┘
            │        │        │       │
            └────────┘        │       │
                 │            │       │
                 │            │       │
            ┌────┴────┐       │   ┌───┴───┐
            │  Seat   │◄──────┘   │ Audi  │
            └─────────┘           └───────┘
                 ▲                    │
                 │                    │
                 │    ┌───────┐       │
                 └────│ Slots │◄──────┘
                      └───────┘
                          │
                          │
                      ┌───┴───┐
                      │ Movie │
                      └───────┘
```

## Database Migrations

The Prisma schema is versioned using migrations. Existing migrations are stored in `packages/db/prisma/migrations/` directory.

Key migrations include:

1. `20240716124004_built_the_schema`: Initial schema creation
2. `20240717072728_added_poster_value_to_movie2`: Added poster field to Movie
3. `20240720143043_added_slots_schema`: Added Slots schema
4. `20240721140853_added_price_to_seat_and_rows_and_cols_to_audi`: Added price, rows, cols
5. `20240723075543_added_bank_schema_and_balance_to_user_schema`: Added Bank schema and user balance

## Working with the Database

### Creating New Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name your_migration_name -w @repo/db
```

### Applying Migrations

To apply migrations to a database:

```bash
npx prisma migrate deploy -w @repo/db
```

### Generating Prisma Client

To regenerate the Prisma client after schema changes:

```bash
npx prisma generate -w @repo/db
```

### Database Seeding

To populate the database with initial data:

```bash
npx prisma db seed -w @repo/db
```

The seed script is located at `packages/db/prisma/seed.ts`.

## Data Integrity

### Foreign Key Constraints

The schema utilizes foreign key constraints to maintain referential integrity:

- `Seat.audiId` references `Audi.id`
- `Seat.bookingId` references `Booking.id`
- `Audi.cinemaId` references `Cinema.id`
- `Booking.userId` references `User.id`
- `Booking.cinemaId` references `Cinema.id`
- `Slots.movieId` references `Movie.id`
- `Slots.audiId` references `Audi.id`

### Default Values

Several fields have default values:

- `Seat.booked`: `false`
- `Seat.price`: `0`
- `Audi.rows`: `1`
- `Audi.cols`: `1`
- `Bank.balance`: `10000000`

### Optional Fields

Fields that are nullable:

- `User.city`, `User.state`, `User.zip`
- `Movie.poster`
- `Seat.bookingId`

## Best Practices for Database Operations

1. **Use Prisma Transactions**: For operations that involve multiple writes, use transactions to ensure data consistency.

```typescript
await prisma.$transaction(async (tx) => {
  // Multiple database operations
});
```

2. **Row Locking**: For seat booking, use row-level locking to prevent conflicts.

```typescript
await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
```

3. **Data Validation**: Always validate data before insertion.

```typescript
const bodySchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
});
const res = bodySchema.safeParse({
  email: email,
  password: password,
});
if (!res.success) return null;
```

4. **Secure Password Storage**: Always hash passwords before storing.

```typescript
const hashedPass = await hash(password, 10);
```

5. **Batch Operations**: Use batch operations for better performance.

```typescript
await prisma.seat.updateMany({
  where: { id: { in: seatIds } },
  data: { booked: true },
});
```