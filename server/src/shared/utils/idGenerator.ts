import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new UUID v4.
 */
export function generateId(): string {
    return uuidv4();
}

/**
 * Generate a slug from a string.
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
