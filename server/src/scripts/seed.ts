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

        // 3. Resources (35 items - diverse types with realistic pricing)
        console.log('Creating 35 Resources...');
        const resourceData = [
            // Treks (10)
            ['trek', 'Himalayan Adventure Trek', '10 days trekking expedition in Manali with camping', 15, 50000],
            ['trek', 'Chadar Trek Ladakh', '9 days frozen river trek in winter', 12, 65000],
            ['trek', 'Valley of Flowers Trek', '7 days UNESCO heritage trek in Uttarakhand', 20, 38000],
            ['trek', 'Roopkund Mystery Trek', '8 days high altitude skeletal lake trek', 15, 45000],
            ['trek', 'Markha Valley Trek', '7 days cultural trek in Ladakh', 18, 42000],
            ['trek', 'Hampta Pass Trek', '5 days cross-over trek in Himachal', 25, 28000],
            ['trek', 'Kedarkantha Winter Trek', '6 days snow trek for beginners', 30, 22000],
            ['trek', 'Goechala Trek Sikkim', '11 days Kanchenjunga base camp trek', 12, 55000],
            ['trek', 'Sandakphu Trek', '6 days highest peak of West Bengal', 20, 32000],
            ['trek', 'Dzongri Trek', '8 days rhododendron trail in Sikkim', 18, 38000],
            
            // Tours (10)
            ['tour', 'Golden Triangle Tour', '5 Days Delhi-Agra-Jaipur heritage tour', 25, 25000],
            ['tour', 'Rajasthan Royal Tour', '12 Days covering 8 cities and palaces', 20, 75000],
            ['tour', 'Kerala Backwater Tour', '7 Days houseboat and beach experience', 15, 48000],
            ['tour', 'Goa Beach Holiday', '5 Days beaches, nightlife, and water sports', 30, 32000],
            ['tour', 'Spiritual Varanasi Tour', '4 Days Ganga aarti and temples', 25, 18000],
            ['tour', 'Ladakh Road Trip', '10 Days Leh-Nubra-Pangong by road', 12, 68000],
            ['tour', 'Andaman Island Tour', '6 Days Havelock-Neil-Port Blair', 20, 52000],
            ['tour', 'Northeast Explorer', '14 Days Assam-Meghalaya-Arunachal', 15, 85000],
            ['tour', 'Spiti Valley Circuit', '9 Days high altitude cold desert', 12, 58000],
            ['tour', 'Kashmir Paradise Tour', '8 Days Srinagar-Gulmarg-Pahalgam', 18, 45000],
            
            // Vehicles (8)
            ['vehicle', 'Toyota Innova Crysta', 'Luxury 7-seater SUV with driver', 7, 3500],
            ['vehicle', 'Tempo Traveller 12-Seater', 'AC tempo traveller for groups', 12, 5500],
            ['vehicle', 'Mercedes E-Class', 'Premium sedan for luxury travel', 4, 6500],
            ['vehicle', 'Mahindra Scorpio', 'Rugged 7-seater for hill stations', 7, 3200],
            ['vehicle', 'Force Urbania', 'Luxury 13-seater with captain seats', 13, 7500],
            ['vehicle', 'Toyota Fortuner', 'Premium 7-seater SUV', 7, 5000],
            ['vehicle', 'Maruti Ertiga', 'Economy 6-seater MPV', 6, 2500],
            ['vehicle', 'Bus 35-Seater', 'AC luxury bus for large groups', 35, 12000],
            
            // Hotels (5)
            ['hotel', 'Oberoi Rajvilas Jaipur', 'Luxury heritage resort with spa', 5, 45000],
            ['hotel', 'Taj Lake Palace Udaipur', 'Iconic floating palace hotel', 3, 55000],
            ['hotel', 'The Leela Goa', 'Beachfront luxury resort', 8, 35000],
            ['hotel', 'ITC Mughal Agra', '5-star hotel near Taj Mahal', 10, 28000],
            ['hotel', 'Wildflower Hall Shimla', 'Mountain luxury resort in forest', 6, 42000],
            
            // Activities (2)
            ['activity', 'Alleppey Houseboat Cruise', 'Traditional kettuvallam overnight cruise', 10, 12000],
            ['activity', 'Rishikesh River Rafting', 'Grade 3-4 rapids with camping', 20, 3500]
        ];
        
        const resourceIds: string[] = [];
        for (const [type, name, desc, capacity, price] of resourceData) {
            const res = await query(
                `INSERT INTO resources (tenant_id, type, name, description, capacity, base_price, currency)
                 VALUES ($1, $2, $3, $4, $5, $6, 'INR') RETURNING id`,
                [tenantId, type, name, desc, capacity, price]
            );
            resourceIds.push(res.rows[0].id);
        }

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

        // 5. Contacts (50 items with diverse data)
        console.log('Creating 50 Contacts...');
        const contactData = [
            ['Rahul', 'Sharma', 'rahul.sharma@gmail.com', '+919876543210', 'Mumbai', 'Maharashtra'],
            ['Priya', 'Verma', 'priya.verma@yahoo.com', '+919876543211', 'Delhi', 'Delhi'],
            ['Amit', 'Patel', 'amit.patel@outlook.com', '+919876543212', 'Ahmedabad', 'Gujarat'],
            ['Sarah', 'Jenkins', 'sarah.jenkins@gmail.com', '+14155550123', 'San Francisco', 'California'],
            ['Michael', 'Chang', 'mike.chang@email.com', '+14155550124', 'New York', 'NY'],
            ['Elena', 'Rodriguez', 'elena.rodriguez@mail.es', '+34912345678', 'Madrid', 'Spain'],
            ['Sanjay', 'Gupta', 'sanjay.gupta@rediff.com', '+919988776655', 'Bangalore', 'Karnataka'],
            ['Ananya', 'Iyer', 'ananya.iyer@gmail.com', '+919122334455', 'Chennai', 'Tamil Nadu'],
            ['David', 'Smith', 'd.smith@btinternet.com', '+442071234567', 'London', 'UK'],
            ['Yuki', 'Tanaka', 'yuki.tanaka@email.jp', '+81312345678', 'Tokyo', 'Japan'],
            ['Chris', 'Evans', 'chris.evans@gmail.com', '+12125550199', 'Boston', 'MA'],
            ['Emma', 'Watson', 'emma.watson@mail.com', '+13105550188', 'Los Angeles', 'CA'],
            ['Vikram', 'Singh', 'vikram.singh@yahoo.in', '+919001122334', 'Jaipur', 'Rajasthan'],
            ['Neha', 'Kapoor', 'neha.kapoor@gmail.com', '+919818822334', 'Delhi', 'Delhi'],
            ['Robert', 'Downey', 'robert.d@email.com', '+14155550177', 'Chicago', 'IL'],
            ['Anjali', 'Desai', 'anjali.desai@gmail.com', '+919123456789', 'Pune', 'Maharashtra'],
            ['Rajesh', 'Khanna', 'rajesh.k@yahoo.com', '+919234567890', 'Kolkata', 'West Bengal'],
            ['Kavita', 'Rao', 'kavita.rao@outlook.com', '+919345678901', 'Hyderabad', 'Telangana'],
            ['James', 'Anderson', 'james.a@email.com', '+14165550111', 'Toronto', 'Canada'],
            ['Sophie', 'Martin', 'sophie.m@mail.fr', '+33145678901', 'Paris', 'France'],
            ['Arjun', 'Menon', 'arjun.menon@gmail.com', '+919456789012', 'Kochi', 'Kerala'],
            ['Deepika', 'Pillai', 'deepika.p@rediff.com', '+919567890123', 'Trivandrum', 'Kerala'],
            ['Oliver', 'Brown', 'oliver.brown@email.co.uk', '+442089876543', 'Manchester', 'UK'],
            ['Isabella', 'Garcia', 'isabella.g@mail.es', '+34623456789', 'Barcelona', 'Spain'],
            ['Karthik', 'Reddy', 'karthik.reddy@gmail.com', '+919678901234', 'Vijayawada', 'AP'],
            ['Sneha', 'Nair', 'sneha.nair@yahoo.com', '+919789012345', 'Bangalore', 'Karnataka'],
            ['Daniel', 'Lee', 'daniel.lee@email.com', '+16505551234', 'Seattle', 'WA'],
            ['Aarav', 'Joshi', 'aarav.joshi@gmail.com', '+919890123456', 'Nagpur', 'Maharashtra'],
            ['Diya', 'Shah', 'diya.shah@outlook.com', '+919901234567', 'Surat', 'Gujarat'],
            ['Lucas', 'Wilson', 'lucas.w@email.com', '+61298765432', 'Sydney', 'Australia'],
            ['Riya', 'Agarwal', 'riya.agarwal@gmail.com', '+919012345678', 'Indore', 'MP'],
            ['Aditya', 'Chopra', 'aditya.c@yahoo.in', '+919123456780', 'Chandigarh', 'Punjab'],
            ['Tara', 'Malhotra', 'tara.m@gmail.com', '+919234567801', 'Ludhiana', 'Punjab'],
            ['Noah', 'Taylor', 'noah.taylor@email.com', '+64211234567', 'Auckland', 'New Zealand'],
            ['Zara', 'Khan', 'zara.khan@outlook.com', '+919345678012', 'Lucknow', 'UP'],
            ['Liam', 'Harris', 'liam.harris@email.com', '+353861234567', 'Dublin', 'Ireland'],
            ['Isha', 'Bhatia', 'isha.bhatia@gmail.com', '+919456780123', 'Amritsar', 'Punjab'],
            ['Ethan', 'White', 'ethan.white@email.com', '+27821234567', 'Cape Town', 'South Africa'],
            ['Siya', 'Pandey', 'siya.pandey@rediff.com', '+919567801234', 'Varanasi', 'UP'],
            ['Mason', 'Clark', 'mason.clark@email.com', '+6591234567', 'Singapore', 'Singapore'],
            ['Anvi', 'Saxena', 'anvi.saxena@gmail.com', '+919678012345', 'Gurgaon', 'Haryana'],
            ['Jacob', 'Lewis', 'jacob.lewis@email.com', '+971501234567', 'Dubai', 'UAE'],
            ['Myra', 'Singhal', 'myra.singhal@yahoo.com', '+919789123456', 'Noida', 'UP'],
            ['William', 'Walker', 'william.w@email.com', '+85291234567', 'Hong Kong', 'HK'],
            ['Aarohi', 'Bansal', 'aarohi.b@gmail.com', '+919890234567', 'Jaipur', 'Rajasthan'],
            ['Benjamin', 'Hall', 'benjamin.hall@email.com', '+60123456789', 'Kuala Lumpur', 'Malaysia'],
            ['Saanvi', 'Mehta', 'saanvi.mehta@outlook.com', '+919901345678', 'Ahmedabad', 'Gujarat'],
            ['Henry', 'Allen', 'henry.allen@email.com', '+66812345678', 'Bangkok', 'Thailand'],
            ['Kiara', 'Arora', 'kiara.arora@gmail.com', '+919012456789', 'Chandigarh', 'Punjab'],
            ['Alexander', 'Young', 'alex.young@email.com', '+84901234567', 'Ho Chi Minh', 'Vietnam']
        ];

        const contactIds: string[] = [];
        for (const c of contactData) {
            const res = await query(
                `INSERT INTO contacts (tenant_id, first_name, last_name, email, phone, metadata) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [tenantId, c[0], c[1], c[2], c[3], JSON.stringify({ city: c[4], state: c[5] })]
            );
            contactIds.push(res.rows[0].id);
        }

        // 6. Leads (60 items with realistic distribution)
        console.log('Creating 60 Leads...');
        const leadTemplates = [
            { name: 'Manali Adventure', destination: 'Manali', source: 'website', stage: 'new', score: 40, budget: 45000, travelers: 2 },
            { name: 'Goa Honeymoon', destination: 'Goa', source: 'referral', stage: 'contacted', score: 65, budget: 60000, travelers: 2 },
            { name: 'Rajasthan Cultural', destination: 'Jaipur', source: 'social', stage: 'proposal', score: 85, budget: 150000, travelers: 4 },
            { name: 'Iceland Northern Lights', destination: 'Iceland', source: 'google', stage: 'qualified', score: 70, budget: 350000, travelers: 2 },
            { name: 'Bali Beach Escape', destination: 'Bali', source: 'direct', stage: 'won', score: 100, budget: 120000, travelers: 2 },
            { name: 'Kerala Backwaters', destination: 'Alleppey', source: 'email', stage: 'lost', score: 20, budget: 80000, travelers: 4 },
            { name: 'Ladakh Bike Trip', destination: 'Leh', source: 'phone', stage: 'new', score: 35, budget: 55000, travelers: 3 },
            { name: 'Swiss Alps Skiing', destination: 'Zermatt', source: 'referral', stage: 'contacted', score: 55, budget: 450000, travelers: 2 },
            { name: 'Japan Cherry Blossom', destination: 'Tokyo', source: 'website', stage: 'qualified', score: 75, budget: 280000, travelers: 2 },
            { name: 'African Safari', destination: 'Kenya', source: 'social', stage: 'proposal', score: 80, budget: 380000, travelers: 4 },
            { name: 'Dubai Luxury', destination: 'Dubai', source: 'google', stage: 'won', score: 100, budget: 185000, travelers: 2 },
            { name: 'Maldives Overwater', destination: 'Maldives', source: 'direct', stage: 'lost', score: 15, budget: 250000, travelers: 2 },
            { name: 'Machu Picchu Trek', destination: 'Peru', source: 'referral', stage: 'new', score: 45, budget: 320000, travelers: 2 },
            { name: 'Vietnam Food Tour', destination: 'Hanoi', source: 'email', stage: 'contacted', score: 50, budget: 95000, travelers: 3 },
            { name: 'New Zealand Roadtrip', destination: 'Queenstown', source: 'website', stage: 'qualified', score: 60, budget: 420000, travelers: 4 },
            { name: 'Pyramids Explorer', destination: 'Egypt', source: 'phone', stage: 'proposal', score: 90, budget: 185000, travelers: 3 },
            { name: 'Santorini Sunset', destination: 'Greece', source: 'social', stage: 'won', score: 100, budget: 165000, travelers: 2 },
            { name: 'Great Wall Journey', destination: 'China', source: 'google', stage: 'new', score: 30, budget: 145000, travelers: 2 },
            { name: 'Tuscany Vineyard', destination: 'Italy', source: 'referral', stage: 'contacted', score: 58, budget: 220000, travelers: 2 },
            { name: 'Arctic Expedition', destination: 'Svalbard', source: 'website', stage: 'qualified', score: 68, budget: 580000, travelers: 2 },
            { name: 'Amazon Rainforest', destination: 'Brazil', source: 'email', stage: 'proposal', score: 82, budget: 295000, travelers: 3 },
            { name: 'Galapagos Diving', destination: 'Ecuador', source: 'phone', stage: 'won', score: 100, budget: 385000, travelers: 2 },
            { name: 'Paris Romantic', destination: 'France', source: 'direct', stage: 'lost', score: 10, budget: 125000, travelers: 2 },
            { name: 'Andaman Scuba', destination: 'Havelock', source: 'google', stage: 'new', score: 25, budget: 65000, travelers: 2 },
            { name: 'Bhutan Monastery', destination: 'Paro', source: 'referral', stage: 'qualified', score: 72, budget: 145000, travelers: 3 },
            { name: 'Spiti Valley Trek', destination: 'Spiti', source: 'website', stage: 'new', score: 48, budget: 52000, travelers: 2 },
            { name: 'Rishikesh Rafting', destination: 'Rishikesh', source: 'social', stage: 'contacted', score: 62, budget: 25000, travelers: 6 },
            { name: 'Coorg Coffee Estate', destination: 'Coorg', source: 'email', stage: 'proposal', score: 78, budget: 45000, travelers: 4 },
            { name: 'Varanasi Spiritual', destination: 'Varanasi', source: 'phone', stage: 'won', score: 100, budget: 35000, travelers: 2 },
            { name: 'Darjeeling Tea Tour', destination: 'Darjeeling', source: 'referral', stage: 'new', score: 38, budget: 42000, travelers: 3 },
            { name: 'Hampi Heritage Walk', destination: 'Hampi', source: 'website', stage: 'contacted', score: 56, budget: 38000, travelers: 2 },
            { name: 'Rann of Kutch', destination: 'Kutch', source: 'google', stage: 'qualified', score: 64, budget: 55000, travelers: 4 },
            { name: 'Munnar Hills', destination: 'Munnar', source: 'direct', stage: 'proposal', score: 74, budget: 48000, travelers: 3 },
            { name: 'Ooty Toy Train', destination: 'Ooty', source: 'social', stage: 'won', score: 100, budget: 42000, travelers: 4 },
            { name: 'Pondicherry Beach', destination: 'Pondicherry', source: 'email', stage: 'lost', score: 18, budget: 32000, travelers: 2 },
            { name: 'Kaziranga Safari', destination: 'Assam', source: 'phone', stage: 'new', score: 42, budget: 72000, travelers: 3 },
            { name: 'Meghalaya Waterfalls', destination: 'Meghalaya', source: 'referral', stage: 'contacted', score: 52, budget: 68000, travelers: 2 },
            { name: 'Sikkim Monastery', destination: 'Gangtok', source: 'website', stage: 'qualified', score: 66, budget: 58000, travelers: 3 },
            { name: 'Zanskar Valley', destination: 'Zanskar', source: 'google', stage: 'proposal', score: 76, budget: 85000, travelers: 2 },
            { name: 'Tawang Buddhist', destination: 'Tawang', source: 'social', stage: 'won', score: 100, budget: 78000, travelers: 2 },
            { name: 'Chikmagalur Estates', destination: 'Chikmagalur', source: 'direct', stage: 'new', score: 32, budget: 38000, travelers: 2 },
            { name: 'Khajuraho Temples', destination: 'Khajuraho', source: 'email', stage: 'contacted', score: 46, budget: 35000, travelers: 3 },
            { name: 'Orchha Heritage', destination: 'Orchha', source: 'phone', stage: 'qualified', score: 58, budget: 42000, travelers: 2 },
            { name: 'McLeod Ganj Tibetan', destination: 'Dharamshala', source: 'referral', stage: 'proposal', score: 68, budget: 38000, travelers: 2 },
            { name: 'Wayanad Wildlife', destination: 'Wayanad', source: 'website', stage: 'won', score: 100, budget: 45000, travelers: 4 },
            { name: 'Udaipur Lakes', destination: 'Udaipur', source: 'google', stage: 'lost', score: 22, budget: 65000, travelers: 2 },
            { name: 'Jodhpur Blue City', destination: 'Jodhpur', source: 'social', stage: 'new', score: 36, budget: 52000, travelers: 3 },
            { name: 'Pushkar Camel Fair', destination: 'Pushkar', source: 'email', stage: 'contacted', score: 54, budget: 48000, travelers: 2 },
            { name: 'Ranthambore Tiger', destination: 'Ranthambore', source: 'phone', stage: 'qualified', score: 72, budget: 62000, travelers: 4 },
            { name: 'Jim Corbett Safari', destination: 'Corbett', source: 'referral', stage: 'proposal', score: 84, budget: 55000, travelers: 3 },
            { name: 'Nainital Lake', destination: 'Nainital', source: 'website', stage: 'won', score: 100, budget: 42000, travelers: 4 },
            { name: 'Mussoorie Hills', destination: 'Mussoorie', source: 'google', stage: 'new', score: 28, budget: 38000, travelers: 2 },
            { name: 'Shimla Colonial', destination: 'Shimla', source: 'direct', stage: 'contacted', score: 44, budget: 45000, travelers: 3 },
            { name: 'Auli Skiing', destination: 'Auli', source: 'social', stage: 'qualified', score: 62, budget: 52000, travelers: 2 },
            { name: 'Chopta Trek', destination: 'Chopta', source: 'email', stage: 'proposal', score: 70, budget: 32000, travelers: 2 },
            { name: 'Agra Taj Mahal', destination: 'Agra', source: 'phone', stage: 'won', score: 100, budget: 28000, travelers: 2 },
            { name: 'Khajjar Mini Swiss', destination: 'Khajjar', source: 'referral', stage: 'lost', score: 16, budget: 35000, travelers: 3 },
            { name: 'Dalhousie Pine', destination: 'Dalhousie', source: 'website', stage: 'new', score: 34, budget: 38000, travelers: 2 },
            { name: 'Mcleod Ganj Trek', destination: 'Mcleod Ganj', source: 'google', stage: 'contacted', score: 50, budget: 32000, travelers: 2 },
            { name: 'Kasol Backpack', destination: 'Kasol', source: 'social', stage: 'qualified', score: 60, budget: 28000, travelers: 3 }
        ];

        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        const leadIds: string[] = [];

        for (let i = 0; i < leadTemplates.length; i++) {
            const template = leadTemplates[i];
            const contactId = contactIds[i % contactIds.length];
            const contact = contactData[i % contactData.length];
            const assignedId = i % 2 === 0 ? adminId : staffId;
            const priority = template.score > 80 ? 'URGENT' : template.score > 60 ? 'HIGH' : template.score > 40 ? 'MEDIUM' : 'LOW';

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
                    JSON.stringify({ 
                        destination: template.destination, 
                        travelers: template.travelers,
                        budget: template.budget,
                        travelDates: 'Flexible',
                        interests: ['sightseeing', 'culture', 'adventure']
                    }),
                    template.score,
                    priority
                ]
            );
            leadIds.push(res.rows[0].id);
        }

        // 7. Activities (100+ items with realistic distribution)
        console.log('Creating 100+ Activities...');
        const activityTypes = ['call', 'email', 'meeting', 'task', 'note'];
        const subjects = [
            'Initial Inquiry Call', 'Quote Sent via Email', 'Follow up Call - Pricing Discussion',
            'Itinerary Review Meeting', 'Payment Pending Reminder', 'Passport Details Requested',
            'Flight Options Shared', 'Hotel Alternatives Discussion', 'Visa Guidance Provided',
            'Confirmed Booking - Thank You', 'Customization Request', 'Group Discount Query',
            'Payment Confirmation Received', 'Travel Insurance Offered', 'Packing List Shared',
            'Pre-departure Briefing', 'WhatsApp Contact Added', 'Feedback Request Sent',
            'Testimonial Received', 'Complaint Resolution', 'Upgrade Options Discussed',
            'Cancellation Request', 'Refund Processed', 'Reschedule Discussion',
            'Special Requirements Noted', 'Medical Clearance Check', 'Emergency Contact Updated',
            'Welcome Kit Dispatched', 'Review Submitted', 'Referral Received'
        ];

        for (let i = 0; i < 110; i++) {
            const leadId = leadIds[i % leadIds.length];
            const contactId = contactIds[i % contactIds.length];
            const userId = i % 3 === 0 ? adminId : staffId;
            const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
            const status = i < 75 ? 'COMPLETED' : (i < 95 ? 'PENDING' : 'CANCELLED');
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            
            // Mix of past, present, and future activities
            const dayOffset = i < 60 ? -(i % 30) : (i % 15);
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

            const notes = status === 'COMPLETED' 
                ? `Call completed. Customer ${['very interested', 'considering options', 'needs to discuss with family', 'comparing with other quotes'][i % 4]}. ${['Follow up in 2 days', 'Sent detailed itinerary', 'Awaiting response', 'Quote accepted'][i % 4]}.`
                : `Scheduled ${type} activity. Priority: ${['High', 'Medium', 'Low'][i % 3]}.`;

            await query(
                `INSERT INTO activities (tenant_id, lead_id, contact_id, created_by_id, type, status, subject, description, scheduled_at, completed_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    tenantId,
                    leadId,
                    contactId,
                    userId,
                    type,
                    status,
                    subject,
                    notes,
                    scheduledDate,
                    status === 'COMPLETED' ? scheduledDate : null
                ]
            );
        }

        // 8. Bookings (150 items with realistic calculations and payments)
        console.log('Creating 150 Bookings with Payments...');
        const wonLeadsRes = await query(
            `SELECT id, name, inquiry_details FROM leads WHERE tenant_id = $1 AND stage_id = 'won'`, 
            [tenantId]
        );
        
        const bookingStatuses = ['confirmed', 'pending', 'cancelled'];
        const paymentMethods = ['CARD', 'UPI', 'BANK_TRANSFER', 'CASH'];

        for (let i = 0; i < 150; i++) {
            const resourceId = resourceIds[i % resourceIds.length];
            const lead = wonLeadsRes.rows.length > 0 ? wonLeadsRes.rows[i % wonLeadsRes.rows.length] : null;
            
            // Calculate realistic pricing
            const baseAmount = 15000 + (Math.random() * 85000);
            const taxRate = 0.18; // 18% GST
            const discountPercent = i % 10 === 0 ? 10 : (i % 20 === 0 ? 15 : 0);
            const discountAmount = baseAmount * (discountPercent / 100);
            const amountAfterDiscount = baseAmount - discountAmount;
            const taxAmount = amountAfterDiscount * taxRate;
            const totalAmount = amountAfterDiscount + taxAmount;

            // Spread over last 12 months
            const dayOffset = Math.floor(Math.random() * 365);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - dayOffset);

            const startDate = new Date(createdAt);
            startDate.setDate(startDate.getDate() + 30 + Math.floor(Math.random() * 60));
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + (3 + Math.floor(Math.random() * 7)));

            const status = i < 120 ? 'confirmed' : (i < 140 ? 'pending' : 'cancelled');
            const travelers = lead?.inquiry_details?.travelers || (1 + Math.floor(Math.random() * 5));

            const bookingRes = await query(
                `INSERT INTO bookings (
                    tenant_id, resource_id, lead_id, created_by_id, 
                    source, guest_name, guest_email, guest_phone,
                    start_date, end_date, num_guests,
                    status, base_amount, discount_amount, tax_amount, total_amount, 
                    currency, special_requests, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                RETURNING id`,
                [
                    tenantId, resourceId, lead?.id, adminId,
                    ['DIRECT', 'WEBSITE', 'OTA', 'AGENT'][i % 4],
                    lead?.name || `Guest ${i + 1}`,
                    `guest${i}@email.com`,
                    `+9198765${String(i).padStart(5, '0')}`,
                    startDate, endDate, travelers,
                    status, baseAmount, discountAmount, taxAmount, totalAmount,
                    'INR',
                    i % 5 === 0 ? 'Vegetarian meals preferred' : (i % 7 === 0 ? 'Anniversary celebration' : null),
                    createdAt
                ]
            );
            
            const bookingId = bookingRes.rows[0].id;

            // Add payments for confirmed bookings
            if (status === 'confirmed') {
                const advancePercent = 30;
                const advanceAmount = totalAmount * (advancePercent / 100);
                const balanceAmount = totalAmount - advanceAmount;

                // Advance payment
                await query(
                    `INSERT INTO payments (
                        tenant_id, booking_id, amount, currency, method, status,
                        payment_type, transaction_id, payment_date, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        tenantId, bookingId, advanceAmount, 'INR',
                        paymentMethods[i % paymentMethods.length],
                        'COMPLETED', 'ADVANCE',
                        `TXN${Date.now()}${i}`,
                        createdAt,
                        `${advancePercent}% advance payment received`
                    ]
                );

                // Balance payment (70% paid, 20% pending, 10% cancelled)
                if (i % 10 < 7) {
                    const balanceDate = new Date(createdAt);
                    balanceDate.setDate(balanceDate.getDate() + 15);
                    
                    await query(
                        `INSERT INTO payments (
                            tenant_id, booking_id, amount, currency, method, status,
                            payment_type, transaction_id, payment_date, notes
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            tenantId, bookingId, balanceAmount, 'INR',
                            paymentMethods[(i + 1) % paymentMethods.length],
                            'COMPLETED', 'BALANCE',
                            `TXN${Date.now()}${i}BAL`,
                            balanceDate,
                            'Full payment completed'
                        ]
                    );
                } else if (i % 10 < 9) {
                    // Pending balance
                    await query(
                        `INSERT INTO payments (
                            tenant_id, booking_id, amount, currency, method, status,
                            payment_type, notes
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            tenantId, bookingId, balanceAmount, 'INR',
                            'PENDING', 'PENDING', 'BALANCE',
                            'Balance payment pending'
                        ]
                    );
                }
            } else if (status === 'pending') {
                // Only token amount for pending bookings
                const tokenAmount = Math.min(5000, totalAmount * 0.1);
                await query(
                    `INSERT INTO payments (
                        tenant_id, booking_id, amount, currency, method, status,
                        payment_type, transaction_id, payment_date, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        tenantId, bookingId, tokenAmount, 'INR',
                        paymentMethods[i % paymentMethods.length],
                        'COMPLETED', 'TOKEN',
                        `TXN${Date.now()}${i}TKN`,
                        createdAt,
                        'Token amount received'
                    ]
                );
            }
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
