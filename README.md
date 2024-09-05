# Movie Booking App

This is a full-stack movie booking application built using the Turborepo monorepo structure. It allows users to search for available movies, select time slots, book seats, and make payments. The app consists of two services: a Next.js `user-app` and an Express.js-based `queue-app` using Redis messaging queues for handling seat booking transactions.

## Demo Screenshots

- **Home Page**  
  ![Home Page](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/home.png)

- **Slot Selection**  
  ![Slot Selection](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/cinemaListAndSlot.png)

- **Number of seats**  
  ![Number of seats](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/chooseNumberOfSeats.png)

- **Seat Matrix**  
  ![Seat Matrix](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/SeatMatrix.png)

## Tech Stack

- **User-app**: Next.js, TailwindCSS
- **Database**: PostgreSQL (with Prisma ORM)
- **Queue System**: Redis (for managing seat booking transactions)
- **Authentication**: NextAuth (for login/signup)

---

## System Design Flow

1. **User Login/Signup**  
   - The user registers or logs in using NextAuth, which handles authentication.
   - Upon successful login, the user can browse movies available in their location.

2. **Movie Selection and Cinema Viewing**  
   - Users can select a movie to see the list of cinemas and available time slots.
   - After selecting a cinema and time slot, they proceed to seat selection.

3. **Seat Selection and Payment**  
   - Users select the number of seats and then choose from the available seats in the auditorium's seat matrix.
   - Upon confirming the seat selection, they proceed to the payment process.

4. **Payment Queue Handling**  
   - When a user clicks "Pay", the request is added to a Redis queue handled by the `queue-app`.
   - The worker service processes each booking sequentially from the queue to ensure no seat clashes occur.
   - After processing, payment is confirmed, and the seats are booked in the PostgreSQL database using Prisma ORM, ensuring ACID compliance.

---

## Folder Structure

```bash
├── apps
│   ├── user-app     
│   │   ├── app     
│   │   │    ├── (pages)
│   │   │    │    ├── booking
│   │   │    │    └── dashboard
│   │   │    ├── api
│   │   │    │    ├── auth
│   │   │    │    │    └── [...nextauth]
│   │   │    │    └── booking
│   │   │    │         └── slots
│   │   │    ├── signin
│   │   │    └── signup
│   │   ├── components
│   │   └── libs
│   │        └── actions
│   ├── exporess-server    
│   │   └── src
│   └── worker    
│       └── src          
├── packages
│   ├── db           
│   ├── eslint-config   
│   └── typescript-config 
├── .github          
└── turbo.json
```
## Features
  - Authentication: User signup and login handled via NextAuth.
  - Movie Selection: Browse movies, see available cinemas, and choose time slots.
  - Seat Selection: Select seats from the seat matrix in real-time.
  - Payment Queue: Ensures transactional integrity with Redis messaging queue and worker system to avoid seat booking clashes.
  - ACID Compliance: Prisma ORM with PostgreSQL ensures atomic, consistent, isolated, and durable transactions during seat booking.
## How to Run Locally
  - Prerequisites
  - Node.js
  - Redis server
  - PostgreSQL database
  - Prisma ORM (installed globally)

## Installation
1. Clone the repository:
  ```bash
  git clone https://dalaixlmao/Movie-Booking-Management-App.git
  cd Movie-Booking-Management-App
  ```
2. Install dependencies:
  ```bash
  npm install
  ```

3. Database setup:
- Update the .env file with your PostgreSQL credentials.
- Run Prisma migrations:
```bash
npx prisma migrate dev
```
- Run Prisma generation:
```bash
npx prisma generate
```

4. Run Redis server:
```bash
docker run --name redis-server -p 6379:6379 -d redis
```
Run the apps:
```bash
#From root folder
npm run dev
```

