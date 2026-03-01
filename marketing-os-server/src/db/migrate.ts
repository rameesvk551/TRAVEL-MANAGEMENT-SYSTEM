import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
    const dbUrl = process.env.POSTGRES_URL;
    if (!dbUrl) {
        console.error('❌ POSTGRES_URL environment variable is not set');
        process.exit(1);
    }

    const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false });

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Create a migrations tracking table
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
                "name" VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY
            );
        `);

        // Get already-run migrations
        const [executed] = await sequelize.query(`SELECT name FROM "SequelizeMeta" ORDER BY name;`);
        const executedNames = new Set((executed as any[]).map((r: any) => r.name));

        // Get migration files
        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))
            .sort();

        const pending = files.filter(f => !executedNames.has(f));

        if (pending.length === 0) {
            console.log('✅ No pending migrations');
            await sequelize.close();
            return;
        }

        console.log(`📦 Running ${pending.length} pending migration(s)...\n`);

        for (const file of pending) {
            console.log(`  ⏳ Running: ${file}`);
            const migrationPath = `file://${path.join(MIGRATIONS_DIR, file)}`;
            const migration = await import(migrationPath);
            const migrationModule = migration.default;

            await migrationModule.up(sequelize.getQueryInterface());

            await sequelize.query(`INSERT INTO "SequelizeMeta" ("name") VALUES ($1);`, {
                bind: [file],
            });
            console.log(`  ✅ Done: ${file}`);
        }

        console.log('\n🎉 All migrations completed successfully!');
        await sequelize.close();
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sequelize.close();
        process.exit(1);
    }
}

migrate();
