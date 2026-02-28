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

        // Register all Sequelize model associations
        db.setupAssociations();
        logger.info('✅ Model associations registered.');

        // Verify Redis
        const redis = getRedisClient();
        await redis.ping();
        logger.info('✅ Redis connected.');

        // Create app and register routes
        const { app, dependencies } = createApp();

        // Start background workers & cron jobs
        dependencies.campaignDispatcher.startWorker();
        dependencies.billingJobs.start();
        logger.info('✅ Background workers & billing cron jobs started.');

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
