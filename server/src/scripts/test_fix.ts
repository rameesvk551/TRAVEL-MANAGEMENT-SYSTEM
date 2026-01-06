import { TenantRepository } from '../infrastructure/repositories/TenantRepository.js';
import { closePool } from '../infrastructure/database/index.js';

async function test() {
    try {
        const repo = new TenantRepository();
        console.log('Searching for tenant "demo-travel"...');
        const tenant = await repo.findBySlug('demo-travel');
        if (tenant) {
            console.log('✅ Success! Tenant found:', tenant.name);
            console.log('Location:', tenant.location);
        } else {
            console.log('❌ Tenant not found. Try running seed first.');
        }
    } catch (error) {
        console.error('❌ Error testing fix:', error);
    } finally {
        await closePool();
    }
}

test();
