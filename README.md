# Booking Location API

RESTful API for managing hierarchical building locations and room bookings.

This project was developed as part of the SJ Assignment 2026 and is built with NestJS, TypeScript, TypeORM, and PostgreSQL.

## Features

### Location Management

- Create, read, update, and delete locations
- Support hierarchical location structures (Building → Floor → Room)
- Retrieve locations as a tree structure
- Soft-delete support

### Booking Management

- Create, read, update, and delete bookings
- Department validation
- Capacity validation
- Open-time validation
- Booking overlap detection
- Soft-delete support

### Technical Features

- Swagger API documentation
- DTO validation using class-validator
- Global exception handling
- Logging using NestJS Logger
- PostgreSQL persistence via TypeORM

## Technology Stack

- Node.js
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Docker & Docker Compose
- Swagger (OpenAPI)

## Documentation

Additional project documentation can be found in:

- [System Design](./docs/SYSTEM_DESIGN.md)
- [Database Design](./docs/DATABASE.md)

## Quick Start

### Prerequisites

- Docker
- Docker Compose
- Node.js 22+
- npm

### Setup

1. Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=booking_location

PORT=3000
```

2. Start PostgreSQL with Docker:

```bash
docker-compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Seed sample data (optional):

```bash
npm run seed
```

5. Start the application:

```bash
npm run start:dev
```

Swagger UI:

```text
http://localhost:3000/api
```

## Seed Data

The optional seed script creates a sample location hierarchy and bookings to demonstrate the application's business rules.

### Locations

```text
Headquarters
├── Floor 1
│   ├── EFM Meeting Room
│   └── IT Collaboration Room
└── Floor 2
    └── Executive Board Room

Operations Center
└── Floor 5
    └── HR Interview Room
```

### Sample Bookings

The seed data includes example bookings that demonstrate:

- Department validation
- Capacity constraints
- Open-time restrictions
- Booking conflict detection

Run the seed script:

```bash
npm run seed
```

## Design Decisions

This implementation prioritizes simplicity, readability, and maintainability while satisfying the assignment requirements.

To keep the solution focused and easy to evaluate:

- TypeORM schema synchronization (`synchronize: true`) is used instead of migrations.
- Authentication and authorization are out of scope.
- Booking conflict detection is implemented at the application layer.
- Soft deletion is used to preserve historical records.
- A small seed dataset is provided for demonstration purposes.

In a production environment, additional concerns such as migrations, authentication, monitoring, caching, and automated testing would be implemented.

## Assumptions

The following assumptions were made during implementation.

### Location Hierarchy

- Locations are organized in a parent-child hierarchy.
- Any location may have child locations.
- A location cannot be assigned to itself as a parent.
- A location with active child locations cannot be deleted.

### Open Time

- Open time is optional.
- If open time is not defined, the location is considered available at all times.
- Bookings must fall entirely within the configured open-time window.
- For locations with open-time restrictions, bookings cannot span multiple calendar days.

### Department Validation

- If a location specifies a department, booking requests must use the same department.
- If no department is configured for the location, any department may book it.

### Capacity Validation

- Capacity is optional.
- If capacity is defined, the number of attendees must not exceed it.

### Booking Conflicts

- Two bookings for the same location cannot overlap.
- Booking intervals are treated as half-open intervals: `[startTime, endTime)`.
- A booking ending at 10:00 and another starting at 10:00 are allowed.

### Deletion Strategy

- Locations and bookings are soft deleted using the `isDeleted` flag.
- Historical records are preserved for auditing and future recovery.

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api
```

## Future Improvements

- Unit and integration test coverage
- Authentication and authorization
- TypeORM migrations for controlled schema evolution
- Structured logging
- Availability search APIs
- Booking notifications
- Audit trail support
- Caching for location hierarchy queries
- Database-level constraints for booking conflict prevention
- Monitoring and observability
