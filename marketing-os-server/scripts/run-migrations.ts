/**
 * Migration Runner — executes all SQL migration files against PostgreSQL
 * Usage: npx tsx scripts/run-migrations.ts
 */
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
}

const MIGRATIONS_DIR = join(__dirname, '../src/database/migrations');

async function run() {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    console.log('✅ Connected to database');

    // Create migrations tracking table
    await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMPTZ DEFAULT NOW()
        )
    `);

    // Get already-executed migrations
    const { rows: executed } = await client.query('SELECT filename FROM _migrations ORDER BY filename');
    const executedSet = new Set(executed.map(r => r.filename));

    // Read migration files (only top-level .sql files, sorted)
    const files = readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql') && !f.startsWith('.'))
        .sort();

    let count = 0;
    for (const file of files) {
        if (executedSet.has(file)) {
            console.log(`⏩ Skipping (already executed): ${file}`);
            continue;
        }
        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`✅ Executed: ${file}`);
            count++;
        } catch (err: any) {
            await client.query('ROLLBACK');
            console.error(`❌ Failed: ${file}`);
            console.error(err.message);
            // Continue to next migration instead of aborting
        }
    }

    console.log(`\n🏁 Done! Executed ${count} migration(s).`);
    await client.end();
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
