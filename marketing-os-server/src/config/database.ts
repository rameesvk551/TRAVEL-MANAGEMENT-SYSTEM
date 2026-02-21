import { Sequelize } from 'sequelize';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import mongoose from 'mongoose';
import { config } from './env.js';

// ── Sequelize (ORM) Connection ──

export const sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: false,
    pool: {
        min: config.database.poolMin,
        max: config.database.poolMax,
    },
    define: {
        underscored: true,
        timestamps: true,
    },
});

export async function connectSequelize(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log('✅ Sequelize connection established.');
    } catch (error) {
        console.error('❌ Unable to connect to the database with Sequelize:', error);
        throw error;
    }
}

// ── Raw PG Pool ──

let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: config.database.url,
            min: config.database.poolMin,
            max: config.database.poolMax,
        });

        pool.on('error', (err) => {
            console.error('Unexpected database pool error:', err);
        });
    }
    return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    const p = getPool();
    return p.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
    const p = getPool();
    return p.connect();
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

export async function testConnection(): Promise<boolean> {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database connected:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// ── MongoDB Connection ──

export async function connectToMongoDB(): Promise<void> {
    try {
        await mongoose.connect(config.mongo.uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ MongoDB connected.');
    } catch (error) {
        console.warn('⚠️ MongoDB connection failed (non-fatal, continuing without MongoDB):', (error as Error).message);
    }
}
