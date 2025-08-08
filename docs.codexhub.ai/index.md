# Movie Booking App Documentation

Welcome to the official documentation for the Movie Booking App! This comprehensive guide provides detailed information about the architecture, APIs, development processes, and testing strategies for our Turborepo monorepo application.

## About the Application

The Movie Booking App is a full-stack application built with a Turborepo monorepo structure that allows users to browse movies, select showtimes, book seats, and make payments. The app consists of:

- A Next.js frontend (`user-app`)
- An Express API server (`express-server`)
- A worker service that processes booking transactions via Redis queue
- PostgreSQL database with Prisma ORM

## System Architecture

The application uses a distributed architecture with Redis queue for managing seat booking transactions, ensuring that no double bookings occur even under high load. The architecture is designed for scalability and reliability.

![System Architecture](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/SeatMatrix.png)

## Key Features

- **User Authentication**: Secure login/signup with NextAuth
- **Movie Browsing**: Search and browse available movies
- **Cinema Selection**: View cinemas and available showtimes
- **Seat Selection**: Interactive seat selection interface with real-time updates
- **Transaction Processing**: Reliable booking transaction processing via Redis queue
- **Payment Handling**: Secure payment processing with balance verification

## Documentation Structure

### Architecture Documentation

- [System Overview](architecture/system-overview.md) - High-level overview of the system architecture
- [Redis Queue System](architecture/redis-queue-system.md) - Detailed explanation of the Redis queue for seat booking

### API Documentation

- [User App API Reference](api/user-app-api-reference.md) - Documentation for all frontend API endpoints

### Developer Guides

- [Developer Onboarding](guides/developer-onboarding.md) - Getting started with development
- [Database Schema](guides/database-schema.md) - Comprehensive database schema documentation
- [Production Deployment](guides/production-deployment.md) - Guide for deploying to production

### Testing Documentation

- [Testing Guide](testing/testing-guide.md) - Comprehensive testing strategies

## Getting Started

To get started with development:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/movie-booking-app.git
   cd movie-booking-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/movie_booking_db"
   EXPRESS_SERVER_URL="http://localhost:8080"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. Run database migrations:
   ```bash
   npm run db:generate -w @repo/db
   npx prisma migrate dev -w @repo/db
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

For more detailed setup instructions, see the [Developer Onboarding Guide](guides/developer-onboarding.md).

## Screenshots

![Home Page](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/home.png)

![Seat Selection](https://github.com/dalaixlmao/Movie-Booking-Management-App/blob/main/screenshots/SeatMatrix.png)

## Contributing

We welcome contributions to the Movie Booking App! Please read through our documentation to understand the architecture and development practices before making changes.

## Support

If you encounter any issues or have questions about the documentation, please open an issue on the repository or contact the development team.