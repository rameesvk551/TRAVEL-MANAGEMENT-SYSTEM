import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { query, closePool } from '../infrastructure/database/index.js';

const { Client } = pg;
// Use process.cwd() to get the project root and construct paths
const migrationsDir = path.resolve(process.cwd(), 'src/infrastructure/database/migrations');

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

    console.log(`📂 Looking for migrations in: ${migrationsDir}`);

    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migration directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    try {
        // Run main migrations
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        let count = 0;

        for (const file of files) {
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
                    process.exit(1);
                }
            }
        }

        // Run HRMS migrations
        const hrmsDir = path.join(migrationsDir, 'hrms');
        if (fs.existsSync(hrmsDir)) {
            console.log('\n📂 Running HRMS migrations...');
            const hrmsFiles = fs.readdirSync(hrmsDir).filter(f => f.endsWith('.sql')).sort();
            
            for (const file of hrmsFiles) {
                console.log(`📄 Checking hrms/${file}...`);
                const filePath = path.join(hrmsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                try {
                    await query(sql, []);
                    console.log(`✅ hrms/${file} applied successfully.`);
                    count++;
                } catch (err: any) {
                    if (err.code === '42P07' || err.code === '42710') {
                        console.log(`⚠️  hrms/${file} - Skipped (Already exists).`);
                    } else if (err.message && err.message.includes('already exists')) {
                        console.log(`⚠️  hrms/${file} - Skipped (Already exists).`);
                    } else {
                        console.error(`❌ Error applying hrms/${file}:`, err.message);
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
