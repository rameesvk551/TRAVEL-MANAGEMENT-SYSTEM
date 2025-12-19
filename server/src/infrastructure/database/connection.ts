import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../../config/index.js';

let pool: Pool | null = null;

/**
 * Get or create the database connection pool.
 */
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

/**
 * Execute a query with the connection pool.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> {
    const pool = getPool();
    return pool.query<T>(text, params);
}

/**
 * Get a client for transaction handling.
 */
export async function getClient(): Promise<PoolClient> {
    const pool = getPool();
    return pool.connect();
}

/**
 * Close the database pool.
 */
export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

/**
 * Test database connection.
 */
export async function testConnection(): Promise<boolean> {
    try {
        const result = await query('SELECT NOW()');
        console.log('Database connected:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}
