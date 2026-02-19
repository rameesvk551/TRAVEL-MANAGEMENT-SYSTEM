import winston from 'winston';
import { config } from './env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: config.server.nodeEnv === 'development' ? 'debug' : 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    defaultMeta: { service: 'marketing-os' },
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), logFormat),
        }),
        new winston.transports.File({
            filename: 'errors.log',
            level: 'error',
        }),
    ],
});
