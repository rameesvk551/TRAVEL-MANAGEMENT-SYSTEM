import crypto from 'crypto';

const ENCRYPTED_PREFIX = 'enc:v1';

function getKey(): Buffer | null {
    const rawKey = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY?.trim();
    if (!rawKey) {
        return null;
    }

    // Derive a 32-byte key from any input format (raw/base64/hex).
    return crypto.createHash('sha256').update(rawKey).digest();
}

export function encryptSecret(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    if (value.startsWith(`${ENCRYPTED_PREFIX}:`)) {
        return value;
    }

    const key = getKey();
    if (!key) {
        return value;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTED_PREFIX}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    if (!value.startsWith(`${ENCRYPTED_PREFIX}:`)) {
        return value;
    }

    const key = getKey();
    if (!key) {
        throw new Error('WHATSAPP_TOKEN_ENCRYPTION_KEY is required to decrypt stored WhatsApp credentials');
    }

    const parts = value.split(':');
    if (parts.length !== 5) {
        throw new Error('Invalid encrypted credential format');
    }

    const [, , ivBase64, authTagBase64, encryptedBase64] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivBase64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, 'base64')),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}
