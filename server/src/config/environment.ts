import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface DatabaseConfig {
    url: string;
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

interface Config {
    server: ServerConfig;
    database: DatabaseConfig;
    jwt: JwtConfig;
    defaultTenantSlug: string;
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
        poolMin: parseInt(getEnvOrDefault('DATABASE_POOL_MIN', '2'), 10),
        poolMax: parseInt(getEnvOrDefault('DATABASE_POOL_MAX', '10'), 10),
    },
    jwt: {
        secret: getEnvOrThrow('JWT_SECRET'),
        expiresIn: getEnvOrDefault('JWT_EXPIRES_IN', '7d'),
    },
    defaultTenantSlug: getEnvOrDefault('DEFAULT_TENANT_SLUG', 'default'),
};

export const isDevelopment = config.server.nodeEnv === 'development';
export const isProduction = config.server.nodeEnv === 'production';
