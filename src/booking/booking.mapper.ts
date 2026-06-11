import { Booking } from './booking.entity';
import { BookingResponseDto } from './dto/booking-response.dto';
import { OpenTimeDto, IOpenTime } from '../location/dto/open-time.dto';

function toOpenTimeDto(
  openTime: IOpenTime | undefined,
): OpenTimeDto | undefined {
  if (!openTime) return undefined;

  return {
    days: openTime.days,
    startTime: openTime.startTime,
    endTime: openTime.endTime,
  };
}

export function toBookingResponseDto(booking: Booking): BookingResponseDto {
  const result = new BookingResponseDto();
  result.id = booking.id;
  result.location = {
    id: booking.location.id,
    name: booking.location.name,
    department: booking.location.department,
    capacity: booking.location.capacity,
    openTime: toOpenTimeDto(booking.location.openTime),
  };
  result.department = booking.department;
  result.attendees = booking.attendees;
  result.startTime = booking.startTime;
  result.endTime = booking.endTime;
  result.status = booking.status;
  return result;
}
