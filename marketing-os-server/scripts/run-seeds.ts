/**
 * Seed Runner — executes seed SQL against PostgreSQL
 * Usage: npx tsx scripts/run-seeds.ts
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
}

async function run() {
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    console.log('✅ Connected');

    const seedFile = join(__dirname, '../src/infrastructure/database/seeds/002_marketing_os_demo.sql');
    const waSeedFile = join(__dirname, '../src/infrastructure/database/seeds/003_whatsapp_demo.sql');

    const sql = readFileSync(seedFile, 'utf-8');
    const waSql = readFileSync(waSeedFile, 'utf-8');

    try {
        await client.query(sql);
        console.log('✅ Marketing OS Seed data inserted successfully');

        await client.query(waSql);
        console.log('✅ WhatsApp Seed data inserted successfully');
    } catch (err: any) {
        console.error('❌ Seed error:', err.message);
    }

    await client.end();
    console.log('Done');
    process.exit(0);
}

run();
