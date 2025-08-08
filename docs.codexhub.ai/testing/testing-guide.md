# Testing Guide for Movie Booking App

This comprehensive guide outlines testing strategies and best practices for the Movie Booking App. It covers unit testing, integration testing, and end-to-end testing approaches specifically designed for the application's unique architecture.

## Testing Strategy Overview

The Movie Booking App requires a multi-layered testing approach due to its distributed architecture:

1. **Unit Testing**: Testing individual components and functions in isolation
2. **Integration Testing**: Testing interactions between components and services
3. **End-to-End Testing**: Testing complete user flows from UI to database

Each layer serves a specific purpose and helps ensure the reliability of different aspects of the system.

## Unit Testing

### Testing Booking Components

Unit tests for React components should focus on rendering, user interactions, and state changes.

#### Testing Seat Selection Component

```tsx
// __tests__/components/Seat.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Seat from '@/components/Seat';

describe('Seat Component', () => {
  const mockSeat = {
    id: 1,
    row: 1,
    col: 1,
    audiId: 1,
    booked: false,
    bookingId: null,
    price: 250
  };
  
  const mockOnClick = jest.fn();
  
  test('renders correctly with available seat', () => {
    render(
      <Seat 
        onClick={mockOnClick} 
        seat={mockSeat} 
        totalCols={10} 
        isSelected={false} 
      />
    );
    
    const seatElement = screen.getByTestId('seat-1');
    expect(seatElement).toBeInTheDocument();
    expect(seatElement).not.toHaveClass('bg-gray-800');
    expect(seatElement).not.toHaveClass('bg-green-500');
  });
  
  test('renders correctly for booked seat', () => {
    const bookedSeat = { ...mockSeat, booked: true };
    
    render(
      <Seat 
        onClick={mockOnClick} 
        seat={bookedSeat} 
        totalCols={10} 
        isSelected={false} 
      />
    );
    
    const seatElement = screen.getByTestId('seat-1');
    expect(seatElement).toHaveClass('bg-gray-800');
  });
  
  test('renders correctly for selected seat', () => {
    render(
      <Seat 
        onClick={mockOnClick} 
        seat={mockSeat} 
        totalCols={10} 
        isSelected={true} 
      />
    );
    
    const seatElement = screen.getByTestId('seat-1');
    expect(seatElement).toHaveClass('bg-green-500');
  });
  
  test('calls onClick when clicked and seat is available', () => {
    render(
      <Seat 
        onClick={mockOnClick} 
        seat={mockSeat} 
        totalCols={10} 
        isSelected={false} 
      />
    );
    
    const seatElement = screen.getByTestId('seat-1');
    fireEvent.click(seatElement);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  test('does not call onClick when clicked and seat is booked', () => {
    const bookedSeat = { ...mockSeat, booked: true };
    
    render(
      <Seat 
        onClick={mockOnClick} 
        seat={bookedSeat} 
        totalCols={10} 
        isSelected={false} 
      />
    );
    
    const seatElement = screen.getByTestId('seat-1');
    fireEvent.click(seatElement);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
```

#### Testing AuditoriumStructure Component

```tsx
// __tests__/components/AuditoriumStructure.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import AuditoriumStructure from '@/components/AuditoriumStructure';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn()
}));

jest.mock('axios');
jest.mock('@/lib/actions/getSeat', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@/lib/actions/selectTheSeats', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue([1, 2])
}));

jest.mock('@/lib/actions/totalSeatAmount', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(500)
}));

describe('AuditoriumStructure Component', () => {
  const mockSearchParams = {
    get: jest.fn()
  };
  
  const mockAudi = {
    id: 1,
    name: 'Audi 1',
    rows: 5,
    cols: 10,
    seats: [
      {
        id: 1,
        row: 1,
        col: 1,
        audiId: 1,
        booked: false,
        bookingId: null,
        price: 250
      },
      {
        id: 2,
        row: 1,
        col: 2,
        audiId: 1,
        booked: false,
        bookingId: null,
        price: 250
      }
      // Add more mock seats as needed
    ]
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock values
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    mockSearchParams.get.mockImplementation((param) => {
      if (param === 'cinemaId') return '1';
      if (param === 'timeStamp') return '1722700800000';
      return null;
    });
    
    axios.post.mockResolvedValue({ data: { audi: mockAudi } });
    require('@/lib/actions/getSeat').default.mockResolvedValue(mockAudi.seats);
  });
  
  test('renders loading spinner initially', () => {
    render(<AuditoriumStructure userId={123} />);
    
    expect(screen.getByTestId('circular-loader')).toBeInTheDocument();
  });
  
  test('renders auditorium after data is loaded', async () => {
    render(<AuditoriumStructure userId={123} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('circular-loader')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('screen')).toBeInTheDocument();
    expect(screen.getByTestId('seat-1')).toBeInTheDocument();
    expect(screen.getByTestId('seat-2')).toBeInTheDocument();
  });
  
  test('displays popup for seat selection initially', async () => {
    render(<AuditoriumStructure userId={123} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('circular-loader')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('seat-selection-popup')).toBeInTheDocument();
  });
  
  // Add more tests for seat selection, popup interaction, etc.
});
```

### Testing Booking Logic Functions

Unit tests for utility functions should verify their logic under various scenarios.

```tsx
// __tests__/lib/actions/selectTheSeats.test.ts
import selectTheSeats from '@/lib/actions/selectTheSeats';

describe('selectTheSeats Function', () => {
  const mockAudi = {
    id: 1,
    name: 'Audi 1',
    rows: 3,
    cols: 3,
    seats: [
      { id: 1, row: 1, col: 1, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 2, row: 1, col: 2, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 3, row: 1, col: 3, audiId: 1, booked: true, bookingId: 101, price: 100 },
      { id: 4, row: 2, col: 1, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 5, row: 2, col: 2, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 6, row: 2, col: 3, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 7, row: 3, col: 1, audiId: 1, booked: true, bookingId: 102, price: 100 },
      { id: 8, row: 3, col: 2, audiId: 1, booked: false, bookingId: null, price: 100 },
      { id: 9, row: 3, col: 3, audiId: 1, booked: false, bookingId: null, price: 100 }
    ]
  };

  test('returns empty array when audi or selectedSeat is undefined', () => {
    expect(selectTheSeats(undefined, undefined, 2)).toEqual([]);
    expect(selectTheSeats(mockAudi, undefined, 2)).toEqual([]);
  });
  
  test('selects correct number of adjacent seats', () => {
    const selectedSeat = mockAudi.seats[0]; // Select first seat
    const result = selectTheSeats(mockAudi, selectedSeat, 2);
    
    expect(result).toHaveLength(2);
    expect(result).toContain(1); // Should include the first seat
    expect(result).toContain(2); // Should include the second seat (adjacent)
  });
  
  test('skips booked seats when selecting', () => {
    const selectedSeat = mockAudi.seats[1]; // Select second seat
    const result = selectTheSeats(mockAudi, selectedSeat, 3);
    
    expect(result).toHaveLength(3);
    expect(result).toContain(2); // Second seat
    expect(result).toContain(4); // Fourth seat (since third is booked)
    expect(result).toContain(5); // Fifth seat
  });
  
  test('wraps to next row when reaching end of row', () => {
    const selectedSeat = mockAudi.seats[1]; // Select second seat
    const result = selectTheSeats(mockAudi, selectedSeat, 4);
    
    expect(result).toHaveLength(4);
    expect(result).toContain(2); // Second seat
    expect(result).toContain(4); // Fourth seat (since third is booked)
    expect(result).toContain(5); // Fifth seat
    expect(result).toContain(6); // Sixth seat
  });
});
```

### Testing Payment Components

```tsx
// __tests__/components/PayingAmountButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import PayingAmountButton from '@/components/PayingAmountButton';

describe('PayingAmountButton Component', () => {
  const mockOnClick = jest.fn();
  
  test('renders with correct amount', () => {
    render(<PayingAmountButton amount={250} onClick={mockOnClick} loader={false} />);
    
    expect(screen.getByText('₹250')).toBeInTheDocument();
    expect(screen.getByText('Pay')).toBeInTheDocument();
  });
  
  test('shows loader when loading', () => {
    render(<PayingAmountButton amount={250} onClick={mockOnClick} loader={true} />);
    
    expect(screen.getByTestId('payment-loader')).toBeInTheDocument();
  });
  
  test('calls onClick when button is clicked', () => {
    render(<PayingAmountButton amount={250} onClick={mockOnClick} loader={false} />);
    
    fireEvent.click(screen.getByText('Pay'));
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  test('button is disabled when loading', () => {
    render(<PayingAmountButton amount={250} onClick={mockOnClick} loader={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
```

## Integration Testing

Integration tests verify that different components of the system work together correctly.

### Testing API Routes

```tsx
// __tests__/api/booking.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/booking/route';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@repo/db/client';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@repo/db/client');

describe('Booking API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/booking', () => {
    test('returns movie details when valid ID is provided', async () => {
      const mockMovie = {
        id: 1,
        name: 'Test Movie',
        languages: ['English'],
        certificate: 'PG',
        rating: '4.5',
        dates: [new Date()],
        poster: 'test-poster.jpg'
      };
      
      // Setup mocks
      const { req } = createMocks({
        method: 'GET',
      });
      req.json = jest.fn().mockResolvedValue({ id: 1 });
      
      const prismaFindUnique = jest.fn().mockResolvedValue(mockMovie);
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        movie: {
          findUnique: prismaFindUnique
        }
      }));
      
      // Call the API route
      const response = await GET(req);
      const data = await response.json();
      
      // Assertions
      expect(prismaFindUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(data.movie).toEqual(mockMovie);
      expect(data.message).toBe('Fetched Movie!');
    });
  });
  
  describe('POST /api/booking', () => {
    test('returns cinemas and time slots for a movie on a specific date', async () => {
      // Setup mock session
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '123' }
      });
      
      // Setup mock user
      const mockUser = { city: 'Mumbai' };
      const prismaFindUniqueUser = jest.fn().mockResolvedValue(mockUser);
      
      // Setup mock slots
      const mockSlots = [
        {
          slots: [new Date('2025-08-01T14:00:00Z')],
          audiId: 1,
          audi: {
            cinema: { id: 1, name: 'Cinema 1', city: 'Mumbai' }
          }
        }
      ];
      const prismaFindManySlots = jest.fn().mockResolvedValue(mockSlots);
      
      // Setup mock cinema
      const mockCinema = {
        id: 1,
        name: 'Cinema 1',
        city: 'Mumbai',
        state: 'Maharashtra'
      };
      const prismaFindUniqueCinema = jest.fn().mockResolvedValue(mockCinema);
      
      // Setup Prisma mock
      (PrismaClient as jest.Mock).mockImplementation(() => ({
        user: {
          findUnique: prismaFindUniqueUser
        },
        slots: {
          findMany: prismaFindManySlots
        },
        cinema: {
          findUnique: prismaFindUniqueCinema
        }
      }));
      
      // Setup request
      const { req } = createMocks({
        method: 'POST',
      });
      req.json = jest.fn().mockResolvedValue({
        movieId: 1,
        currDate: '2025-08-01T00:00:00Z'
      });
      
      // Call the API route
      const response = await POST(req);
      const data = await response.json();
      
      // Assertions
      expect(data.cinema).toBeInstanceOf(Array);
      expect(data.cinema.length).toBe(1);
      expect(data.cinema[0].cinema).toEqual(mockCinema);
      expect(data.cinema[0].timeSlots).toBeInstanceOf(Array);
    });
  });
});
```

### Testing Redis Queue Workflow

```typescript
// __tests__/integration/redis-queue.test.ts
import { createClient } from 'redis';
import express from 'express';
import request from 'supertest';
import { PrismaClient } from '@repo/db/client';

// Mock dependencies
jest.mock('redis');
jest.mock('@repo/db/client');

describe('Redis Queue Integration', () => {
  let app: express.Application;
  let mockRedisClient: any;
  
  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      lPush: jest.fn().mockResolvedValue(undefined),
      on: jest.fn()
    };
    
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);
    
    // Setup route
    app.post('/', async (req, res) => {
      const { bookedSeats, userId, startTime, cinemaId } = req.body;
      try {
        await mockRedisClient.lPush(
          'bookedSeat', 
          JSON.stringify({ bookedSeat: bookedSeats, userId, startTime, cinemaId })
        );
        res.status(200).json({ message: 'Booking seat request added to queue' });
      } catch(e) {
        res.status(500).json({ message: 'Error in sending message to queue' });
      }
    });
  });
  
  test('successfully adds booking request to Redis queue', async () => {
    const bookingData = {
      bookedSeats: [1, 2, 3],
      userId: 123,
      startTime: 1722700800000,
      cinemaId: 1
    };
    
    const response = await request(app)
      .post('/')
      .send(bookingData)
      .expect(200);
    
    expect(response.body.message).toBe('Booking seat request added to queue');
    expect(mockRedisClient.lPush).toHaveBeenCalledWith(
      'bookedSeat',
      expect.any(String)
    );
    
    // Verify the JSON string passed to lPush
    const pushedData = JSON.parse(mockRedisClient.lPush.mock.calls[0][1]);
    expect(pushedData.bookedSeat).toEqual(bookingData.bookedSeats);
    expect(pushedData.userId).toBe(bookingData.userId);
    expect(pushedData.startTime).toBe(bookingData.startTime);
    expect(pushedData.cinemaId).toBe(bookingData.cinemaId);
  });
  
  test('returns error when Redis push fails', async () => {
    // Make Redis lPush fail
    mockRedisClient.lPush.mockRejectedValue(new Error('Redis error'));
    
    const bookingData = {
      bookedSeats: [1, 2, 3],
      userId: 123,
      startTime: 1722700800000,
      cinemaId: 1
    };
    
    const response = await request(app)
      .post('/')
      .send(bookingData)
      .expect(500);
    
    expect(response.body.message).toBe('Error in sending message to queue');
  });
});
```

### Testing Database Transactions

```typescript
// __tests__/integration/database-transactions.test.ts
import { PrismaClient } from '@repo/db/client';

// Use a test database for integration tests
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/test_db';

const prisma = new PrismaClient();

describe('Database Transaction Integration Tests', () => {
  // Setup test data
  beforeAll(async () => {
    // Clear existing data
    await prisma.seat.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bank.deleteMany();
    
    // Create test data
    await prisma.bank.create({
      data: {
        id: 1,
        balance: 10000
      }
    });
    
    await prisma.user.create({
      data: {
        id: 1,
        name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com',
        password: 'password',
        balance: 1000
      }
    });
    
    // Create test seats
    for (let i = 1; i <= 5; i++) {
      await prisma.seat.create({
        data: {
          id: i,
          row: Math.ceil(i / 3),
          col: ((i - 1) % 3) + 1,
          audiId: 1,
          price: 100
        }
      });
    }
  });
  
  // Clean up after tests
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  test('successfully completes booking transaction', async () => {
    const seats = [1, 2, 3];
    const amount = 300; // 3 seats * 100 each
    const userId = 1;
    const startTime = Date.now();
    const cinemaId = 1;
    
    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Lock the rows
      for (const seatId of seats) {
        await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
      }
      
      // Check seat availability
      const seatStatuses = await tx.seat.findMany({
        where: {
          id: { in: seats },
        },
        select: {
          id: true,
          booked: true,
        },
      });
      
      const unavailableSeats = seatStatuses.filter(seat => seat.booked);
      expect(unavailableSeats.length).toBe(0);
      
      // Check user balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          balance: true,
        },
      });
      
      expect(user).not.toBeNull();
      expect(user!.balance).toBeGreaterThanOrEqual(amount);
      
      // Get bank
      const bank = await tx.bank.findMany({});
      const initialBankBalance = bank[0].balance;
      
      // Process payment
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });
      
      await tx.bank.update({
        where: { id: bank[0].id },
        data: { 
          balance: { 
            increment: amount 
          } 
        },
      });
      
      // Mark seats as booked
      for (const id of seats) {
        await tx.seat.update({
          where: { id },
          data: { booked: true },
        });
      }
      
      // Verify changes
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true },
      });
      
      expect(updatedUser!.balance).toBe(user!.balance - amount);
      
      const updatedBank = await tx.bank.findUnique({
        where: { id: bank[0].id },
        select: { balance: true },
      });
      
      expect(updatedBank!.balance).toBe(initialBankBalance + amount);
      
      const updatedSeats = await tx.seat.findMany({
        where: { id: { in: seats } },
        select: { booked: true },
      });
      
      expect(updatedSeats.every(seat => seat.booked)).toBe(true);
    });
  });
  
  test('rolls back transaction when seats are already booked', async () => {
    // First, book a seat
    await prisma.seat.update({
      where: { id: 4 },
      data: { booked: true },
    });
    
    const seats = [3, 4, 5];
    const amount = 300;
    const userId = 1;
    const startTime = Date.now();
    const cinemaId = 1;
    
    // Get initial state
    const initialUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    
    const initialBank = await prisma.bank.findFirst({
      select: { balance: true },
    });
    
    // Try to book seats (should fail because seat 4 is already booked)
    try {
      await prisma.$transaction(async (tx) => {
        // Lock the rows
        for (const seatId of seats) {
          await tx.$queryRaw`SELECT * FROM "Seat" WHERE "id" = ${seatId} FOR UPDATE`;
        }
        
        // Check seat availability
        const seatStatuses = await tx.seat.findMany({
          where: {
            id: { in: seats },
          },
          select: {
            id: true,
            booked: true,
          },
        });
        
        const unavailableSeats = seatStatuses.filter(seat => seat.booked);
        if (unavailableSeats.length > 0) {
          throw new Error(`Seats ${unavailableSeats.map(seat => seat.id).join(', ')} are already booked`);
        }
        
        // This code should not execute
        fail('Transaction should have failed due to already booked seat');
      });
    } catch (e) {
      // Transaction should fail
      expect(e).toBeInstanceOf(Error);
      expect((e as Error).message).toContain('are already booked');
    }
    
    // Verify state remains unchanged
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    
    expect(finalUser!.balance).toBe(initialUser!.balance);
    
    const finalBank = await prisma.bank.findFirst({
      select: { balance: true },
    });
    
    expect(finalBank!.balance).toBe(initialBank!.balance);
    
    // Check seats 3 and 5 are still not booked
    const seat3 = await prisma.seat.findUnique({
      where: { id: 3 },
      select: { booked: true },
    });
    
    expect(seat3!.booked).toBe(false);
    
    const seat5 = await prisma.seat.findUnique({
      where: { id: 5 },
      select: { booked: true },
    });
    
    expect(seat5!.booked).toBe(false);
  });
});
```

## End-to-End Testing

End-to-end tests verify complete user flows from the frontend through all backend services.

### Complete Booking Flow Test

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Booking Flow', () => {
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Set up test data - create a test user
    const response = await request.post('/api/test/setup', {
      data: {
        email: 'e2e-test@example.com',
        password: 'password123',
        name: 'E2E Test User',
        phone: '1234567890',
        balance: 10000
      }
    });
    const data = await response.json();
    userId = data.userId;
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/signin');
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('/');
  });

  test('User can complete movie booking process', async ({ page }) => {
    // Step 1: Navigate to the homepage and select a movie
    await page.goto('/');
    await expect(page).toHaveTitle(/Movie Booking App/);
    
    const movieCard = page.locator('.movie-card').first();
    await movieCard.click();
    
    // Step 2: Select a cinema and time slot
    await expect(page).toHaveURL(/booking/);
    await expect(page.locator('h1')).toContainText(/Select Cinema & Time/);
    
    const cinemaItem = page.locator('.cinema-item').first();
    await expect(cinemaItem).toBeVisible();
    
    const timeSlot = page.locator('.time-slot').first();
    await timeSlot.click();
    
    // Step 3: Select number of seats
    await expect(page).toHaveURL(/booking\/slots/);
    
    // Wait for popup to appear and select 2 seats
    await expect(page.locator('[data-testid="seat-selection-popup"]')).toBeVisible();
    await page.locator('[data-testid="seat-count-2"]').click();
    await page.locator('[data-testid="continue-button"]').click();
    
    // Step 4: Select specific seats
    // Wait for seats to be displayed
    await expect(page.locator('[data-testid="screen"]')).toBeVisible();
    
    // Find an available seat
    const availableSeat = page.locator('[data-testid^="seat-"]:not(.bg-gray-800)').first();
    await availableSeat.click();
    
    // Verify seat is selected
    await expect(page.locator('.bg-green-500')).toHaveCount(2);
    
    // Step 5: Make payment
    const payButton = page.locator('[data-testid="pay-button"]');
    await expect(payButton).toBeVisible();
    
    // Get price before clicking
    const priceText = await payButton.textContent();
    const price = Number(priceText?.match(/₹(\d+)/)?.[1] || 0);
    expect(price).toBeGreaterThan(0);
    
    // Click pay
    await payButton.click();
    
    // Step 6: Verify payment processing
    await expect(page.locator('[data-testid="payment-loader"]')).toBeVisible();
    
    // Wait for payment to complete (this may take some time)
    await expect(page.locator('.payment-success-message')).toBeVisible({ timeout: 30000 });
    
    // Step 7: Verify booking is recorded
    await page.goto('/dashboard');
    
    // Check for the booking in the list
    await expect(page.locator('.booking-item')).toHaveCount(1);
    
    // Verify booking details
    const bookingDetails = page.locator('.booking-item').first();
    await expect(bookingDetails).toContainText(/E2E Test Movie/);
    await expect(bookingDetails).toContainText(/2 seats/);
  });

  test('User cannot book already booked seats', async ({ page }) => {
    // Navigate to a movie with already booked seats
    await page.goto('/booking?movieId=1');
    
    // Select cinema and time
    const cinemaItem = page.locator('.cinema-item').first();
    const timeSlot = page.locator('.time-slot').first();
    await timeSlot.click();
    
    // Select 2 seats
    await page.locator('[data-testid="seat-count-2"]').click();
    await page.locator('[data-testid="continue-button"]').click();
    
    // Try to select a booked seat (gray seat)
    const bookedSeat = page.locator('.bg-gray-800').first();
    await bookedSeat.click();
    
    // Verify pay button is not available
    await expect(page.locator('[data-testid="pay-button"]')).not.toBeVisible();
  });

  test('User with insufficient balance cannot complete booking', async ({ page, request }) => {
    // First, update user balance to a low amount
    await request.post('/api/test/update-balance', {
      data: {
        userId,
        balance: 10 // Very low balance
      }
    });
    
    // Navigate to booking flow
    await page.goto('/booking?movieId=1');
    
    // Select cinema and time
    const timeSlot = page.locator('.time-slot').first();
    await timeSlot.click();
    
    // Select 2 seats
    await page.locator('[data-testid="seat-count-2"]').click();
    await page.locator('[data-testid="continue-button"]').click();
    
    // Select available seats
    const availableSeat = page.locator('[data-testid^="seat-"]:not(.bg-gray-800)').first();
    await availableSeat.click();
    
    // Click pay
    await page.locator('[data-testid="pay-button"]').click();
    
    // Wait for error message
    await expect(page.locator('.payment-error-message')).toBeVisible();
    await expect(page.locator('.payment-error-message')).toContainText(/Insufficient Funds/);
  });
});
```

## Testing the Redis Queue System

This test verifies the core functionality of the Redis queue system for handling seat booking transactions.

```typescript
// tests/integration/redis-queue-system.test.ts
import { createClient } from 'redis';
import { PrismaClient } from '@repo/db/client';
import { startWorker, applyBooking } from '../../apps/worker/src/index';
import axios from 'axios';

// Use test databases
process.env.DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use database 1 for tests

const prisma = new PrismaClient();
const client = createClient({ url: process.env.REDIS_URL });

describe('Redis Queue System Integration', () => {
  let worker: any;
  
  beforeAll(async () => {
    // Connect to Redis
    await client.connect();
    
    // Clear Redis queue
    await client.del('bookedSeat');
    
    // Clear test data
    await prisma.seat.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.audi.deleteMany();
    await prisma.cinema.deleteMany();
    await prisma.user.deleteMany();
    await prisma.bank.deleteMany();
    
    // Create test data
    await prisma.bank.create({
      data: { id: 1, balance: 10000 }
    });
    
    await prisma.user.create({
      data: {
        id: 1,
        name: 'Test User',
        phone: '1234567890',
        email: 'test@example.com',
        password: 'hashed_password',
        balance: 1000
      }
    });
    
    await prisma.cinema.create({
      data: {
        id: 1,
        name: 'Test Cinema',
        city: 'Test City',
        state: 'Test State',
        zip: '12345'
      }
    });
    
    await prisma.audi.create({
      data: {
        id: 1,
        name: 'Test Audi',
        rows: 5,
        cols: 5,
        cinemaId: 1
      }
    });
    
    // Create 25 seats (5x5)
    for (let i = 1; i <= 25; i++) {
      await prisma.seat.create({
        data: {
          id: i,
          row: Math.ceil(i / 5),
          col: ((i - 1) % 5) + 1,
          audiId: 1,
          price: 100
        }
      });
    }
    
    // Start the worker in a separate process
    worker = startWorker();
  });
  
  afterAll(async () => {
    // Disconnect
    await client.disconnect();
    await prisma.$disconnect();
    
    // Stop worker
    if (worker && worker.kill) {
      worker.kill();
    }
  });
  
  test('Express server adds booking request to Redis queue', async () => {
    // Make request to Express server
    const bookingData = {
      bookedSeats: [1, 2, 3],
      userId: 1,
      startTime: Date.now(),
      cinemaId: 1
    };
    
    const response = await axios.post('http://localhost:8080', bookingData);
    
    // Verify response
    expect(response.status).toBe(200);
    expect(response.data.message).toBe('Booking seat request added to queue');
    
    // Check queue length
    const queueLength = await client.lLen('bookedSeat');
    expect(queueLength).toBeGreaterThan(0);
    
    // Wait for worker to process the request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify seats were booked
    const seats = await prisma.seat.findMany({
      where: { id: { in: bookingData.bookedSeats } }
    });
    
    expect(seats.length).toBe(3);
    expect(seats.every(seat => seat.booked)).toBe(true);
    
    // Verify booking was created
    const bookings = await prisma.booking.findMany({
      where: {
        userId: bookingData.userId,
        cinemaId: bookingData.cinemaId
      },
      include: { seats: true }
    });
    
    expect(bookings.length).toBe(1);
    expect(bookings[0].seats.length).toBe(3);
    
    // Verify user balance was updated
    const user = await prisma.user.findUnique({
      where: { id: bookingData.userId }
    });
    
    expect(user?.balance).toBe(1000 - (3 * 100));
  });
  
  test('Queue system prevents double booking', async () => {
    // Try to book already booked seats
    const bookingData = {
      bookedSeats: [1, 2, 3], // These are already booked from previous test
      userId: 1,
      startTime: Date.now(),
      cinemaId: 1
    };
    
    const response = await axios.post('http://localhost:8080', bookingData);
    
    // Verify response (should still be accepted into queue)
    expect(response.status).toBe(200);
    
    // Wait for worker to process the request
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for error logs (worker should log error)
    // This would require mocking console.log or checking actual logs
    
    // Verify user balance remains unchanged
    const user = await prisma.user.findUnique({
      where: { id: bookingData.userId }
    });
    
    // Should still be 700 from previous test (1000 - 3*100)
    expect(user?.balance).toBe(700);
    
    // Verify no new booking was created
    const bookingCount = await prisma.booking.count({
      where: {
        userId: bookingData.userId,
        cinemaId: bookingData.cinemaId
      }
    });
    
    // Still only one booking from previous test
    expect(bookingCount).toBe(1);
  });
  
  test('Concurrent booking requests are processed sequentially', async () => {
    // Submit multiple concurrent booking requests
    const requests = [
      { bookedSeats: [4, 5], userId: 1, startTime: Date.now(), cinemaId: 1 },
      { bookedSeats: [6, 7], userId: 1, startTime: Date.now(), cinemaId: 1 },
      { bookedSeats: [8, 9], userId: 1, startTime: Date.now(), cinemaId: 1 }
    ];
    
    // Send all requests concurrently
    await Promise.all(requests.map(data => 
      axios.post('http://localhost:8080', data)
    ));
    
    // Wait for worker to process all requests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if all seats were booked correctly
    const allSeatIds = requests.flatMap(r => r.bookedSeats);
    const seats = await prisma.seat.findMany({
      where: { id: { in: allSeatIds } }
    });
    
    // All seats should be booked
    expect(seats.length).toBe(6);
    expect(seats.every(seat => seat.booked)).toBe(true);
    
    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: 1 }
    });
    
    // Initial 700 (after first test) - (6 * 100) = 100
    expect(user?.balance).toBe(100);
    
    // Should have 4 bookings total (1 from first test + 3 from this test)
    const bookingCount = await prisma.booking.count({
      where: {
        userId: 1,
        cinemaId: 1
      }
    });
    
    expect(bookingCount).toBe(4);
  });
});
```

## Test Setup and Configuration

### Jest Configuration

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/', '<rootDir>/packages/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/user-app/$1',
    '^@repo/(.*)$': '<rootDir>/packages/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/'],
  collectCoverageFrom: [
    'apps/**/*.[jt]s?(x)',
    'packages/**/*.[jt]s?(x)',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**'
  ]
};
```

### Playwright Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests for specific component
npm run test:unit -- --testPathPattern=Seat

# Run with coverage
npm run test:unit -- --coverage
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration -- --testPathPattern=redis-queue
```

### End-to-End Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- --grep="booking flow"

# Run on specific browser
npm run test:e2e -- --project=firefox
```

## Continuous Integration

Add tests to your CI/CD pipeline to ensure code quality:

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:6
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Set up database
        run: npm run db:generate
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/1
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/1
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: |
            playwright-report/
            coverage/
          retention-days: 30
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on the state from previous tests.

2. **Mock External Services**: Use jest.mock() to mock Redis, database, and other external services when appropriate.

3. **Test Edge Cases**: Include tests for error conditions, boundary values, and edge cases.

4. **Use Test Data Factories**: Create helper functions to generate test data consistently.

5. **Clean Up After Tests**: Always clean up any test data created during tests.

6. **Descriptive Test Names**: Use descriptive names that indicate what's being tested and expected behavior.

7. **Use Test-Driven Development**: Write tests before implementing features when possible.

8. **Focus on User Behavior**: E2E tests should focus on user workflows rather than implementation details.

9. **CI Integration**: Run tests automatically on every pull request and before deployment.

10. **Monitor Test Coverage**: Keep track of test coverage and aim to improve it over time.