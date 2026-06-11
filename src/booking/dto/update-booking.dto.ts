import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingDto {
  @ApiPropertyOptional({ example: '1b4c5d6e-...' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ example: 'EFM' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  attendees?: number;

  @ApiPropertyOptional({ example: '2026-06-11T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ example: '2026-06-11T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ enum: ['pending', 'confirmed', 'cancelled'] })
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled';
}
