import { query, closePool } from '../infrastructure/database/index.js';
import bcrypt from 'bcryptjs';

async function seed() {
    try {
        console.log('🌱 Starting seed...');

        // Cleanup
        console.log('Cleaning up old data...');
        // Truncate tenants cascade to clean everything since most things reference tenants
        await query('TRUNCATE TABLE tenants CASCADE');

        // 1. Tenant
        console.log('Creating Tenant...');
        const tenantRes = await query(
            `INSERT INTO tenants (name, slug, is_active) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
            ['Demo Travel Agency', 'demo-travel', true]
        );
        const tenantId = tenantRes.rows[0].id;

        // 2. Users
        console.log('Creating Users...');
        const passwordHash = await bcrypt.hash('password123', 10);

        // Admin User
        const adminRes = await query(
            `INSERT INTO users (tenant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            [tenantId, 'admin@demo.com', passwordHash, 'Admin User', 'admin']
        );
        const adminId = adminRes.rows[0].id;

        // Staff User
        const staffRes = await query(
            `INSERT INTO users (tenant_id, email, password_hash, name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            [tenantId, 'staff@demo.com', passwordHash, 'Staff User', 'staff']
        );
        const staffId = staffRes.rows[0].id;

        // 3. Resources
        console.log('Creating Resources...');
        await query(
            `INSERT INTO resources (tenant_id, type, name, description, capacity, base_price, currency)
       VALUES 
       ($1, 'trek', 'Himalayan Adventure', '10 days trekking expedition in Manali', 15, 50000, 'INR'),
       ($1, 'vehicle', 'Toyota Innova Crysta', 'Luxury 7-seater SUV for local sightseeing', 7, 3500, 'INR'),
       ($1, 'tour', 'Golden Triangle Tour', '5 Days Delhi-Agra-Jaipur', 20, 25000, 'INR')`,
            [tenantId]
        );

        // 4. Pipelines
        console.log('Creating Pipelines...');
        const pipelineRes = await query(
            `INSERT INTO pipelines (tenant_id, name, is_default, stages)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
            [
                tenantId,
                'Standard Sales Pipeline',
                true,
                JSON.stringify([
                    { id: 'new', name: 'New Lead', color: '#3B82F6' },
                    { id: 'contacted', name: 'Contacted', color: '#F59E0B' },
                    { id: 'qualified', name: 'Qualified', color: '#8B5CF6' },
                    { id: 'proposal', name: 'Proposal Sent', color: '#10B981' },
                    { id: 'won', name: 'Won', color: '#059669' },
                    { id: 'lost', name: 'Lost', color: '#EF4444' }
                ])
            ]
        );
        const pipelineId = pipelineRes.rows[0].id;

        // 5. Contacts
        console.log('Creating Contacts...');
        const contactsRes = await query(
            `INSERT INTO contacts (tenant_id, first_name, last_name, email, phone)
       VALUES 
       ($1, 'Rahul', 'Sharma', 'rahul.s@example.com', '+919876543210'),
       ($1, 'Priya', 'Verma', 'priya.v@example.com', '+919876543211'),
       ($1, 'Amit', 'Patel', 'amit.p@example.com', '+919876543212'),
       ($1, 'Sarah', 'Jenkins', 'sarah.j@example.com', '+14155550123'),
       ($1, 'Michael', 'Chang', 'mike.c@example.com', '+14155550124')
       RETURNING id`,
            [tenantId]
        );
        const contactIds = contactsRes.rows.map((r: any) => r.id);

        // 6. Leads
        console.log('Creating Leads...');
        // We need to match leads to contacts carefully or just pick random ones
        // Lead 1: Rahul - New
        await query(
            `INSERT INTO leads (tenant_id, name, email, phone, status, source, pipeline_id, stage_id, contact_id, assigned_to_id, inquiry_details)
       VALUES
       ($1, 'Manali Family Trip', 'rahul.s@example.com', '+919876543210', 'new', 'website', $2, 'new', $3, $4, $5)`,
            [tenantId, pipelineId, contactIds[0], adminId, JSON.stringify({ destination: 'Manali', travelers: 4 })]
        );

        // Lead 2: Priya - Contacted
        await query(
            `INSERT INTO leads (tenant_id, name, email, phone, status, source, pipeline_id, stage_id, contact_id, assigned_to_id, inquiry_details)
       VALUES
       ($1, 'Corporate Outing', 'priya.v@example.com', '+919876543211', 'new', 'referral', $2, 'contacted', $3, $4, $5)`,
            [tenantId, pipelineId, contactIds[1], staffId, JSON.stringify({ destination: 'Goa', travelers: 20 })]
        );

        // Lead 3: Amit - Proposal
        await query(
            `INSERT INTO leads (tenant_id, name, email, phone, status, source, pipeline_id, stage_id, contact_id, assigned_to_id, inquiry_details)
       VALUES
       ($1, 'Rajasthan Heritage', 'amit.p@example.com', '+919876543212', 'new', 'social', $2, 'proposal', $3, $4, $5)`,
            [tenantId, pipelineId, contactIds[2], adminId, JSON.stringify({ destination: 'Jaipur', travelers: 2 })]
        );

        // 7. Activities
        console.log('Creating Activities...');
        // Get the lead IDs we just created
        const leadsRes = await query('SELECT id FROM leads WHERE tenant_id = $1', [tenantId]);
        const leadIds = leadsRes.rows.map((r: any) => r.id);

        if (leadIds.length > 0) {
            await query(
                `INSERT INTO activities (tenant_id, lead_id, contact_id, created_by_id, type, status, subject, description, scheduled_at)
             VALUES
             ($1, $2, $3, $4, 'call', 'COMPLETED', 'Initial Inquiry Call', 'Customer interested in Manali package for June.', NOW() - INTERVAL '2 days'),
             ($1, $2, $3, $4, 'email', 'PENDING', 'Send Itinerary', 'Send the detailed 5D/4N itinerary.', NOW() + INTERVAL '1 day')`,
                [tenantId, leadIds[0], contactIds[0], adminId]
            );
        }

        console.log('✅ Seed completed successfully');
        console.log('Creating test credentials:');
        console.log('Admin: admin@demo.com / password123');
        console.log('Staff: staff@demo.com / password123');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

seed();
