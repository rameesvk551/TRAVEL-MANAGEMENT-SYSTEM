import { query, closePool } from '../infrastructure/database/index.js';
import bcrypt from 'bcryptjs';

async function seed() {
    try {
        console.log('🌱 Starting expanded seed...');

        // Cleanup
        console.log('Cleaning up old data...');
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

        const adminRes = await query(
            `INSERT INTO users (tenant_id, email, password_hash, name, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [tenantId, 'admin@demo.com', passwordHash, 'Admin User', 'admin']
        );
        const adminId = adminRes.rows[0].id;

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
             ($1, 'vehicle', 'Toyota Innova Crysta', 'Luxury 7-seater SUV', 7, 3500, 'INR'),
             ($1, 'tour', 'Golden Triangle Tour', '5 Days Delhi-Agra-Jaipur', 20, 25000, 'INR'),
             ($1, 'hotel', 'Oberoi Rajvilas', 'Luxury Heritage Resort in Jaipur', 5, 45000, 'INR'),
             ($1, 'activity', 'Backwater Cruise', 'Traditional Houseboat in Alleppey', 10, 12000, 'INR')`,
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

        // 5. Contacts (15 items)
        console.log('Creating 15 Contacts...');
        const contactData = [
            ['Rahul', 'Sharma', 'rahul.s@example.com', '+919876543210'],
            ['Priya', 'Verma', 'priya.v@example.com', '+919876543211'],
            ['Amit', 'Patel', 'amit.p@example.com', '+919876543212'],
            ['Sarah', 'Jenkins', 'sarah.j@example.com', '+14155550123'],
            ['Michael', 'Chang', 'mike.c@example.com', '+14155550124'],
            ['Elena', 'Rodriguez', 'elena.r@example.com', '+34912345678'],
            ['Sanjay', 'Gupta', 'sanjay.g@example.com', '+919988776655'],
            ['Ananya', 'Iyer', 'ananya.i@example.com', '+919122334455'],
            ['David', 'Smith', 'd.smith@example.com', '+442071234567'],
            ['Yuki', 'Tanaka', 'yuki.t@example.com', '+81312345678'],
            ['Chris', 'Evans', 'chris.e@example.com', '+12125550199'],
            ['Emma', 'Watson', 'emma.w@example.com', '+13105550188'],
            ['Vikram', 'Singh', 'vikram.s@example.com', '+919001122334'],
            ['Neha', 'Kapoor', 'neha.k@example.com', '+919818822334'],
            ['Robert', 'Downey', 'robert.d@example.com', '+14155550177']
        ];

        const contactIds: string[] = [];
        for (const c of contactData) {
            const res = await query(
                `INSERT INTO contacts (tenant_id, first_name, last_name, email, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [tenantId, ...c]
            );
            contactIds.push(res.rows[0].id);
        }

        // 6. Leads (25 items)
        console.log('Creating 25 Leads...');
        const leadTemplates = [
            { name: 'Manali Adventure', destination: 'Manali', source: 'website', stage: 'new', score: 40 },
            { name: 'Goa Honeymoon', destination: 'Goa', source: 'referral', stage: 'contacted', score: 65 },
            { name: 'Rajasthan Cultural', destination: 'Jaipur', source: 'social', stage: 'proposal', score: 85 },
            { name: 'Iceland Northern Lights', destination: 'Iceland', source: 'google', stage: 'qualified', score: 70 },
            { name: 'Bali Beach Escape', destination: 'Bali', source: 'website', stage: 'won', score: 100 },
            { name: 'Kerala Backwaters', destination: 'Alleppey', source: 'email', stage: 'lost', score: 20 },
            { name: 'Ladakh Bike Trip', destination: 'Leh', source: 'phone', stage: 'new', score: 35 },
            { name: 'Swiss Alp Skiing', destination: 'Zermatt', source: 'referral', stage: 'contacted', score: 55 },
            { name: 'Japan Cherry Blossom', destination: 'Tokyo', source: 'website', stage: 'qualified', score: 75 },
            { name: 'African Safari', destination: 'Kenya', source: 'social', stage: 'proposal', score: 80 },
            { name: 'Dubai Luxury', destination: 'Dubai', source: 'google', stage: 'won', score: 100 },
            { name: 'Maldives Overwater', destination: 'Maldives', source: 'website', stage: 'lost', score: 15 },
            { name: 'Machu Picchu Trek', destination: 'Peru', source: 'referral', stage: 'new', score: 45 },
            { name: 'Vietnam Food Tour', destination: 'Hanoi', source: 'email', stage: 'contacted', score: 50 },
            { name: 'New Zealand Roadtrip', destination: 'Queenstown', source: 'website', stage: 'qualified', score: 60 },
            { name: 'Pyramids Explorer', destination: 'Egypt', source: 'phone', stage: 'proposal', score: 90 },
            { name: 'Santorini Sunset', destination: 'Greece', source: 'social', stage: 'won', score: 100 },
            { name: 'Great Wall Journey', destination: 'China', source: 'google', stage: 'new', score: 30 },
            { name: 'Tuscany Vineyard', destination: 'Italy', source: 'referral', stage: 'contacted', score: 58 },
            { name: 'Arctic Expedition', destination: 'Svalbard', source: 'website', stage: 'qualified', score: 68 },
            { name: 'Amazon Rainforest', destination: 'Brazil', source: 'email', stage: 'proposal', score: 82 },
            { name: 'Galapagos Diving', destination: 'Ecuador', source: 'phone', stage: 'won', score: 100 },
            { name: 'Paris Romantic', destination: 'France', source: 'social', stage: 'lost', score: 10 },
            { name: 'Andaman Scuba', destination: 'Havelock', source: 'google', stage: 'new', score: 25 },
            { name: 'Bhutan Monastery', destination: 'Paro', source: 'referral', stage: 'qualified', score: 72 }
        ];

        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const leadIds: string[] = [];

        for (let i = 0; i < leadTemplates.length; i++) {
            const template = leadTemplates[i];
            const contactId = contactIds[i % contactIds.length];
            const contact = contactData[i % contactData.length];
            const assignedId = i % 2 === 0 ? adminId : staffId;
            const priority = priorities[Math.floor(Math.random() * priorities.length)];

            const res = await query(
                `INSERT INTO leads (tenant_id, name, email, phone, status, source, pipeline_id, stage_id, contact_id, assigned_to_id, inquiry_details, score, priority)
                 VALUES ($1, $2, $3, $4, 'new', $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
                [
                    tenantId,
                    template.name,
                    contact[2],
                    contact[3],
                    template.source,
                    pipelineId,
                    template.stage,
                    contactId,
                    assignedId,
                    JSON.stringify({ destination: template.destination, travelers: Math.floor(Math.random() * 5) + 1 }),
                    template.score,
                    priority
                ]
            );
            leadIds.push(res.rows[0].id);
        }

        // 7. Activities (40+ items)
        console.log('Creating 40+ Activities...');
        const activityTypes = ['call', 'email', 'meeting', 'task', 'note'];
        const subjects = [
            'Initial Inquiry', 'Quote Sent', 'Follow up Call', 'Itinerary Review',
            'Payment Pending', 'Passport Details Requested', 'Flight Options Shared',
            'Hotel Alternatives Discussion', 'Visa Guidance Provided', 'Confirmed Booking'
        ];

        for (let i = 0; i < 45; i++) {
            const leadId = leadIds[i % leadIds.length];
            const contactId = contactIds[i % contactIds.length];
            const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            const status = i < 30 ? 'COMPLETED' : 'PENDING';
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            const dayOffset = i % 2 === 0 ? -(i % 10) : (i % 5); // Some past, some future

            await query(
                `INSERT INTO activities (tenant_id, lead_id, contact_id, created_by_id, type, status, subject, description, scheduled_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '${dayOffset} days')`,
                [
                    tenantId,
                    leadId,
                    contactId,
                    adminId,
                    type,
                    status,
                    subject,
                    `Automated activity generated for testing purposes. Type: ${type}, Index: ${i}`,
                ]
            );
        }

        // 8. Bookings (10 items)
        console.log('Creating 10 Bookings...');
        const resourceRes = await query(`SELECT id FROM resources WHERE tenant_id = $1`, [tenantId]);
        const resourceIds = resourceRes.rows.map(r => r.id);
        const wonLeadsRes = await query(`SELECT id, name FROM leads WHERE tenant_id = $1 AND stage_id = 'won'`, [tenantId]);

        for (let i = 0; i < 10; i++) {
            const lead = wonLeadsRes.rows[i % wonLeadsRes.rows.length];
            const resourceId = resourceIds[i % resourceIds.length];
            const amount = 25000 + (Math.random() * 50000);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (i * 7));
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 5);

            await query(
                `INSERT INTO bookings (
                    tenant_id, resource_id, lead_id, created_by_id, 
                    source, guest_name, start_date, end_date, 
                    status, base_amount, total_amount, currency, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() - INTERVAL '${i} days')`,
                [
                    tenantId, resourceId, lead?.id, adminId,
                    'DIRECT', lead?.name || 'Walk-in Guest', startDate, endDate,
                    'confirmed', amount * 0.9, amount, 'INR'
                ]
            );
        }

        console.log('✅ Expanded seed completed successfully');
        console.log('Admin: admin@demo.com / password123');
        console.log('Staff: staff@demo.com / password123');
        console.log('Tenant Slug: demo-travel');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await closePool();
    }
}

seed();
