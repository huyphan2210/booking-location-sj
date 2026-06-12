import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { Booking } from './booking.entity';
import { Location } from '../location/location.entity';
import { toBookingResponseDto } from './booking.mapper';
import { isWithinOpenTime } from '../location/open-time.util';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    this.logger.log(
      `Creating booking for location: ${dto.locationId}, attendees: ${dto.attendees}`,
    );

    const location = await this.findActiveLocation(dto.locationId);
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    this.validateTimeRange(startTime, endTime);

    this.validateBookingForLocation(
      location,
      startTime,
      endTime,
      dto.attendees,
      dto.department,
    );

    await this.validateNoOverlappingBooking(dto.locationId, startTime, endTime);

    const booking = this.bookingRepository.create({
      locationId: dto.locationId,
      department: dto.department,
      attendees: dto.attendees,
      startTime,
      endTime,
      status: 'pending',
    });

    const saved = await this.bookingRepository.save(booking);
    this.logger.log(`Booking created with id: ${saved.id}`);
    const withLocation = await this.findBookingWithLocation(saved.id);

    return toBookingResponseDto(withLocation);
  }

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingRepository.find({
      where: { isDeleted: false },
      relations: { location: true },
    });

    return bookings.map(toBookingResponseDto);
  }

  async findOne(id: string): Promise<BookingResponseDto> {
    const booking = await this.findBookingWithLocation(id);
    return toBookingResponseDto(booking);
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingResponseDto> {
    this.logger.log(`Updating booking: ${id}`);

    const booking = await this.findBookingWithLocation(id);

    if (dto.locationId && dto.locationId !== booking.locationId) {
      const newLocation = await this.findActiveLocation(dto.locationId);
      booking.location = newLocation;
      booking.locationId = dto.locationId;
    }

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : booking.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : booking.endTime;

    this.validateTimeRange(startTime, endTime);

    const finalDepartment = dto.department ?? booking.department;
    const finalAttendees = dto.attendees ?? booking.attendees;

    this.validateBookingForLocation(
      booking.location,
      startTime,
      endTime,
      finalAttendees,
      finalDepartment,
    );

    await this.validateNoOverlappingBooking(
      booking.locationId,
      startTime,
      endTime,
      booking.id,
    );

    Object.assign(booking, {
      department: finalDepartment,
      attendees: finalAttendees,
      startTime,
      endTime,
      status: dto.status ?? booking.status,
    });

    const updated = await this.bookingRepository.save(booking);
    this.logger.log(`Booking updated: ${updated.id}`);

    const withLocation = await this.findBookingWithLocation(updated.id);

    return toBookingResponseDto(withLocation);
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting booking: ${id}`);

    const booking = await this.findBookingWithoutLocation(id);
    booking.isDeleted = true;
    await this.bookingRepository.save(booking);

    this.logger.log(`Booking deleted: ${id}`);
  }

  private async findBookingWithLocation(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
      relations: { location: true },
    });

    if (!booking) {
      this.logger.warn(`Booking ${id} not found`);
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  private async findBookingWithoutLocation(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${id} not found`);
    }

    return booking;
  }

  private async findActiveLocation(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!location) {
      this.logger.warn(`Location ${id} not found`);
      throw new NotFoundException(`Location ${id} not found`);
    }

    return location;
  }

  private validateTimeRange(startTime: Date, endTime: Date): void {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }
  }

  private async validateNoOverlappingBooking(
    locationId: string,
    newStartTime: Date,
    newEndTime: Date,
    ignoreBookingId?: string,
  ): Promise<void> {
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.locationId = :locationId', { locationId })
      .andWhere('booking.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('booking.startTime < :newEndTime', { newEndTime })
      .andWhere('booking.endTime > :newStartTime', { newStartTime });

    if (ignoreBookingId) {
      qb.andWhere('booking.id <> :ignoreBookingId', { ignoreBookingId });
    }

    const exists = await qb.getExists();

    if (exists) {
      this.logger.warn(
        `Booking validation failed: time conflicts with an existing booking for location ${locationId}`,
      );
      throw new BadRequestException(
        'Booking time conflicts with an existing booking for this location',
      );
    }
  }

  private validateBookingForLocation(
    location: Location,
    startTime: Date,
    endTime: Date,
    attendees: number,
    department?: string,
  ): void {
    if (location.capacity != undefined && attendees > location.capacity) {
      this.logger.warn(
        `Booking validation failed: attendees (${attendees}) exceeds capacity (${location.capacity})`,
      );
      throw new BadRequestException(
        `Attendees (${attendees}) exceeds location capacity (${location.capacity})`,
      );
    }

    if (location.department) {
      if (!department) {
        this.logger.warn(
          `Booking validation failed: location requires department but none provided`,
        );
        throw new BadRequestException(
          `Location department (${location.department}) requires a booking department`,
        );
      }
      if (department !== location.department) {
        this.logger.warn(
          `Booking validation failed: department (${department}) does not match location department (${location.department})`,
        );
        throw new BadRequestException(
          `Booking department (${department}) does not match location department (${location.department})`,
        );
      }
    }

    if (location.openTime) {
      if (endTime.getTime() < new Date().getTime()) {
        throw new BadRequestException('Booking time is in the past');
      }
      if (!isWithinOpenTime(location.openTime, startTime)) {
        throw new BadRequestException(
          'Booking start time is outside location open hours',
        );
      }
      if (!isWithinOpenTime(location.openTime, endTime)) {
        throw new BadRequestException(
          'Booking end time is outside location open hours',
        );
      }
      if (startTime.toDateString() !== endTime.toDateString()) {
        throw new BadRequestException(
          'Booking must start and end on the same day for this location',
        );
      }
    }
  }
}
