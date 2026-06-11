import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '1b4c5d6e-...' })
  @IsUUID()
  locationId!: string;

  @ApiProperty({ required: false, example: 'EFM' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  attendees!: number;

  @ApiProperty({ example: '2026-06-11T09:00:00Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-06-11T10:00:00Z' })
  @IsDateString()
  endTime!: string;
}
