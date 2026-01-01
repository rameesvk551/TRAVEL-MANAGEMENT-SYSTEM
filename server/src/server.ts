
import { createApp } from './app.js';
import { config } from './config/index.js';
import { testConnection, closePool } from './infrastructure/database/index.js';

async function main(): Promise<void> {
    console.log('🚀 Starting Travel Operations Platform...');

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ Failed to connect to database');
        process.exit(1);
    }

    // Create and start app (now async)
    const { app, whatsApp } = await createApp();
    const { port } = config.server;

    const server = app.listen(port, () => {
        console.log(`✅ Server running on http://localhost:${port}`);
        console.log(`📊 Health check: http://localhost:${port}/api/health`);
        console.log(`📦 Resources API: http://localhost:${port}/api/resources`);
        if (whatsApp) {
            console.log(`📱 WhatsApp API: http://localhost:${port}/api/whatsapp`);
            console.log(`   Webhook URL: http://localhost:${port}/api/whatsapp/webhook`);
        }
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await closePool();
            console.log('👋 Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
