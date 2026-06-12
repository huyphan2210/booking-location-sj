# System Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  NestJS Application                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Controllers                          │   │
│  │  ├── LocationController (/locations)                 │   │
│  │  └── BookingController (/bookings)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Services Layer                           │   │
│  │  ├── LocationService (CRUD + validation)             │   │
│  │  ├── BookingService (CRUD + business logic)          │   │
│  │  └── Shared Utilities (isWithinOpenTime)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Access Layer                        │   │
│  │  ├── TypeORM Repositories                            │   │
│  │  └── Entity Mappers (DTOs)                           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Validation & Guards                      │   │
│  │  ├── DTOs with class-validator decorators            │   │
│  │  └── Custom validators (OpenTimeTimePairValidator)   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────┬─────────────────────────────────────────────────┘
             │ SQL/TypeORM
             ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│  ├── locations                                              │
│  └── bookings                                               │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

### Location Module

**Responsibilities:**

- CRUD operations for locations
- Hierarchical location management
- Location tree building

**Key Files:**

- `location.controller.ts` - HTTP endpoints
- `location.service.ts` - Business logic
- `location.entity.ts` - Data model
- `location.mapper.ts` - DTO mapping
- `dto/*.ts` - Request/response schemas
- `open-time.util.ts` - Shared time validation

**Key Methods:**

- `create(dto)` - Create location (with optional parent)
- `findAll()` - Get all locations (returns tree structure)
- `findOne(id)` - Get specific location with relations
- `update(id, dto)` - Update location
- `remove(id)` - Soft delete (with child checks)

### Booking Module

**Responsibilities:**

- CRUD operations for bookings
- Booking validation against location constraints
- Status management

**Key Files:**

- `booking.controller.ts` - HTTP endpoints
- `booking.service.ts` - Business logic & validation
- `booking.entity.ts` - Data model
- `booking.mapper.ts` - DTO mapping
- `dto/*.ts` - Request/response schemas

**Key Methods:**

- `create(dto)` - Create booking with full validation
- `findAll()` - Get all bookings with location details
- `findOne(id)` - Get specific booking
- `update(id, dto)` - Update booking with re-validation
- `remove(id)` - Soft delete booking
- `validateBookingForLocation()` - Shared validation logic

## Data Flow

### Create Booking Flow

```
Client Request (CreateBookingDto)
        ↓
BookingController.create()
        ↓
DTO Validation (class-validator)
        ↓
BookingService.create()
        ├─ Find Location (with error check)
        ├─ Parse times to Date
        ├─ Validate time range (startTime < endTime)
        ├─ Validate against location:
        │  ├─ Capacity check
        │  ├─ Department matching
        │  ├─ Open hours check
        │  └─ Same-day check
        ├─ Create booking entity
        ├─ Save to DB
        └─ Reload with location relation
        ↓
BookingMapper.toBookingResponseDto()
        ↓
HTTP 201 Response (BookingResponseDto)
```

### Validation Layers

**Layer 1: DTO Validation** (Automatic)

```typescript
// CreateBookingDto
@IsUUID()
locationId!: string;

@IsInt()
@Min(1)
attendees!: number;

@IsDateString()
startTime!: string;
```

**Layer 2: Service Validation** (Manual)

```text
1. Time Range Validation (validateTimeRange)
   - startTime must be before endTime

2. Location Validation (validateBookingForLocation)
   - Capacity check
   - Department check
   - Open hours check
   - Same-day check

3. Availability Validation (validateNoOverlappingBooking)
   - Prevent overlapping bookings for the same location
```

**Layer 3: Database Constraints** (Fallback)

```sql
CHECK (attendees >= 1)
CHECK (end_time > start_time)
```

## Response Mapping

### Purpose

Convert database entities to DTOs to:

- Hide internal structure
- Exclude sensitive fields
- Provide clean API contracts
- Add computed fields if needed

### Pattern

**Entity:**

```typescript
// From database
Booking {
  id: string;
  locationId: string;
  location: Location; // Full nested entity
  department: string;
  attendees: number;
  startTime: Date;
  endTime: Date;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Response DTO:**

```typescript
// To API client
BookingResponseDto {
  id: string;
  location: {
    id: string;
    name: string;
    department?: string;
    capacity?: number;
    openTime?: OpenTimeDto;
  };
  department?: string;
  attendees: number;
  startTime: Date;
  endTime: Date;
  status: string;
}
```

**Mapper:**

```typescript
// booking.mapper.ts
export function toBookingResponseDto(booking: Booking): BookingResponseDto {
  return {
    id: booking.id,
    location: {
      id: booking.location.id,
      name: booking.location.name,
      // ...
    },
    // ...
  };
}
```

## Key Design Patterns

### 1. Soft Delete Pattern

Entities are never hard-deleted; instead, `isDeleted: true` is set.

**Benefits:**

- Preserve historical data
- Enable "undelete" operations
- Support audit trails
- Prevent accidental data loss

**Query Pattern:**

```typescript
await repository.find({
  where: { isDeleted: false },
});
```

### 2. Mapper Pattern

Convert entities to DTOs at service/controller boundaries.

**Benefits:**

- Clean API contracts
- Hide DB structure from clients
- Enable easy schema evolution
- Prevent entity leakage

### 3. Hierarchical Location Model

Self-referencing relationship for parent/child locations.

**Benefits:**

- Support arbitrary depth (building > floor > room)
- Tree queries via `relations: { parent: true, children: true }`
- Constraint enforcement (no circular refs, no deletion with children)

### 4. Shared Utility Functions

Extracted `isWithinOpenTime()` to eliminate duplication.

**Benefits:**

- Single source of truth for business logic
- Easier to test
- Prevents inconsistencies

### 5. Layered Validation

Multi-level validation (DTO → Service → DB).

**Benefits:**

- Early error feedback
- Consistent error messages
- Defense in depth (DB constraints as fallback)

## Error Handling Strategy

### HTTP Status Codes

| Code | Exception           | When                                      |
| ---- | ------------------- | ----------------------------------------- |
| 400  | BadRequestException | Validation fails, business rules violated |
| 404  | NotFoundException   | Entity not found                          |
| 500  | (unhandled)         | Unexpected server error                   |

### Error Messages

All exceptions include descriptive messages:

```typescript
throw new BadRequestException(
  `Attendees (${attendees}) exceeds location capacity (${location.capacity})`,
);

throw new NotFoundException(`Location ${id} not found`);
```

### Logging

Errors are automatically logged by NestJS. For development, console output is used. For production, integrate with a log aggregation service.

## Performance Considerations

### Database

- **Indexes:** location_number (unique), location_id on bookings, composite (location_id, start_time, end_time)
- **Queries:** Use relations selectively; don't load full Location tree unless needed
- **Soft Delete:** Always filter `where: { isDeleted: false }`

### API

- **Response Mapping:** Minimal computation; mostly field projection
- **Tree Building:** O(n) in `buildTree()` method; acceptable for typical sizes
- **Validation:** Done in-service; only validated once per mutation

### Caching

Not currently implemented. Consider adding:

- Location hierarchy cache (invalidate on location updates)
- OpenTime validation cache for frequently checked locations

## Future Enhancements

### Short Term

1. **Logging**
   - Add structured logging (Winston/Bunyan)
   - Log all create/update/delete operations
   - Log booking conflicts or validation failures

2. **Testing**
   - Unit tests for validators
   - Integration tests for service methods
   - E2E tests for API endpoints

3. **Error Handling**
   - Custom exception filters
   - Standardized error response format
   - Request/response logging middleware

### Medium Term

1. **Authentication**
   - JWT token validation
   - User entity with department field
   - Auto-fill booking department from authenticated user

2. **Advanced Features**
   - Booking conflict detection
   - Availability calendar API
   - Booking notifications (email/SMS)
   - Admin dashboard

3. **Database**
   - Proper migration system
   - Audit log table
   - Booking analytics views

### Long Term

1. **Scalability**
   - Database replication
   - Read replicas for queries
   - Caching layer (Redis)
   - Message queue for notifications

2. **Observability**
   - Distributed tracing
   - Metrics collection
   - APM integration
   - Performance monitoring

3. **Multi-Tenancy**
   - Organization/account model
   - Data isolation
   - Per-tenant configuration
