import { IOpenTime } from './dto/open-time.dto';

/**
 * Checks if a given date falls within the openTime rules.
 * Returns true if no rules are defined.
 */
export function isWithinOpenTime(
  openTime: IOpenTime | undefined,
  date: Date,
): boolean {
  if (!openTime) return true;

  const { days, startTime, endTime } = openTime;

  // check day
  if (days && days.length > 0) {
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const day = dayMap[date.getDay()];
    if (!days.map((d) => d.toLowerCase()).includes(day)) return false;
  }

  // check time
  if (startTime && endTime) {
    const toMinutes = (t: string) => {
      const [hh, mm] = t.split(':').map(Number);
      return hh * 60 + mm;
    };
    const current = date.getHours() * 60 + date.getMinutes();
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (start <= end) {
      return current >= start && current < end;
    }

    // overnight range (e.g., 22:00 - 06:00)
    return current >= start || current < end;
  }

  return true;
}
