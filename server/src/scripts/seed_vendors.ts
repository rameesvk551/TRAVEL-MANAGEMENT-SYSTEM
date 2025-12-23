// scripts/seed_vendors.ts
// Seed Vendor Management data

import { query, closePool } from '../infrastructure/database/index.js';

async function seedVendors() {
  try {
    console.log('🌱 Starting Vendor seed...');

    // Get tenant
    const tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'demo-travel' LIMIT 1`);
    if (tenantRes.rows.length === 0) {
      throw new Error('Tenant not found. Run main seed first.');
    }
    const tenantId = tenantRes.rows[0].id;

    // Cleanup vendor data
    console.log('Cleaning vendor data...');
    await query('DELETE FROM vendor.payments WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor.service_records WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor.contracts WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor.vendors WHERE tenant_id = $1', [tenantId]);

    // 1. Create Vendors (30 vendors)
    console.log('Creating Vendors...');
    const vendorData = [
      // Hotels & Accommodation
      { name: 'Oberoi Hotels & Resorts', type: 'ACCOMMODATION', category: 'HOTEL', 
        contact: 'reservations@oberoi.com', phone: '+911124363030', city: 'New Delhi',
        rating: 5, paymentTerms: 'NET_30' },
      { name: 'Taj Hotels Palaces Resorts', type: 'ACCOMMODATION', category: 'HOTEL',
        contact: 'booking@tajhotels.com', phone: '+912266013366', city: 'Mumbai',
        rating: 5, paymentTerms: 'NET_30' },
      { name: 'ITC Hotels', type: 'ACCOMMODATION', category: 'HOTEL',
        contact: 'central@itchotels.in', phone: '+914066993333', city: 'Hyderabad',
        rating: 5, paymentTerms: 'NET_15' },
      { name: 'The Leela Palaces', type: 'ACCOMMODATION', category: 'HOTEL',
        contact: 'info@theleela.com', phone: '+918322276333', city: 'Goa',
        rating: 5, paymentTerms: 'NET_30' },
      { name: 'Mountain View Resorts', type: 'ACCOMMODATION', category: 'RESORT',
        contact: 'booking@mountainview.com', phone: '+911772651234', city: 'Manali',
        rating: 4, paymentTerms: 'ADVANCE' },
      { name: 'Backpackers Hostel Chain', type: 'ACCOMMODATION', category: 'HOSTEL',
        contact: 'hello@backpackers.in', phone: '+919876543210', city: 'Kasol',
        rating: 3, paymentTerms: 'ADVANCE' },
      
      // Transport
      { name: 'Royal Travels', type: 'TRANSPORT', category: 'BUS',
        contact: 'fleet@royaltravels.com', phone: '+911234567890', city: 'Delhi',
        rating: 4, paymentTerms: 'NET_15' },
      { name: 'Mountain Wheels', type: 'TRANSPORT', category: 'CAR_RENTAL',
        contact: 'booking@mountainwheels.in', phone: '+911772654321', city: 'Shimla',
        rating: 4, paymentTerms: 'ADVANCE' },
      { name: 'Himalayan Cab Services', type: 'TRANSPORT', category: 'CAR_RENTAL',
        contact: 'cabs@himalayan.com', phone: '+919876512345', city: 'Manali',
        rating: 4, paymentTerms: 'NET_7' },
      { name: 'Airways Charter', type: 'TRANSPORT', category: 'FLIGHT',
        contact: 'charter@airways.com', phone: '+911123456789', city: 'Delhi',
        rating: 5, paymentTerms: 'ADVANCE' },
      
      // Food & Catering
      { name: 'Spice Route Caterers', type: 'FOOD', category: 'CATERING',
        contact: 'orders@spiceroute.com', phone: '+911124567890', city: 'Delhi',
        rating: 4, paymentTerms: 'NET_7' },
      { name: 'Mountain Meals', type: 'FOOD', category: 'CATERING',
        contact: 'catering@mountainmeals.in', phone: '+911772656789', city: 'Manali',
        rating: 4, paymentTerms: 'IMMEDIATE' },
      { name: 'Organic Feast Providers', type: 'FOOD', category: 'CATERING',
        contact: 'hello@organicfeast.com', phone: '+919876567890', city: 'Rishikesh',
        rating: 4, paymentTerms: 'NET_7' },
      
      // Equipment & Gear
      { name: 'Adventure Gear Suppliers', type: 'EQUIPMENT', category: 'TREKKING_GEAR',
        contact: 'sales@adventuregear.in', phone: '+911123445566', city: 'Delhi',
        rating: 5, paymentTerms: 'NET_30' },
      { name: 'Mountain Equipment Co-op', type: 'EQUIPMENT', category: 'TREKKING_GEAR',
        contact: 'wholesale@mountainequip.com', phone: '+911772658899', city: 'Manali',
        rating: 4, paymentTerms: 'NET_15' },
      { name: 'Camp & Trek Outfitters', type: 'EQUIPMENT', category: 'CAMPING_GEAR',
        contact: 'orders@camptrek.in', phone: '+919876678901', city: 'Dehradun',
        rating: 4, paymentTerms: 'NET_15' },
      
      // Activities & Guides
      { name: 'River Rafting Adventures', type: 'ACTIVITY', category: 'RAFTING',
        contact: 'rafting@adventures.com', phone: '+911352456789', city: 'Rishikesh',
        rating: 5, paymentTerms: 'ADVANCE' },
      { name: 'Paragliding Paradise', type: 'ACTIVITY', category: 'PARAGLIDING',
        contact: 'fly@paragliding.in', phone: '+911894234567', city: 'Bir Billing',
        rating: 5, paymentTerms: 'ADVANCE' },
      { name: 'Scuba Diving Center', type: 'ACTIVITY', category: 'DIVING',
        contact: 'dive@underwater.com', phone: '+913192234567', city: 'Havelock',
        rating: 5, paymentTerms: 'ADVANCE' },
      
      // Insurance & Medical
      { name: 'Travel Safe Insurance', type: 'INSURANCE', category: 'TRAVEL_INSURANCE',
        contact: 'policies@travelsafe.in', phone: '+911122334455', city: 'Mumbai',
        rating: 5, paymentTerms: 'ADVANCE' },
      { name: 'Mountain Medical Services', type: 'MEDICAL', category: 'MEDICAL_SUPPORT',
        contact: 'emergency@mountainmed.com', phone: '+911772659999', city: 'Manali',
        rating: 5, paymentTerms: 'IMMEDIATE' },
      
      // Local Services
      { name: 'Heritage Walk Guides', type: 'GUIDE', category: 'LOCAL_GUIDE',
        contact: 'guides@heritagewalk.in', phone: '+915622345678', city: 'Jaipur',
        rating: 4, paymentTerms: 'IMMEDIATE' },
      { name: 'Wildlife Safari Experts', type: 'GUIDE', category: 'WILDLIFE_GUIDE',
        contact: 'safari@wildlife.com', phone: '+917462234567', city: 'Ranthambore',
        rating: 5, paymentTerms: 'NET_7' },
      
      // Photography & Media
      { name: 'Trek & Travel Photographers', type: 'MEDIA', category: 'PHOTOGRAPHY',
        contact: 'shoots@trekphoto.in', phone: '+919876789012', city: 'Delhi',
        rating: 4, paymentTerms: 'NET_15' },
      
      // Miscellaneous
      { name: 'Permit & Licensing Services', type: 'SERVICES', category: 'PERMITS',
        contact: 'permits@licensing.in', phone: '+911124789012', city: 'Delhi',
        rating: 4, paymentTerms: 'ADVANCE' },
      { name: 'Emergency Evacuation Services', type: 'SERVICES', category: 'EMERGENCY',
        contact: 'sos@evacuation.com', phone: '+911800123456', city: 'Delhi',
        rating: 5, paymentTerms: 'IMMEDIATE' },
      { name: 'Laundry & Housekeeping', type: 'SERVICES', category: 'HOUSEKEEPING',
        contact: 'service@laundry.in', phone: '+911772651111', city: 'Manali',
        rating: 3, paymentTerms: 'NET_7' },
      { name: 'Travel Document Services', type: 'SERVICES', category: 'DOCUMENTATION',
        contact: 'docs@travelservices.in', phone: '+911123456700', city: 'Delhi',
        rating: 4, paymentTerms: 'ADVANCE' },
      { name: 'Airport Transfer Services', type: 'TRANSPORT', category: 'TRANSFER',
        contact: 'transfers@airport.in', phone: '+911124567800', city: 'Delhi',
        rating: 4, paymentTerms: 'IMMEDIATE' },
      { name: 'Cultural Performance Groups', type: 'ACTIVITY', category: 'CULTURAL',
        contact: 'booking@cultural.in', phone: '+915622456789', city: 'Jaipur',
        rating: 4, paymentTerms: 'ADVANCE' }
    ];

    const vendorIds: string[] = [];
    for (const v of vendorData) {
      const res = await query(
        `INSERT INTO vendor.vendors (
          tenant_id, name, type, category, contact_person, email, phone,
          address, rating, payment_terms, is_active, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          tenantId, v.name, v.type, v.category,
          'Manager', v.contact, v.phone,
          JSON.stringify({ city: v.city, country: 'India' }),
          v.rating, v.paymentTerms, true,
          JSON.stringify({
            certifications: v.rating === 5 ? ['ISO', 'QUALITY_ASSURED'] : [],
            preferredVendor: v.rating >= 4
          })
        ]
      );
      vendorIds.push(res.rows[0].id);
    }

    // 2. Create Contracts (40 contracts)
    console.log('Creating Contracts...');
    const contractStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'PENDING'];
    
    for (let i = 0; i < 40; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      const vendor = vendorData[i % vendorData.length];
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (6 + Math.floor(Math.random() * 18))); // 6-24 months
      
      const status = endDate < new Date() ? 'EXPIRED' : contractStatuses[i % contractStatuses.length];
      const value = 50000 + Math.random() * 450000;
      
      await query(
        `INSERT INTO vendor.contracts (
          tenant_id, vendor_id, contract_number, start_date, end_date,
          value, currency, status, terms, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId, vendorId, `CNT-${2024}-${String(i + 1).padStart(4, '0')}`,
          startDate, endDate, value, 'INR', status,
          JSON.stringify({
            paymentTerms: vendor.paymentTerms,
            renewalClause: true,
            cancellationPeriod: '30 days'
          }),
          JSON.stringify({
            negotiatedBy: 'procurement@demo.com',
            discountRate: Math.floor(Math.random() * 15) + 5
          })
        ]
      );
    }

    // 3. Create Service Records (80 service records)
    console.log('Creating Service Records...');
    const serviceStatuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'CANCELLED'];
    
    for (let i = 0; i < 80; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      const vendor = vendorData[i % vendorData.length];
      
      const serviceDate = new Date();
      serviceDate.setDate(serviceDate.getDate() - Math.floor(Math.random() * 180));
      
      const status = serviceStatuses[i % serviceStatuses.length];
      const amount = 5000 + Math.random() * 45000;
      
      const services = vendor.type === 'ACCOMMODATION' ? ['Room booking', 'Meal package', 'Conference hall'] :
                      vendor.type === 'TRANSPORT' ? ['Vehicle rental', 'Driver charges', 'Fuel'] :
                      vendor.type === 'FOOD' ? ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] :
                      vendor.type === 'EQUIPMENT' ? ['Tent rental', 'Sleeping bag', 'Trekking poles'] :
                      ['Service provided'];
      
      await query(
        `INSERT INTO vendor.service_records (
          tenant_id, vendor_id, service_date, description, amount,
          currency, status, quality_rating, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tenantId, vendorId, serviceDate,
          services[i % services.length], amount, 'INR', status,
          status === 'COMPLETED' ? (3 + Math.floor(Math.random() * 3)) : null,
          status === 'COMPLETED' ? 'Service delivered as expected' : 
          status === 'IN_PROGRESS' ? 'Service in progress' : 'Service cancelled'
        ]
      );
    }

    // 4. Create Vendor Payments (100 payments)
    console.log('Creating Vendor Payments...');
    const paymentStatuses = ['PAID', 'PAID', 'PAID', 'PENDING', 'OVERDUE'];
    const paymentMethods = ['BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD'];
    
    for (let i = 0; i < 100; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      const vendor = vendorData[i % vendorData.length];
      
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 90));
      
      const dueDate = new Date(invoiceDate);
      const dueDays = vendor.paymentTerms === 'NET_30' ? 30 :
                     vendor.paymentTerms === 'NET_15' ? 15 :
                     vendor.paymentTerms === 'NET_7' ? 7 :
                     vendor.paymentTerms === 'ADVANCE' ? -7 : 0;
      dueDate.setDate(dueDate.getDate() + dueDays);
      
      const status = dueDate < new Date() && i % 5 === 4 ? 'OVERDUE' : paymentStatuses[i % paymentStatuses.length];
      const amount = 10000 + Math.random() * 90000;
      
      const paidDate = status === 'PAID' ? new Date(invoiceDate.getTime() + Math.random() * (dueDate.getTime() - invoiceDate.getTime())) : null;
      
      await query(
        `INSERT INTO vendor.payments (
          tenant_id, vendor_id, invoice_number, invoice_date, due_date,
          amount, currency, status, payment_method, payment_date,
          reference_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          tenantId, vendorId, `INV-${2024}-${String(i + 1).padStart(5, '0')}`,
          invoiceDate, dueDate, amount, 'INR', status,
          status === 'PAID' ? paymentMethods[i % paymentMethods.length] : null,
          paidDate,
          status === 'PAID' ? `REF${Date.now()}${i}` : null,
          status === 'OVERDUE' ? 'Payment overdue - follow up required' :
          status === 'PENDING' ? 'Awaiting approval' :
          status === 'PAID' ? 'Payment completed successfully' : null
        ]
      );
    }

    console.log('✅ Vendor seed completed successfully!');
    console.log(`Created: ${vendorIds.length} vendors, 40 contracts, 80 service records, 100 payments`);

  } catch (error) {
    console.error('❌ Vendor seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedVendors();
