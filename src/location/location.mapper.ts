import { Location } from './location.entity';
import { LocationResponseDto } from './dto/location-response.dto';
import { OpenTimeDto, WeekDay } from './dto/open-time.dto';

function toOpenTimeDto(
  openTime: Location['openTime'],
): OpenTimeDto | undefined {
  if (!openTime) return undefined;

  return {
    days: openTime.days as WeekDay[] | undefined,
    startTime: openTime.startTime,
    endTime: openTime.endTime,
  };
}

function toLocationResponseDtoShallow(location: Location): LocationResponseDto {
  const result = new LocationResponseDto();
  result.id = location.id;
  result.name = location.name;
  result.locationNumber = location.locationNumber;
  result.department = location.department;
  result.capacity = location.capacity;
  result.openTime = toOpenTimeDto(location.openTime);
  return result;
}

export function toLocationResponseDto(location: Location): LocationResponseDto {
  const result = toLocationResponseDtoShallow(location);

  if (location.parent) {
    result.parent = toLocationResponseDtoShallow(location.parent);
  }

  if (location.children?.length) {
    result.children = location.children.map(toLocationResponseDtoShallow);
  }

  return result;
}
