# Authentication System Documentation

This document provides a detailed overview of the authentication system used in the Movie Booking App, which is built using NextAuth.js.

## Overview

The authentication system is implemented using NextAuth.js, a complete authentication solution for Next.js applications. It provides a flexible and secure way to handle user authentication with various providers. In this application, we use the Credentials provider for email/password authentication.

## Authentication Flow

### Sign-Up Process

1. User enters their details (name, email, password, phone) on the sign-up page
2. The form data is submitted to the NextAuth API endpoint
3. The server validates the input data using Zod schema validation
4. The password is hashed using bcrypt
5. A new user record is created in the database
6. A session is established for the newly created user
7. The user is redirected to the dashboard

### Sign-In Process

1. User enters their email and password on the sign-in page
2. The credentials are submitted to the NextAuth API endpoint
3. The server validates the input data
4. The submitted password is compared with the stored hash using bcrypt
5. If authentication succeeds, a session is established
6. The user is redirected to the dashboard

## Implementation Details

### NextAuth Configuration

The NextAuth configuration is defined in `/apps/user-app/lib/auth.ts`:

```typescript
// Key parts of the NextAuth configuration
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
        // Authentication logic here
      }
    }),
  ],
  secret: process.env.NEXTAUTH_URL || "",
  callbacks: {
    async session({ token, session }: any) {
      session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    signUp: "/signup",
  },
};
```

### API Route

The NextAuth API route is defined at `/apps/user-app/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### User Schema

Users are stored in the database according to the following Prisma schema:

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

## Security Measures

### Password Hashing

Passwords are hashed using bcrypt before being stored in the database:

```typescript
const hashedPass = await hash(password, 10);
```

### Input Validation

User inputs are validated using Zod schema validation:

```typescript
const bodySchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
  name: zod.string(),
  phone: zod.string(),
});

const res = bodySchema.safeParse({
  email,
  password,
  name,
  phone,
});

if (!res.success) return null;
```

### Session Handling

NextAuth handles session management with secure cookies and server-side session validation.

## Session Data

The session object contains the following user information:

```typescript
{
  user: {
    id: string, // User ID from the database
    // Other user details can be added via the session callback
  },
  expires: string // ISO date when the session expires
}
```

## Protected Routes

To protect routes that require authentication, use the `getServerSession` function:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // If no session exists, user is not authenticated
  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }
  
  const userId = Number(session.user.id);
  
  // Rest of the protected route logic
}
```

## Client-Side Authentication

To check authentication status on the client side, use the `useSession` hook from NextAuth:

```tsx
'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <p>Loading...</p>;
  }
  
  if (status === "unauthenticated") {
    redirect("/signin");
  }
  
  // Render protected content
  return (
    <div>
      <p>Welcome, {session?.user?.name}!</p>
    </div>
  );
}
```

## Authentication Flows Diagrams

### Sign-Up Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Sign-Up    │────▶│   NextAuth  │────▶│    Input    │────▶│   Create    │
│    Form     │     │    API      │     │ Validation  │     │    User     │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Redirect   │◀────│   Create    │◀────│    Hash     │◀────│    User     │
│ to Dashboard│     │   Session   │     │  Password   │     │   Details   │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Sign-In Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Sign-In    │────▶│   NextAuth  │────▶│    Find     │────▶│   Compare   │
│    Form     │     │    API      │     │    User     │     │  Passwords  │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Redirect   │◀────│   Create    │◀────│ Verification│◀────│ Authentication│
│ to Dashboard│     │   Session   │     │  Success    │     │  Success/Fail │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Best Practices

1. **Never store passwords in plain text**: Always hash passwords using a strong algorithm like bcrypt.
2. **Validate all user inputs**: Use a schema validation library like Zod to ensure data integrity.
3. **Use HTTPS**: Always serve authentication requests over HTTPS in production.
4. **Implement rate limiting**: Protect authentication endpoints from brute force attacks.
5. **Keep authentication logic on the server**: Never perform authentication in client-side code.
6. **Use secure cookies**: NextAuth uses HttpOnly, secure cookies by default.
7. **Set appropriate session timeouts**: Configure session lifetime based on security requirements.

## Environment Variables

The following environment variables are required for authentication:

```
NEXTAUTH_SECRET=your_secure_random_string
NEXTAUTH_URL=https://your-app-url.com
```

For development:

```
NEXTAUTH_URL=http://localhost:3000
```

## Troubleshooting

### Common Issues

1. **"Error: No authorization token was found"**
   - Ensure the user is authenticated before accessing protected routes
   - Check if the session cookie is being properly set

2. **"Error: Invalid credentials"**
   - Verify the email and password combination
   - Check if the user exists in the database

3. **"Error: CSRF token mismatch"**
   - Ensure the form submission includes the CSRF token
   - Check if the cookie is being properly set

### Debugging Authentication

To debug authentication issues:

1. Enable debug mode in NextAuth:

```typescript
export const authOptions = {
  // other options
  debug: process.env.NODE_ENV === 'development',
};
```

2. Check the browser's network tab for API responses from `/api/auth/*` endpoints

3. Verify that cookies are being properly set in the browser's storage inspector

## Integration with Booking System

The authenticated user's ID is used throughout the booking flow to:

1. Filter movies by the user's location
2. Associate bookings with the user
3. Check the user's balance for payment
4. Track the user's booking history