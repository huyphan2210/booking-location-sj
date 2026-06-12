# Database Design

## Overview

The system uses PostgreSQL with TypeORM for object-relational mapping. All entity names follow snake_case convention in the database via `SnakeNamingStrategy`.

## Entity Relationship Diagram

```
Location (1) ──┬─→ (Many) Location (self-reference: parent/children)
               │
               └─→ (Many) Booking

Booking (Many) ──→ (1) Location
```

## Tables

### locations

Stores location/room information with hierarchical support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR | NOT NULL | Location name (e.g., "Meeting Room A") |
| location_number | VARCHAR | NOT NULL, UNIQUE | Location code (e.g., "A-01-01") |
| department | VARCHAR | NULLABLE | Required department for access control |
| capacity | INTEGER | NULLABLE, CHECK (capacity >= 0) | Max attendees |
| open_time | JSONB | NULLABLE | Operating hours and days |
| is_deleted | BOOLEAN | DEFAULT false | Soft delete flag |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last modification timestamp |
| parent_id | UUID | NULLABLE, FK → locations(id) | Parent location for hierarchy |

**Indexes:**
- `location_number` (UNIQUE)
- `parent_id`
- `is_deleted`

### bookings

Stores booking/reservation records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| location_id | UUID | NOT NULL, FK → locations(id) | Booked location |
| department | VARCHAR | NULLABLE | Department making the booking |
| attendees | INTEGER | NOT NULL, CHECK (attendees >= 1) | Number of attendees |
| start_time | TIMESTAMPTZ | NOT NULL | Booking start time |
| end_time | TIMESTAMPTZ | NOT NULL, CHECK (end_time > start_time) | Booking end time |
| status | VARCHAR | DEFAULT 'pending' | pending, confirmed, or cancelled |
| is_deleted | BOOLEAN | DEFAULT false | Soft delete flag |
| created_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT now() | Last modification timestamp |

**Indexes:**
- `location_id`
- `start_time`
- `end_time`
- `is_deleted`
- Composite: `(location_id, start_time, end_time)` for availability queries

## Data Types

### open_time (JSONB)

Structure stored in `locations.open_time`:

```json
{
  "days": ["mon", "tue", "wed", "thu", "fri"],
  "startTime": "09:00",
  "endTime": "18:00"
}
```

**Fields:**
- `days` (string[]): Allowed days (mon-sun)
- `startTime` (string): Opening time in HH:MM format
- `endTime` (string): Closing time in HH:MM format

All fields are optional. If not specified, the location is available 24/7.

## Relationships

### Location → Location (Self-Join)

- **Type:** One-to-Many (self-referencing)
- **Foreign Key:** `location.parent_id → location.id`
- **Cascade:** `onDelete: 'SET NULL'`
- **Use Case:** Support hierarchical organization (building > floor > room)

### Location ← Booking (Many-to-One)

- **Type:** Many-to-One
- **Foreign Key:** `booking.location_id → location.id`
- **Cascade:** No cascade delete (bookings are soft-deleted)
- **Use Case:** Associate bookings with specific locations

## Constraints & Validation

### Location Constraints

1. **Unique location_number** - prevents duplicate location codes
2. **Capacity >= 0** - non-negative attendee limit
3. **No circular references** - cannot be own parent (validated in service layer)
4. **Cannot delete with children** - must delete/reparent children first (service layer)

### Booking Constraints

1. **Attendees >= 1** - must have at least one attendee
2. **end_time > start_time** - end must be after start
3. **Capacity check** - attendees ≤ location.capacity (service layer)
4. **Open hours check** - booking times within location.open_time (service layer)
5. **Department matching** - if location has department, booking must match (service layer)
6. **Same-day booking** - if location has open_time, booking must be same calendar day (service layer)

## Performance Considerations

### Indexes

- `location_number` UNIQUE for fast lookups by code
- `location_id, start_time, end_time` composite for availability queries
- `is_deleted` for filtering soft-deleted records

### Query Patterns

**Find bookings for a location within time range:**
```sql
SELECT * FROM bookings 
WHERE location_id = $1 
  AND start_time < $2 
  AND end_time > $3 
  AND is_deleted = false;
```

**List all active locations with hierarchy:**
```sql
SELECT * FROM locations 
WHERE is_deleted = false 
ORDER BY parent_id, name;
```

## Migration Strategy

### TypeORM Auto-Load

Entities are auto-loaded in `app.module.ts` via:
```typescript
TypeOrmModule.forRoot({
  autoLoadEntities: true,
  // ...
})
```

This automatically discovers and creates tables for all `@Entity()` decorated classes.

### Schema Synchronization

In development mode, `synchronize: true` auto-creates/updates schema. For production, use proper migration files.

## Soft Delete Pattern

Both `Location` and `Booking` use soft deletion via `isDeleted` boolean:

```typescript
// Deletion
entity.isDeleted = true;
await repository.save(entity);

// Querying (excludes deleted)
const active = await repository.find({ where: { isDeleted: false } });
```

This preserves historical data for auditing and allows "undelete" operations.

## Future Enhancements

- Implement audit log table
- Add user table for authentication
- Support booking recurrence patterns
