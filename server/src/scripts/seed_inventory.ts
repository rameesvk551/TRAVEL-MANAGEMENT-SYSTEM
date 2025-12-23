// scripts/seed_inventory.ts
// Seed Inventory & Departure Management data

import { query, closePool } from '../infrastructure/database/index.js';

async function seedInventory() {
  try {
    console.log('🌱 Starting Inventory seed...');

    // Get tenant
    const tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'demo-travel' LIMIT 1`);
    if (tenantRes.rows.length === 0) {
      throw new Error('Tenant not found. Run main seed first.');
    }
    const tenantId = tenantRes.rows[0].id;

    // Get users for created_by references
    const usersRes = await query(`SELECT id FROM users WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    const userId = usersRes.rows[0]?.id || null;

    // Get resources
    const resourcesRes = await query(
      `SELECT id, type, name, capacity, base_price FROM resources WHERE tenant_id = $1`,
      [tenantId]
    );
    const resources = resourcesRes.rows;

    console.log(`Found ${resources.length} resources to create departures for...`);

    // Cleanup inventory data (in reverse dependency order)
    console.log('Cleaning inventory data...');
    await query('DELETE FROM waitlist_entries WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM seat_blocks WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM inventory_holds WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM departure_instances WHERE tenant_id = $1', [tenantId]);

    // 1. Create Departure Instances
    console.log('Creating Departure Instances...');
    const departureIds: string[] = [];
    
    for (const resource of resources) {
      const numDepartures = resource.type === 'trek' ? 8 : 
                           resource.type === 'tour' ? 6 : 
                           resource.type === 'activity' ? 12 : 4;
      
      for (let i = 0; i < numDepartures; i++) {
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() + (i * 7) + 7); // Weekly departures
        
        const endDate = new Date(departureDate);
        endDate.setDate(endDate.getDate() + (resource.type === 'trek' ? 5 : resource.type === 'tour' ? 3 : 1));
        
        const totalCapacity = resource.capacity || 20;
        const blockedSeats = Math.floor(Math.random() * 3);
        
        // Determine status based on capacity and date
        const randomFillRate = Math.random();
        let status = 'OPEN';
        if (randomFillRate < 0.1) status = 'SCHEDULED';
        else if (randomFillRate < 0.3) status = 'FEW_LEFT';
        else if (randomFillRate < 0.4) status = 'FULL';
        else if (departureDate < new Date()) status = 'DEPARTED';
        
        // Price override (some departures have special pricing)
        const priceOverride = i % 3 === 0 ? (resource.base_price * 0.9).toFixed(2) : null; // 10% discount for some
        
        const cutoffDatetime = new Date(departureDate);
        cutoffDatetime.setDate(cutoffDatetime.getDate() - 2);
        
        const res = await query(
          `INSERT INTO departure_instances (
            tenant_id, resource_id, departure_date, departure_time, end_date,
            cutoff_datetime, total_capacity, blocked_seats, min_participants,
            status, is_guaranteed, price_override, currency, attributes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id`,
          [
            tenantId, resource.id, departureDate, '06:00:00', endDate,
            cutoffDatetime, totalCapacity, blockedSeats, Math.ceil(totalCapacity * 0.3),
            status, status === 'FULL' || Math.random() > 0.7, priceOverride, 'INR',
            JSON.stringify({ 
              guide: status === 'FULL' ? 'Assigned' : 'Pending',
              meetingPoint: 'Delhi Hub',
              notes: `${resource.name} departure`
            })
          ]
        );
        departureIds.push(res.rows[0].id);
      }
    }

    console.log(`Created ${departureIds.length} departure instances`);

    // 2. Create Inventory Holds
    console.log('Creating Inventory Holds...');
    const holdTypes = ['CART', 'PAYMENT_PENDING', 'APPROVAL_PENDING'];
    const holdSources = ['WEBSITE', 'ADMIN', 'OTA', 'MANUAL'];
    
    for (let i = 0; i < 40; i++) {
      const departureId = departureIds[Math.floor(Math.random() * departureIds.length)];
      const holdType = holdTypes[Math.floor(Math.random() * holdTypes.length)];
      const source = holdSources[Math.floor(Math.random() * holdSources.length)];
      const seatCount = 1 + Math.floor(Math.random() * 3);
      
      // TTL based on hold type
      const ttlMinutes = holdType === 'CART' ? 15 : 
                        holdType === 'PAYMENT_PENDING' ? 30 : 
                        1440; // 24 hours for approval pending
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
      
      await query(
        `INSERT INTO inventory_holds (
          tenant_id, departure_id, seat_count, source, hold_type,
          expires_at, created_by_id, session_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tenantId, departureId, seatCount, source, holdType,
          expiresAt, userId, `session_${Date.now()}_${i}`,
          `Hold for ${seatCount} seat(s)`
        ]
      );
    }

    // 3. Create Seat Blocks
    console.log('Creating Seat Blocks...');
    const blockTypes = ['STAFF', 'VIP', 'CHANNEL_QUOTA', 'MAINTENANCE'];
    const channels = ['WEBSITE', 'OTA_VIATOR', 'OTA_GYG', null];
    
    for (let i = 0; i < 20; i++) {
      const departureId = departureIds[Math.floor(Math.random() * departureIds.length)];
      const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
      const channel = blockType === 'CHANNEL_QUOTA' ? channels[Math.floor(Math.random() * 3)] : null;
      const seatCount = 1 + Math.floor(Math.random() * 4);
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      
      await query(
        `INSERT INTO seat_blocks (
          tenant_id, departure_id, seat_count, block_type, channel,
          reason, valid_until, created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId, departureId, seatCount, blockType, channel,
          `${blockType} block for ${seatCount} seats`,
          validUntil, userId
        ]
      );
    }

    // 4. Create Waitlist Entries
    console.log('Creating Waitlist Entries...');
    const firstNames = ['Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Suresh', 'Kavita'];
    const lastNames = ['Sharma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Verma', 'Joshi', 'Agarwal'];
    
    for (let i = 0; i < 25; i++) {
      const departureId = departureIds[Math.floor(Math.random() * departureIds.length)];
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const seatCount = 1 + Math.floor(Math.random() * 2);
      
      await query(
        `INSERT INTO waitlist_entries (
          tenant_id, departure_id, position, seat_count,
          guest_name, guest_email, guest_phone, source, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tenantId, departureId, i + 1, seatCount,
          `${firstName} ${lastName}`,
          `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          `+919${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
          'WEBSITE',
          `Waitlist entry for ${seatCount} seat(s)`
        ]
      );
    }

    console.log('✅ Inventory seed completed successfully!');
    console.log(`Created: ${departureIds.length} departures, 40 holds, 20 seat blocks, 25 waitlist entries`);

  } catch (error) {
    console.error('❌ Inventory seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedInventory();
