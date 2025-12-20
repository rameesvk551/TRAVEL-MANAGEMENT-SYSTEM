import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { query, closePool } from '../infrastructure/database/index.js';

import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabaseExists() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL not set');
        process.exit(1);
    }

    // Extract DB name and connect to default 'postgres' db
    // URL format: postgres://user:pass@host:port/dbname
    // Simple regex or URL parsing
    try {
        const urlObj = new URL(dbUrl);
        const dbName = urlObj.pathname.slice(1); // remove leading slash

        if (!dbName) return;

        // Connect to 'postgres' to manage databases
        urlObj.pathname = '/postgres';
        const adminConnectionString = urlObj.toString();

        const client = new Client({ connectionString: adminConnectionString });
        await client.connect();

        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

        if (res.rowCount === 0) {
            console.log(`Database '${dbName}' does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database '${dbName}' created successfully.`);
        } else {
            console.log(`Database '${dbName}' exists.`);
        }
        await client.end();
    } catch (error: any) {
        console.error('Error checking/creating database:', error.message);
        // Fallback: proceed, maybe it exists but connection failed or user has no permissions to create
    }
}

async function runMigrations() {
    await ensureDatabaseExists();

    console.log('🔄 Running Migrations...');

    // Resolve relative to this script
    const migrationsDir = path.resolve(__dirname, '../infrastructure/database/migrations');

    console.log(`📂 Looking for migrations in: ${migrationsDir}`);

    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migration directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    try {
        const files = fs.readdirSync(migrationsDir).sort();
        let count = 0;

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`📄 Checking ${file}...`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                try {
                    await query(sql, []);
                    console.log(`✅ ${file} applied successfully.`);
                    count++;
                } catch (err: any) {
                    if (err.code === '42P07') { // Relation exists
                        console.log(`⚠️  ${file} - Skipped (Relation already exists).`);
                    } else if (err.message && err.message.includes('already exists')) {
                        console.log(`⚠️  ${file} - Skipped (Already exists).`);
                    } else {
                        console.error(`❌ Error applying ${file}:`, err.message);
                        // We continue to try others? Or fail?
                        // For dev setup, often better to fail fast, but here we might have partials.
                        // Let's stop.
                        process.exit(1);
                    }
                }
            }
        }
        console.log(`✨ Migration Check Complete. ${count} scripts processed.`);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

runMigrations();
