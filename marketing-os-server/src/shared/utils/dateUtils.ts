/**
 * Format a date to ISO date string (YYYY-MM-DD).
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Parse an ISO date string to Date object.
 */
export function parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${dateString}`);
    }
    return date;
}

/**
 * Check if two date ranges overlap.
 */
export function dateRangesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
): boolean {
    return start1 < end2 && start2 < end1;
}

/**
 * Get the number of days between two dates.
 */
export function daysBetween(start: Date, end: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
