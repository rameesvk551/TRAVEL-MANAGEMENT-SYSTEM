
import { getPool } from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    console.log('Starting migration...');
    const pool = getPool();

    try {
        const migrationPath = path.join(__dirname, '../src/database/migrations/20260220_whatsapp_business_configs.sql');
        console.log(`Reading migration file from: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            console.error('Migration file not found!');
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executing SQL...');
        await pool.query(sql);

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
