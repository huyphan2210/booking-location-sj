import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const WeekDays = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type WeekDay = (typeof WeekDays)[number];

export interface IOpenTime {
  days?: WeekDay[];
  startTime?: string;
  endTime?: string;
}

@ValidatorConstraint({ name: 'OpenTimeTimePair', async: false })
export class OpenTimeTimePairValidator implements ValidatorConstraintInterface {
  validate(
    value: OpenTimeDto | undefined,
    _args: ValidationArguments,
  ): boolean {
    // ValidationArguments is unused; prefix with underscore to satisfy lint.
    void _args;

    if (!value) return true;

    const hasStartTime = !!value.startTime;
    const hasEndTime = !!value.endTime;
    if (hasStartTime !== hasEndTime) {
      return false;
    }

    if (hasStartTime && hasEndTime) {
      const toMinutes = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
      };
      const start = toMinutes(value.startTime as string);
      const end = toMinutes(value.endTime as string);
      return start < end;
    }

    return true;
  }

  defaultMessage(): string {
    return 'startTime and endTime must either both be defined or both omitted, and startTime must be earlier than endTime';
  }
}

export class OpenTimeDto {
  @ApiProperty({
    required: false,
    isArray: true,
    enum: WeekDays,
    example: ['mon', 'tue', 'wed'],
    description: 'Days of the week when the location is open',
  })
  @IsOptional()
  @IsArray()
  @IsIn(WeekDays, { each: true })
  days?: WeekDay[];

  // HH:MM 24-hour format
  @ApiProperty({
    required: false,
    example: '09:00',
    description: 'Opening time in HH:MM 24-hour format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime?: string;

  @ApiProperty({
    required: false,
    example: '18:00',
    description: 'Closing time in HH:MM 24-hour format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime?: string;
}
