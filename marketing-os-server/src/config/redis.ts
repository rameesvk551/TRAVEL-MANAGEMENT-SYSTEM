import { Redis } from 'ioredis';
import { config } from './env.js';

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        redisClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            maxRetriesPerRequest: null, // Required for BullMQ
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
    }
    return redisClient;
}

export function getRedisSubscriber(): Redis {
    if (!redisSubscriber) {
        redisSubscriber = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            maxRetriesPerRequest: null,
        });

        redisSubscriber.on('error', (err) => {
            console.error('Redis Subscriber Error:', err);
        });
    }
    return redisSubscriber;
}

export async function closeRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
    if (redisSubscriber) {
        await redisSubscriber.quit();
        redisSubscriber = null;
    }
}
