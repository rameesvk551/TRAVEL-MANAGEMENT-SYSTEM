import { query, closePool } from '../infrastructure/database/index.js';
import bcrypt from 'bcryptjs';

async function addUser() {
    try {
        console.log('Adding user aslahmp@gmail.com...');

        // 1. Get Tenant
        const tenantRes = await query(`SELECT id FROM tenants WHERE slug = $1`, ['demo-travel']);
        if (tenantRes.rows.length === 0) {
            throw new Error('Tenant demo-travel not found. Please ensure seed data is run.');
        }
        const tenantId = tenantRes.rows[0].id;

        // 2. Check if user exists
        const userRes = await query(`SELECT id FROM users WHERE email = $1`, ['aslahmp@gmail.com']);
        if (userRes.rows.length > 0) {
            console.log('User already exists! Updating password just in case...');
            const passwordHash = await bcrypt.hash('Test@123', 10);
            await query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [passwordHash, 'aslahmp@gmail.com']);
            console.log('✅ User password updated to Test@123');
            return;
        }

        // 3. Create User
        const passwordHash = await bcrypt.hash('Test@123', 10);
        await query(
            `INSERT INTO users (tenant_id, email, password_hash, name, role)
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, 'aslahmp@gmail.com', passwordHash, 'Aslah User', 'owner']
        );

        console.log('✅ User aslahmp@gmail.com created successfully with password Test@123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await closePool();
    }
}

addUser();
