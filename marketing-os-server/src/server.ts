import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectSequelize, connectToMongoDB, testConnection } from './config/database.js';
import { getRedisClient } from './config/redis.js';
import db from './db/sqlmodels/index.js';
import { initSocketServer } from './sockets/SocketServer.js';
import { logger } from './config/logger.js';

/**
 * Server entry point — handles startup, database connections, and graceful shutdown.
 */
async function main(): Promise<void> {
    try {
        // Connect databases
        await connectSequelize();
        await connectToMongoDB();
        await testConnection();

        // Sequelize model associations are auto-registered in db/sqlmodels/index.ts
        logger.info('✅ Model associations registered.');

        // Verify Redis
        const redis = getRedisClient();
        await redis.ping();
        logger.info('✅ Redis connected.');

        // Create app and register routes
        const app = createApp();

        // Background workers (none active after module cleanup)
        logger.info('✅ Server dependencies ready.');

        // Start HTTP server
        const port = config.server.port;
        const server = app.listen(port, () => {
            logger.info(`🚀 MarketingOS Server running on port ${port} [${config.server.nodeEnv}]`);
        });

        // Initialize Socket.io (function-based, no class)
        initSocketServer(server);
        logger.info('✅ Socket.io Server initialized.');

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.error('❌ Server failed to start:', error);
        process.exit(1);
    }
}

main();
