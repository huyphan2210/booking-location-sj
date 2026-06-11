import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpenTimeDto } from './open-time.dto';

export class LocationResponseDto {
  @ApiProperty({ example: '1b4c5d6e-...' })
  id!: string;

  @ApiProperty({ example: 'Meeting Room 1' })
  name!: string;

  @ApiProperty({ example: 'A-01-01' })
  locationNumber!: string;

  @ApiPropertyOptional({ example: 'EFM' })
  department?: string;

  @ApiPropertyOptional({ example: 10 })
  capacity?: number;

  @ApiPropertyOptional({ type: () => OpenTimeDto })
  openTime?: OpenTimeDto;

  @ApiPropertyOptional({ type: () => LocationResponseDto })
  parent?: LocationResponseDto;

  @ApiPropertyOptional({ type: () => LocationResponseDto, isArray: true })
  children?: LocationResponseDto[];
}
