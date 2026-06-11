import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpenTimeDto } from '../../location/dto/open-time.dto';

class LocationSummary {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional({ type: () => OpenTimeDto })
  openTime?: OpenTimeDto;
}

export class BookingResponseDto {
  @ApiProperty({ example: '1b4c5d6e-...' })
  id!: string;

  @ApiProperty({ type: () => LocationSummary })
  location!: LocationSummary;

  @ApiPropertyOptional({ example: 'EFM' })
  department?: string;

  @ApiProperty({ example: 5 })
  attendees!: number;

  @ApiProperty({ example: '2026-06-11T09:00:00Z' })
  startTime!: Date;

  @ApiProperty({ example: '2026-06-11T10:00:00Z' })
  endTime!: Date;

  @ApiProperty({ enum: ['pending', 'confirmed', 'cancelled'] })
  status!: 'pending' | 'confirmed' | 'cancelled';
}
