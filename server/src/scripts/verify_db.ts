import { query, closePool } from '../infrastructure/database/index.js';

async function verify() {
    try {
        const leadCount = await query('SELECT count(*) FROM leads');
        const contactCount = await query('SELECT count(*) FROM contacts');
        const activityCount = await query('SELECT count(*) FROM activities');
        const userCount = await query('SELECT count(*) FROM users');
        const tenantCount = await query('SELECT count(*) FROM tenants');

        console.log({
            leads: leadCount.rows[0].count,
            contacts: contactCount.rows[0].count,
            activities: activityCount.rows[0].count,
            users: userCount.rows[0].count,
            tenants: tenantCount.rows[0].count,
        });

        const tenants = await query('SELECT id, name, slug FROM tenants');
        console.log('Tenants:', tenants.rows);

        const users = await query('SELECT id, email, tenant_id FROM users');
        console.log('Users:', users.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await closePool();
    }
}

verify();
