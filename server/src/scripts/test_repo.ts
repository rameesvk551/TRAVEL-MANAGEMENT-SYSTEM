import { LeadRepository } from '../infrastructure/repositories/LeadRepository.js';
import { closePool } from '../infrastructure/database/index.js';

async function testRepo() {
    const repo = new LeadRepository();
    const tenantId = '82d96519-1a82-4f71-8ad7-2116c2dc3cc0'; // From verify_db.ts output

    try {
        console.log('Testing repository findAll...');
        const result = await repo.findAll(tenantId, { page: 1, limit: 10, offset: 0 });
        console.log('Total leads found by repo:', result.total);
        console.log('Leads array length:', result.leads.length);
        if (result.leads.length > 0) {
            console.log('First lead name:', result.leads[0].name);
        }
    } catch (err) {
        console.error('Repo test failed:', err);
    } finally {
        await closePool();
    }
}

testRepo();
