import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { Booking } from '../booking/booking.entity';
import { Location } from '../location/location.entity';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get(DataSource);

    const locationRepository = dataSource.getRepository(Location);
    const bookingRepository = dataSource.getRepository(Booking);

    const existingLocations = await locationRepository.count();

    if (existingLocations > 0) {
      console.log('Database already contains data. Skipping seed.');
      return;
    }

    console.log('Seeding database...');

    //
    // Headquarters
    //
    const headquarters = await locationRepository.save(
      locationRepository.create({
        name: 'Headquarters',
        locationNumber: 'HQ',
      }),
    );

    const floor1 = await locationRepository.save(
      locationRepository.create({
        name: 'Floor 1',
        locationNumber: 'HQ-F1',
        parent: headquarters,
      }),
    );

    const floor2 = await locationRepository.save(
      locationRepository.create({
        name: 'Floor 2',
        locationNumber: 'HQ-F2',
        parent: headquarters,
      }),
    );

    const efmMeetingRoom = await locationRepository.save(
      locationRepository.create({
        name: 'EFM Meeting Room',
        locationNumber: 'HQ-F1-R1',
        department: 'EFM',
        capacity: 10,
        openTime: {
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          startTime: '09:00',
          endTime: '18:00',
        },
        parent: floor1,
      }),
    );

    const itCollaborationRoom = await locationRepository.save(
      locationRepository.create({
        name: 'IT Collaboration Room',
        locationNumber: 'HQ-F1-R2',
        department: 'IT',
        capacity: 20,
        openTime: {
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          startTime: '08:00',
          endTime: '18:00',
        },
        parent: floor1,
      }),
    );

    const executiveBoardRoom = await locationRepository.save(
      locationRepository.create({
        name: 'Executive Board Room',
        locationNumber: 'HQ-F2-R1',
        capacity: 15,
        openTime: {
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          startTime: '08:00',
          endTime: '18:00',
        },
        parent: floor2,
      }),
    );

    //
    // Operations Center
    //
    const operationsCenter = await locationRepository.save(
      locationRepository.create({
        name: 'Operations Center',
        locationNumber: 'OPS',
      }),
    );

    const floor5 = await locationRepository.save(
      locationRepository.create({
        name: 'Floor 5',
        locationNumber: 'OPS-F5',
        parent: operationsCenter,
      }),
    );

    const hrInterviewRoom = await locationRepository.save(
      locationRepository.create({
        name: 'HR Interview Room',
        locationNumber: 'OPS-F5-R1',
        department: 'HR',
        capacity: 8,
        openTime: {
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          startTime: '08:30',
          endTime: '17:30',
        },
        parent: floor5,
      }),
    );

    //
    // Sample bookings
    //
    await bookingRepository.save([
      bookingRepository.create({
        locationId: efmMeetingRoom.id,
        location: efmMeetingRoom,
        department: 'EFM',
        attendees: 5,
        startTime: new Date('2026-06-15T09:00:00Z'),
        endTime: new Date('2026-06-15T10:00:00Z'),
        status: 'confirmed',
      }),

      bookingRepository.create({
        locationId: itCollaborationRoom.id,
        location: itCollaborationRoom,
        department: 'IT',
        attendees: 12,
        startTime: new Date('2026-06-15T13:00:00Z'),
        endTime: new Date('2026-06-15T14:30:00Z'),
        status: 'confirmed',
      }),

      bookingRepository.create({
        locationId: hrInterviewRoom.id,
        location: hrInterviewRoom,
        department: 'HR',
        attendees: 4,
        startTime: new Date('2026-06-16T10:00:00Z'),
        endTime: new Date('2026-06-16T11:00:00Z'),
        status: 'pending',
      }),

      bookingRepository.create({
        locationId: executiveBoardRoom.id,
        location: executiveBoardRoom,
        department: 'Leadership',
        attendees: 8,
        startTime: new Date('2026-06-17T09:00:00Z'),
        endTime: new Date('2026-06-17T10:30:00Z'),
        status: 'confirmed',
      }),
    ]);

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void seed();
