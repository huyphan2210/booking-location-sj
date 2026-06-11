import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateLocationDto } from './create-location.dto';
import { OpenTimeDto } from './open-time.dto';

describe('OpenTimeDto validation', () => {
  it('rejects startTime without endTime', async () => {
    const dto = new CreateLocationDto();
    dto.name = 'Test Location';
    dto.locationNumber = 'LOC-1';

    const openTime = new OpenTimeDto();
    openTime.startTime = '09:00';
    dto.openTime = openTime;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'openTime')).toBe(true);
  });

  it('rejects endTime without startTime', async () => {
    const dto = new CreateLocationDto();
    dto.name = 'Test Location';
    dto.locationNumber = 'LOC-1';

    const openTime = new OpenTimeDto();
    openTime.endTime = '18:00';
    dto.openTime = openTime;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'openTime')).toBe(true);
  });

  it('accepts a valid openTime range', async () => {
    const dto = new CreateLocationDto();
    dto.name = 'Test Location';
    dto.locationNumber = 'LOC-1';

    const openTime = new OpenTimeDto();
    openTime.days = ['mon', 'tue'];
    openTime.startTime = '09:00';
    openTime.endTime = '18:00';
    dto.openTime = openTime;

    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('rejects overnight ranges where startTime is not less than endTime', async () => {
    const dto = new CreateLocationDto();
    dto.name = 'Test Location';
    dto.locationNumber = 'LOC-1';

    const openTime = new OpenTimeDto();
    openTime.days = ['mon'];
    openTime.startTime = '18:00';
    openTime.endTime = '09:00';
    dto.openTime = openTime;

    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'openTime')).toBe(true);
  });
});
