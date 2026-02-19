/**
 * Application-wide constants.
 */

export const API_PREFIX = '/api/v1';

export const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100,
};

export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
};

export const AUTH = {
    SALT_ROUNDS: 10,
    RESET_TOKEN_TTL: 15 * 60, // 15 minutes in seconds
};

export const MODULES = [
    'auth',
    'users',
    'admin',
    'billing',
    'marketing',
    'growth',
    'revenue',
    'crm',
    'email',
    'product',
    'ai',
    'ads',
    'monitoring',
    'store',
    'whatsapp',
    'automation',
    'inbox',
] as const;
