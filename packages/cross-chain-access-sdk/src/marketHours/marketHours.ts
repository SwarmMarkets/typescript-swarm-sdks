/**
 * Market hours checker with account status validation.
 *
 * US stock market hours (converted to UTC):
 * - Open: 14:30 UTC (9:30 AM EST)
 * - Close: 21:00 UTC (4:00 PM EST)
 * - Days: Monday - Friday
 */

/** Market open time in UTC (hours, minutes) */
const MARKET_OPEN_UTC = { hour: 14, minute: 30 };

/** Market close time in UTC (hours, minutes) */
const MARKET_CLOSE_UTC = { hour: 21, minute: 0 };

/**
 * Market status result.
 */
export interface MarketStatus {
  isOpen: boolean;
  message: string;
}

/**
 * Convert a date to UTC components.
 */
function getUTCTimeComponents(date: Date): {
  weekday: number;
  hour: number;
  minute: number;
} {
  return {
    weekday: date.getUTCDay(), // 0 = Sunday, 6 = Saturday
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

/**
 * Compare time with market time.
 */
function timeInMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Check if market is currently open based on time.
 *
 * @param date - Date to check (defaults to current time)
 * @returns True if market is open (weekday between 14:30-21:00 UTC)
 */
export function isMarketOpen(date: Date = new Date()): boolean {
  const { weekday, hour, minute } = getUTCTimeComponents(date);

  // Check if it's a weekday (Monday=1, Sunday=0, Saturday=6)
  if (weekday === 0 || weekday === 6) {
    return false;
  }

  const currentTimeMinutes = timeInMinutes(hour, minute);
  const openTimeMinutes = timeInMinutes(
    MARKET_OPEN_UTC.hour,
    MARKET_OPEN_UTC.minute
  );
  const closeTimeMinutes = timeInMinutes(
    MARKET_CLOSE_UTC.hour,
    MARKET_CLOSE_UTC.minute
  );

  return (
    currentTimeMinutes >= openTimeMinutes &&
    currentTimeMinutes <= closeTimeMinutes
  );
}

/**
 * Calculate time until market opens.
 *
 * @param date - Date to check (defaults to current time)
 * @returns Milliseconds until market opens (0 if already open)
 */
export function timeUntilOpen(date: Date = new Date()): number {
  if (isMarketOpen(date)) {
    return 0;
  }

  const { weekday, hour, minute } = getUTCTimeComponents(date);
  const currentTimeMinutes = timeInMinutes(hour, minute);
  const openTimeMinutes = timeInMinutes(
    MARKET_OPEN_UTC.hour,
    MARKET_OPEN_UTC.minute
  );

  // Calculate days to add
  let daysToAdd = 0;

  // If it's weekend or past market hours today
  if (weekday === 0) {
    // Sunday -> Monday
    daysToAdd = 1;
  } else if (weekday === 6) {
    // Saturday -> Monday
    daysToAdd = 2;
  } else if (currentTimeMinutes >= openTimeMinutes) {
    // Past open time today, go to next weekday
    daysToAdd = 1;
    if (weekday === 5) {
      // Friday -> Monday
      daysToAdd = 3;
    }
  }

  // Create target date at market open
  const targetDate = new Date(date);
  targetDate.setUTCDate(targetDate.getUTCDate() + daysToAdd);
  targetDate.setUTCHours(MARKET_OPEN_UTC.hour, MARKET_OPEN_UTC.minute, 0, 0);

  return targetDate.getTime() - date.getTime();
}

/**
 * Calculate time until market closes.
 *
 * @param date - Date to check (defaults to current time)
 * @returns Milliseconds until market closes (0 if closed)
 */
export function timeUntilClose(date: Date = new Date()): number {
  if (!isMarketOpen(date)) {
    return 0;
  }

  // Create target date at market close
  const targetDate = new Date(date);
  targetDate.setUTCHours(MARKET_CLOSE_UTC.hour, MARKET_CLOSE_UTC.minute, 0, 0);

  return targetDate.getTime() - date.getTime();
}

/**
 * Format milliseconds as hours and minutes.
 */
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Get market status with human-readable message.
 *
 * @param date - Date to check (defaults to current time)
 * @returns MarketStatus with isOpen and message
 */
export function getMarketStatus(date: Date = new Date()): MarketStatus {
  const isOpen = isMarketOpen(date);

  if (isOpen) {
    const timeLeft = timeUntilClose(date);
    return {
      isOpen: true,
      message: `Market is open. Closes in ${formatDuration(timeLeft)}`,
    };
  } else {
    const timeLeft = timeUntilOpen(date);
    return {
      isOpen: false,
      message: `Market is closed. Opens in ${formatDuration(timeLeft)}`,
    };
  }
}

/**
 * MarketHours class for static-style access.
 */
export const MarketHours = {
  isMarketOpen,
  timeUntilOpen,
  timeUntilClose,
  getMarketStatus,
} as const;
