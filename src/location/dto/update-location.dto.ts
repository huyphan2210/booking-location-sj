import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OpenTimeDto, OpenTimeTimePairValidator } from './open-time.dto';

export class UpdateLocationDto {
  @ApiProperty({ required: false, example: 'Meeting Room 1' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 'A-01-01' })
  @IsOptional()
  @IsString()
  locationNumber?: string;

  @ApiProperty({ required: false, example: 'EFM' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number;

  @ApiProperty({ required: false, type: () => OpenTimeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpenTimeDto)
  @Validate(OpenTimeTimePairValidator)
  openTime?: OpenTimeDto;

  @ApiProperty({ required: false, example: '1b4c5d6e-...' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
