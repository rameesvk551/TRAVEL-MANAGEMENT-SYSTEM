
import { query, closePool } from '../infrastructure/database/index.js';

async function cleanup() {
    try {
        console.log('🧹 Starting database cleanup for production...');

        // Truncate all tables in correct order to avoid foreign key constraints
        // Using CASCADE to handle dependencies automatically
        const tables = [
            'payments',
            'bookings',
            'activities',
            'leads',
            'contacts',
            'pipelines',
            'resources',
            'users',
            'tenants'
        ];

        for (const table of tables) {
            console.log(`Clearing ${table}...`);
            await query(`TRUNCATE TABLE ${table} CASCADE`);
        }

        console.log('✅ Database wiped clean. System is ready for production use.');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await closePool();
    }
}

cleanup();
