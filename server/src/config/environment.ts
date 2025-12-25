import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DatabaseConfig {
    url: string;
    mongodbUrl: string;
    poolMin: number;
    poolMax: number;
}

interface JwtConfig {
    secret: string;
    expiresIn: string;
}

interface ServerConfig {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
}

interface WhatsAppMetaConfig {
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    apiVersion?: string;
}

interface WhatsAppConfig {
    provider: 'meta' | 'twilio' | 'vonage' | 'mock';
    meta?: WhatsAppMetaConfig;
    appSecret?: string;
    verifyToken?: string;
}

interface Config {
    server: ServerConfig;
    database: DatabaseConfig;
    jwt: JwtConfig;
    defaultTenantSlug: string;
    whatsapp: WhatsAppConfig;
}

function getEnvOrThrow(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const config: Config = {
    server: {
        port: parseInt(getEnvOrDefault('PORT', '5000'), 10),
        nodeEnv: getEnvOrDefault('NODE_ENV', 'development'),
        corsOrigin: getEnvOrDefault('CORS_ORIGIN', 'http://localhost:3000'),
    },
    database: {
        url: getEnvOrThrow('DATABASE_URL'),
        mongodbUrl: getEnvOrDefault('MONGODB_URL', 'mongodb://localhost:27017/travel_management'),
        poolMin: parseInt(getEnvOrDefault('DATABASE_POOL_MIN', '2'), 10),
        poolMax: parseInt(getEnvOrDefault('DATABASE_POOL_MAX', '10'), 10),
    },
    jwt: {
        secret: getEnvOrThrow('JWT_SECRET'),
        expiresIn: getEnvOrDefault('JWT_EXPIRES_IN', '7d'),
    },
    defaultTenantSlug: getEnvOrDefault('DEFAULT_TENANT_SLUG', 'default'),
    whatsapp: {
        provider: (getEnvOrDefault('WHATSAPP_PROVIDER', 'mock') as WhatsAppConfig['provider']),
        meta: {
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            apiVersion: getEnvOrDefault('WHATSAPP_API_VERSION', 'v18.0'),
        },
        appSecret: process.env.WHATSAPP_APP_SECRET,
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    },
};

export const isDevelopment = config.server.nodeEnv === 'development';
export const isProduction = config.server.nodeEnv === 'production';

// Export config getter for DI
export function getConfig(): Config {
    return config;
}
