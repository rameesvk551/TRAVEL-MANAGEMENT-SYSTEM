import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ── ID & Slug Generators ──

export function generateId(): string {
    return uuidv4();
}

export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// ── Date Utilities ──

export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${dateString}`);
    }
    return date;
}

export function dateRangesOverlap(
    start1: Date, end1: Date,
    start2: Date, end2: Date
): boolean {
    return start1 < end2 && start2 < end1;
}

export function daysBetween(start: Date, end: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// ── Encryption Utilities ──

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(secret: string): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
}

export const encrypt = (text: string, secret: string): string => {
    const key = getEncryptionKey(secret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string, secret: string): string => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = getEncryptionKey(secret);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
