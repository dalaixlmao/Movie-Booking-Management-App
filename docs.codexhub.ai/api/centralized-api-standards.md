# API Design Standards for Movie Booking App

This document outlines the standardized API design guidelines for the Movie Booking App. Following these standards ensures consistency, maintainability, and a high-quality developer experience across all APIs.

## API Design Principles

### 1. Resource-Oriented Design

- APIs are designed around **resources** (nouns) rather than actions (verbs)
- Resources are identified by URLs
- Actions on resources are represented by HTTP methods
- Resource relationships are represented in the URL structure

### 2. RESTful Design

- Use appropriate HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Return appropriate HTTP status codes
- Use plural nouns for resource collections
- Use sub-resources for representing relationships

### 3. Consistency

- Consistent URL structure
- Consistent request/response formats
- Consistent error handling
- Consistent pagination, filtering, and sorting

### 4. Security First

- Authentication for all non-public endpoints
- Role-based authorization
- Input validation
- Rate limiting
- HTTPS required for all endpoints

## URL Structure

### Base URL

All API endpoints should use the following base URL pattern:

```
https://{domain}/api/v{version}/{resource}
```

Example: `https://movie-booking-app.com/api/v1/movies`

### Resource Naming

- Use plural nouns for collections: `/movies`, `/bookings`, `/users`
- Use kebab-case for multi-word resources: `/booking-history`
- Use hierarchical structure for related resources: `/movies/{movieId}/showtimes`

### Resource Identification

- Use unique identifiers in URLs: `/movies/123`
- Avoid exposing database IDs when possible, use business keys or UUIDs

## HTTP Methods

| Method | Usage | Example |
|--------|-------|---------|
| GET | Retrieve resources | `GET /movies` (list), `GET /movies/123` (single) |
| POST | Create new resources | `POST /bookings` |
| PUT | Replace existing resources | `PUT /users/123` |
| PATCH | Partially update resources | `PATCH /users/123` |
| DELETE | Remove resources | `DELETE /bookings/123` |

## Request Format

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes (for POST, PUT, PATCH) | Should be `application/json` |
| Authorization | Yes (for protected routes) | JWT token: `Bearer {token}` |
| Accept | No | Specify response format (default: `application/json`) |
| X-Request-ID | No | Client-generated request ID for tracing |
| Accept-Language | No | Preferred language for localization |

### Request Body (POST, PUT, PATCH)

- Use JSON format
- Follow consistent property naming (camelCase)
- Validate all inputs based on defined schemas
- Include only relevant fields

Example:

```json
{
  "movieId": 123,
  "showTimeId": 456,
  "seatIds": [22, 23, 24],
  "paymentMethod": "credit-card"
}
```

## Response Format

### Success Response

All success responses should follow this structure:

```json
{
  "data": {
    // Resource or collection of resources
  },
  "meta": {
    // Metadata about the response (pagination, etc.)
  }
}
```

#### Collection Response Example:

```json
{
  "data": [
    {
      "id": 1,
      "name": "Movie Title",
      "duration": 120,
      "rating": "PG-13"
    },
    // More items
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### Single Resource Response Example:

```json
{
  "data": {
    "id": 1,
    "name": "Movie Title",
    "duration": 120,
    "rating": "PG-13",
    "description": "Movie description...",
    "showtimes": [
      // Related resources
    ]
  },
  "meta": {}
}
```

### Error Response

All error responses should follow this structure:

```json
{
  "message": "Human-readable error message",
  "error": "error_code",
  "details": [
    // Optional detailed error information
  ],
  "requestId": "request-id-for-tracing",
  "timestamp": "2025-08-11T12:00:00Z"
}
```

## HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful resource creation (POST) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authentication succeeded, but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate booking) |
| 422 | Unprocessable Entity | Semantic validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Pagination

Pagination should be consistent across all collection endpoints using the following query parameters:

- `page`: Page number (starting from 1)
- `limit`: Number of items per page (default: 10, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: Order direction (`asc` or `desc`)

Example: `GET /movies?page=2&limit=20&sortBy=releaseDate&sortOrder=desc`

## Filtering

Filtering should use query parameters with consistent naming:

- Simple filters: `field=value` (e.g., `city=Mumbai`)
- Range filters: `field[gt]=value` (e.g., `price[gt]=100`)
- Multiple values: `field=value1,value2` (e.g., `language=English,Hindi`)

Example: `GET /movies?rating=PG-13&releaseDate[gte]=2025-01-01`

## API Versioning

### Version Strategy

- Include version in the URL path: `/api/v1/resource`
- Major version changes for breaking changes
- Minor version changes handled transparently

### Version Headers

Include version information in response headers:

```
X-API-Version: 1.2.0
X-API-Deprecated: false
X-API-Sunset-Date: null
```

## HATEOAS Links (Optional)

For advanced REST implementation, include hypermedia links:

```json
{
  "data": {
    "id": 123,
    // Other properties
  },
  "links": {
    "self": "/api/v1/bookings/123",
    "payment": "/api/v1/bookings/123/payment",
    "cancel": "/api/v1/bookings/123/cancel"
  }
}
```

## API Documentation

All APIs must be documented using OpenAPI (Swagger):

- Complete endpoint documentation
- Request/response schemas
- Example requests and responses
- Error scenarios
- Authentication requirements

### Documentation Access

API documentation should be available at `/api/docs`

## Security Requirements

### Authentication

- Use JWT for authentication
- Short-lived access tokens (1 hour)
- Refresh tokens for obtaining new access tokens
- Include user ID and roles in token claims

### Authorization

- Role-based access control
- Endpoint-level permission checks
- Resource ownership validation

### Input Validation

- Validate all input data against schemas
- Sanitize user input to prevent injection attacks
- Use appropriate data types and constraints

### Rate Limiting

- Apply rate limits based on client IP and/or API key
- Include rate limit headers in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1629824736
  ```

## Caching

Use standard HTTP cache headers:

```
Cache-Control: max-age=3600, public
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 11 Aug 2025 12:00:00 GMT
```

## Logging and Monitoring

Each API request should generate logs with:

- Request ID
- HTTP method and path
- Request timestamp
- Response status code
- Response time
- Client IP and user agent
- User ID (if authenticated)

## Implementation Example

### Endpoint: Get Movie Details

#### Request

```
GET /api/v1/movies/123 HTTP/1.1
Host: movie-booking-app.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### Success Response

```
HTTP/1.1 200 OK
Content-Type: application/json
X-API-Version: 1.0.0
X-Request-ID: req-123456

{
  "data": {
    "id": 123,
    "name": "Inception",
    "languages": ["English", "Hindi"],
    "certificate": "PG-13",
    "rating": "4.5",
    "duration": 148,
    "poster": "https://movie-booking-app.com/posters/inception.jpg",
    "description": "A thief who steals corporate secrets through the use of dream-sharing technology...",
    "releaseDate": "2025-07-16T00:00:00Z",
    "director": "Christopher Nolan",
    "cast": ["Leonardo DiCaprio", "Joseph Gordon-Levitt"]
  },
  "meta": {}
}
```

#### Error Response (Not Found)

```
HTTP/1.1 404 Not Found
Content-Type: application/json
X-API-Version: 1.0.0
X-Request-ID: req-123456

{
  "message": "Movie not found",
  "error": "not_found",
  "requestId": "req-123456",
  "timestamp": "2025-08-11T12:05:23Z"
}
```

### Endpoint: Book Seats

#### Request

```
POST /api/v1/bookings HTTP/1.1
Host: movie-booking-app.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "movieId": 123,
  "cinemaId": 1,
  "showTimeId": 456,
  "seatIds": [22, 23, 24],
  "totalAmount": 750
}
```

#### Success Response

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/bookings/789
X-API-Version: 1.0.0
X-Request-ID: req-123457

{
  "data": {
    "id": 789,
    "status": "confirmed",
    "movie": {
      "id": 123,
      "name": "Inception"
    },
    "cinema": {
      "id": 1,
      "name": "PVR Cinema"
    },
    "showTime": "2025-08-15T18:30:00Z",
    "seats": [
      { "id": 22, "row": "D", "number": 5 },
      { "id": 23, "row": "D", "number": 6 },
      { "id": 24, "row": "D", "number": 7 }
    ],
    "totalAmount": 750,
    "createdAt": "2025-08-11T12:10:15Z",
    "paymentStatus": "pending"
  },
  "meta": {}
}
```

## Conclusion

Following these API design standards ensures that the Movie Booking App provides a consistent, intuitive, and maintainable API experience. These standards should be applied across all new API development and existing APIs should be migrated to conform with these standards over time.