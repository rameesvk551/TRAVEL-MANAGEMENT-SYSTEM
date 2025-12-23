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

    // Get resources
    const resourcesRes = await query(
      `SELECT id, type, name, capacity, base_price FROM resources WHERE tenant_id = $1`,
      [tenantId]
    );
    const resources = resourcesRes.rows;

    console.log(`Found ${resources.length} resources to create departures for...`);

    // Cleanup inventory data
    console.log('Cleaning inventory data...');
    await query('DELETE FROM inventory_holds WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM departure_instances WHERE tenant_id = $1', [tenantId]);

    // 1. Create Departure Instances (100+ departures)
    console.log('Creating Departure Instances...');
    const departureIds: string[] = [];
    
    for (const resource of resources) {
      const numDepartures = resource.type === 'trek' ? 8 : 
                           resource.type === 'tour' ? 6 : 
                           resource.type === 'activity' ? 12 : 4;
      
      for (let i = 0; i < numDepartures; i++) {
        const departureDate = new Date();
        departureDate.setDate(departureDate.getDate() + (i * 7) + 7); // Weekly departures
        
        const totalCapacity = resource.capacity;
        const bookedSeats = Math.floor(Math.random() * (totalCapacity * 0.7));
        const heldSeats = Math.floor(Math.random() * 3);
        const availableSeats = totalCapacity - bookedSeats - heldSeats;
        
        // Determine status
        let status = 'OPEN';
        if (bookedSeats === 0 && heldSeats === 0) status = 'SCHEDULED';
        else if (availableSeats <= 3 && availableSeats > 0) status = 'FEW_LEFT';
        else if (availableSeats === 0) status = 'FULL';
        else if (departureDate < new Date()) status = 'DEPARTED';
        
        // Pricing tiers
        const basePrice = resource.base_price;
        const pricingTiers = [
          { name: 'Early Bird', price: basePrice * 0.85, validUntil: new Date(departureDate.getTime() - 30 * 24 * 60 * 60 * 1000) },
          { name: 'Standard', price: basePrice, validUntil: new Date(departureDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
          { name: 'Last Minute', price: basePrice * 1.15, validUntil: departureDate }
        ];
        
        const res = await query(
          `INSERT INTO departure_instances (
            tenant_id, resource_id, departure_date, departure_time,
            total_capacity, booked_seats, held_seats, available_seats,
            status, base_price, currency, pricing_tiers, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id`,
          [
            tenantId, resource.id, departureDate, '06:00:00',
            totalCapacity, bookedSeats, heldSeats, availableSeats,
            status, basePrice, 'INR',
            JSON.stringify(pricingTiers),
            JSON.stringify({ 
              guide: bookedSeats > 0 ? 'Assigned' : 'Pending',
              meetingPoint: 'Delhi Hub',
              notes: `${resource.name} departure`
            })
          ]
        );
        departureIds.push(res.rows[0].id);
      }
    }

    // 2. Create Inventory Holds (cart items, payment pending, etc.)
    console.log('Creating Inventory Holds...');
    const holdTypes = ['CART', 'PAYMENT_PENDING', 'APPROVAL_PENDING'];
    const holdSources = ['WEBSITE', 'ADMIN', 'OTA', 'MANUAL'];
    
    for (let i = 0; i < 40; i++) {
      const departureId = departureIds[Math.floor(Math.random() * departureIds.length)];
      const type = holdTypes[Math.floor(Math.random() * holdTypes.length)];
      const source = holdSources[Math.floor(Math.random() * holdSources.length)];
      const quantity = 1 + Math.floor(Math.random() * 3);
      
      // TTL based on hold type
      const ttlMinutes = type === 'CART' ? 30 : 
                        type === 'PAYMENT_PENDING' ? 1440 : // 24 hours
                        type === 'APPROVAL_PENDING' ? 2880 : 60; // 48 hours
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);
      
      const status = i < 25 ? 'ACTIVE' : (i < 35 ? 'EXPIRED' : 'RELEASED');
      
      await query(
        `INSERT INTO inventory_holds (
          tenant_id, departure_id, quantity, hold_type, source,
          expires_at, status, customer_email, customer_phone, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId, departureId, quantity, type, source,
          expiresAt, status,
          `customer${i}@email.com`,
          `+9198765${String(i).padStart(5, '0')}`,
          JSON.stringify({
            sessionId: `sess_${Date.now()}_${i}`,
            referrer: source === 'WEBSITE' ? 'organic' : source
          })
        ]
      );
    }

    console.log('✅ Inventory seed completed successfully!');
    console.log(`Created: ${departureIds.length} departures, 40 holds`);

  } catch (error) {
    console.error('❌ Inventory seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedInventory();
