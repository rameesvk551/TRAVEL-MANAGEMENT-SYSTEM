import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Helper functions ──

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

function getEnvAsBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

// ── Config Interfaces ──

export interface DatabaseConfig {
    url: string;
    poolMin: number;
    poolMax: number;
}

export interface JwtConfig {
    secret: string;
    expiresIn: string;
}

export interface ServerConfig {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
}

export interface WhatsAppMetaConfig {
    accessToken?: string;
    phoneNumberId?: string;
    businessAccountId?: string;
    apiVersion?: string;
    appId?: string;
    appSecret?: string;
    systemUserToken?: string;
    appWabaId?: string;
}

export interface WhatsAppConfig {
    meta?: WhatsAppMetaConfig;
    appSecret?: string;
    verifyToken?: string;
}

export interface InstagramConfig {
    accessToken: string;
    pageId: string;
}

export interface RedisConfig {
    host: string;
    port: number;
}

export interface BillingConfig {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpayWebhookSecret: string;
    razorpayMonthlyPlanId?: string;
    razorpayYearlyPlanId?: string;
    usageCronEnabled: boolean;
    usageCronSchedule: string;
    reconciliationCronEnabled: boolean;
    reconciliationCronSchedule: string;
}

export interface MongoConfig {
    uri: string;
}

export interface SocketConfig {
    corsOrigin: string;
}

export interface Config {
    server: ServerConfig;
    database: DatabaseConfig;
    jwt: JwtConfig;
    redis: RedisConfig;
    billing: BillingConfig;
    defaultTenantSlug: string;
    whatsapp: WhatsAppConfig;
    instagram: InstagramConfig;
    mongo: MongoConfig;
    socket: SocketConfig;
}

// ── Config Object ──

export const config: Config = {
    server: {
        port: parseInt(getEnvOrDefault('PORT', '5000'), 10),
        nodeEnv: getEnvOrDefault('NODE_ENV', 'development'),
        corsOrigin: getEnvOrDefault('CORS_ORIGIN', 'http://localhost:5173'),
    },
    database: {
        url: getEnvOrThrow('DATABASE_URL'),
        poolMin: parseInt(getEnvOrDefault('DATABASE_POOL_MIN', '2'), 10),
        poolMax: parseInt(getEnvOrDefault('DATABASE_POOL_MAX', '10'), 10),
    },
    jwt: {
        secret: getEnvOrThrow('JWT_SECRET'),
        expiresIn: getEnvOrDefault('JWT_EXPIRES_IN', '7d'),
    },
    redis: {
        host: getEnvOrDefault('REDIS_HOST', 'localhost'),
        port: parseInt(getEnvOrDefault('REDIS_PORT', '6378'), 10),
    },
    billing: {
        razorpayKeyId: getEnvOrDefault('RAZORPAY_KEY_ID', ''),
        razorpayKeySecret: getEnvOrDefault('RAZORPAY_KEY_SECRET', ''),
        razorpayWebhookSecret: getEnvOrDefault('RAZORPAY_WEBHOOK_SECRET', ''),
        razorpayMonthlyPlanId: process.env.RAZORPAY_MONTHLY_PLAN_ID,
        razorpayYearlyPlanId: process.env.RAZORPAY_YEARLY_PLAN_ID,
        usageCronEnabled: getEnvAsBoolean('BILLING_USAGE_CRON_ENABLED', true),
        usageCronSchedule: getEnvOrDefault('BILLING_USAGE_CRON_SCHEDULE', '0 3 1 * *'),
        reconciliationCronEnabled: getEnvAsBoolean('BILLING_RECONCILIATION_CRON_ENABLED', true),
        reconciliationCronSchedule: getEnvOrDefault('BILLING_RECONCILIATION_CRON_SCHEDULE', '0 * * * *'),
    },
    defaultTenantSlug: getEnvOrDefault('DEFAULT_TENANT_SLUG', 'default'),
    whatsapp: {
        meta: {
            apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
            accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
            phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
            businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
            appId: process.env.META_APP_ID,
            appSecret: process.env.META_APP_SECRET,
            systemUserToken: process.env.META_SYSTEM_USER_TOKEN,
            appWabaId: process.env.META_APP_WABA_ID,
        },
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    },
    instagram: {
        accessToken: getEnvOrDefault('INSTAGRAM_ACCESS_TOKEN', ''),
        pageId: getEnvOrDefault('INSTAGRAM_PAGE_ID', ''),
    },
    mongo: {
        uri: getEnvOrDefault('MONGO_URI', 'mongodb://localhost:27018/marketing-os?directConnection=true'),
    },
    socket: {
        corsOrigin: getEnvOrDefault('CORS_ORIGIN', 'http://localhost:5173'),
    },
};

export const isDevelopment = config.server.nodeEnv === 'development';
export const isProduction = config.server.nodeEnv === 'production';

// Export config getter for DI
export function getConfig(): Config {
    return config;
}
