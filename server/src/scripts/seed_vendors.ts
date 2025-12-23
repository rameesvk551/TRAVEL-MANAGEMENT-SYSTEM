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

    // Get users for created_by references
    const usersRes = await query(`SELECT id FROM users WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    const userId = usersRes.rows[0]?.id || null;

    // Cleanup vendor data (in reverse dependency order)
    console.log('Cleaning vendor data...');
    await query('DELETE FROM vendor_settlements WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor_payables WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor_assignments WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor_rates WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor_contracts WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendor_contacts WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM vendors WHERE tenant_id = $1', [tenantId]);

    // 1. Create Vendors (30 vendors)
    console.log('Creating Vendors...');
    const vendorData = [
      // Transport vendors
      { legalName: 'Royal Travels Pvt Ltd', displayName: 'Royal Travels', type: 'TRANSPORT',
        contactName: 'Rajan Kumar', phone: '+911234567890', email: 'fleet@royaltravels.com',
        city: 'Delhi', rating: 4 },
      { legalName: 'Mountain Wheels Transport', displayName: 'Mountain Wheels', type: 'TRANSPORT',
        contactName: 'Anil Sharma', phone: '+911772654321', email: 'booking@mountainwheels.in',
        city: 'Shimla', rating: 4 },
      { legalName: 'Himalayan Cab Services', displayName: 'Himalayan Cabs', type: 'TRANSPORT',
        contactName: 'Suresh Negi', phone: '+919876512345', email: 'cabs@himalayan.com',
        city: 'Manali', rating: 4 },
      { legalName: 'Airport Transfer Services LLP', displayName: 'Airport Transfers', type: 'TRANSPORT',
        contactName: 'Deepak Verma', phone: '+911124567800', email: 'transfers@airport.in',
        city: 'Delhi', rating: 4 },
      
      // Hotel vendors
      { legalName: 'Oberoi Hotels & Resorts', displayName: 'Oberoi Hotels', type: 'HOTEL',
        contactName: 'Vikram Singh', phone: '+911124363030', email: 'reservations@oberoi.com',
        city: 'New Delhi', rating: 5 },
      { legalName: 'Taj Hotels Palaces Resorts', displayName: 'Taj Hotels', type: 'HOTEL',
        contactName: 'Priya Menon', phone: '+912266013366', email: 'booking@tajhotels.com',
        city: 'Mumbai', rating: 5 },
      { legalName: 'ITC Hotels Limited', displayName: 'ITC Hotels', type: 'HOTEL',
        contactName: 'Rahul Reddy', phone: '+914066993333', email: 'central@itchotels.in',
        city: 'Hyderabad', rating: 5 },
      { legalName: 'The Leela Palaces Hotels', displayName: 'The Leela', type: 'HOTEL',
        contactName: 'Anjali Deshpande', phone: '+918322276333', email: 'info@theleela.com',
        city: 'Goa', rating: 5 },
      { legalName: 'Mountain View Resorts Pvt Ltd', displayName: 'Mountain View Resorts', type: 'HOTEL',
        contactName: 'Vikram Thakur', phone: '+911772651234', email: 'booking@mountainview.com',
        city: 'Manali', rating: 4 },
      { legalName: 'Backpackers Hostel Chain', displayName: 'Backpackers Hostel', type: 'HOTEL',
        contactName: 'Amit Joshi', phone: '+919876543210', email: 'hello@backpackers.in',
        city: 'Kasol', rating: 3 },
      
      // Equipment vendors
      { legalName: 'Adventure Gear Suppliers Pvt Ltd', displayName: 'Adventure Gear', type: 'EQUIPMENT',
        contactName: 'Mohit Rawat', phone: '+911123445566', email: 'sales@adventuregear.in',
        city: 'Delhi', rating: 5 },
      { legalName: 'Mountain Equipment Co-op', displayName: 'Mountain Equipment', type: 'EQUIPMENT',
        contactName: 'Prakash Bisht', phone: '+911772658899', email: 'wholesale@mountainequip.com',
        city: 'Manali', rating: 4 },
      { legalName: 'Camp & Trek Outfitters LLP', displayName: 'Camp & Trek', type: 'EQUIPMENT',
        contactName: 'Sanjay Chauhan', phone: '+919876678901', email: 'orders@camptrek.in',
        city: 'Dehradun', rating: 4 },
      
      // Guide vendors
      { legalName: 'Heritage Walk Guides Association', displayName: 'Heritage Walk Guides', type: 'GUIDE',
        contactName: 'Fatima Khan', phone: '+915622345678', email: 'guides@heritagewalk.in',
        city: 'Jaipur', rating: 4 },
      { legalName: 'Wildlife Safari Experts', displayName: 'Wildlife Safari', type: 'GUIDE',
        contactName: 'Ravi Kumar', phone: '+917462234567', email: 'safari@wildlife.com',
        city: 'Ranthambore', rating: 5 },
      { legalName: 'River Rafting Adventures Pvt Ltd', displayName: 'River Rafting Adventures', type: 'GUIDE',
        contactName: 'Naveen Rana', phone: '+911352456789', email: 'rafting@adventures.com',
        city: 'Rishikesh', rating: 5 },
      { legalName: 'Paragliding Paradise Sports', displayName: 'Paragliding Paradise', type: 'GUIDE',
        contactName: 'Hemant Thakur', phone: '+911894234567', email: 'fly@paragliding.in',
        city: 'Bir Billing', rating: 5 },
      { legalName: 'Scuba Diving Center Andaman', displayName: 'Scuba Diving Center', type: 'GUIDE',
        contactName: 'Thomas D\'Souza', phone: '+913192234567', email: 'dive@underwater.com',
        city: 'Havelock', rating: 5 },
      
      // Permit agents
      { legalName: 'Permit & Licensing Services', displayName: 'Permit Services', type: 'PERMIT_AGENT',
        contactName: 'Raj Malhotra', phone: '+911124789012', email: 'permits@licensing.in',
        city: 'Delhi', rating: 4 },
      { legalName: 'Travel Document Services LLP', displayName: 'Travel Docs', type: 'PERMIT_AGENT',
        contactName: 'Sunil Kapoor', phone: '+911123456700', email: 'docs@travelservices.in',
        city: 'Delhi', rating: 4 },
      
      // Catering vendors
      { legalName: 'Spice Route Caterers Pvt Ltd', displayName: 'Spice Route Caterers', type: 'CATERING',
        contactName: 'Chef Harish', phone: '+911124567890', email: 'orders@spiceroute.com',
        city: 'Delhi', rating: 4 },
      { legalName: 'Mountain Meals Services', displayName: 'Mountain Meals', type: 'CATERING',
        contactName: 'Geeta Devi', phone: '+911772656789', email: 'catering@mountainmeals.in',
        city: 'Manali', rating: 4 },
      { legalName: 'Organic Feast Providers LLP', displayName: 'Organic Feast', type: 'CATERING',
        contactName: 'Yogesh Sharma', phone: '+919876567890', email: 'hello@organicfeast.com',
        city: 'Rishikesh', rating: 4 },
      
      // Other vendors
      { legalName: 'Travel Safe Insurance Brokers', displayName: 'Travel Safe Insurance', type: 'OTHER',
        contactName: 'Neha Agarwal', phone: '+911122334455', email: 'policies@travelsafe.in',
        city: 'Mumbai', rating: 5 },
      { legalName: 'Mountain Medical Services', displayName: 'Mountain Medical', type: 'OTHER',
        contactName: 'Dr. Ramesh Gupta', phone: '+911772659999', email: 'emergency@mountainmed.com',
        city: 'Manali', rating: 5 },
      { legalName: 'Trek & Travel Photographers', displayName: 'Trek Photos', type: 'OTHER',
        contactName: 'Arjun Kapoor', phone: '+919876789012', email: 'shoots@trekphoto.in',
        city: 'Delhi', rating: 4 },
      { legalName: 'Emergency Evacuation Services', displayName: 'Emergency Evac', type: 'OTHER',
        contactName: 'Major Vikram (Retd)', phone: '+911800123456', email: 'sos@evacuation.com',
        city: 'Delhi', rating: 5 },
      { legalName: 'Laundry & Housekeeping Services', displayName: 'Clean & Fresh', type: 'OTHER',
        contactName: 'Ram Prasad', phone: '+911772651111', email: 'service@laundry.in',
        city: 'Manali', rating: 3 },
      { legalName: 'Cultural Performance Groups', displayName: 'Cultural Shows', type: 'OTHER',
        contactName: 'Lakshmi Devi', phone: '+915622456789', email: 'booking@cultural.in',
        city: 'Jaipur', rating: 4 }
    ];

    const vendorIds: string[] = [];
    for (const v of vendorData) {
      const res = await query(
        `INSERT INTO vendors (
          tenant_id, legal_name, display_name, vendor_type,
          primary_contact_name, primary_contact_phone, primary_contact_email,
          city, internal_rating, status, created_by
        ) VALUES ($1, $2, $3, $4::vendor_type, $5, $6, $7, $8, $9, 'ACTIVE'::vendor_status, $10)
        RETURNING id`,
        [
          tenantId, v.legalName, v.displayName, v.type,
          v.contactName, v.phone, v.email, v.city, v.rating, userId
        ]
      );
      vendorIds.push(res.rows[0].id);
    }

    // 2. Create Vendor Contacts
    console.log('Creating Vendor Contacts...');
    for (let i = 0; i < vendorIds.length; i++) {
      const v = vendorData[i];
      await query(
        `INSERT INTO vendor_contacts (
          tenant_id, vendor_id, name, role, phone, email, is_primary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, vendorIds[i], v.contactName, 'Manager', v.phone, v.email, true]
      );
    }

    // 3. Create Contracts (40 contracts)
    console.log('Creating Contracts...');
    const contractStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'DRAFT'];
    
    for (let i = 0; i < 40; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (6 + Math.floor(Math.random() * 18))); // 6-24 months
      
      const status = endDate < new Date() ? 'EXPIRED' : contractStatuses[i % contractStatuses.length];
      
      await query(
        `INSERT INTO vendor_contracts (
          tenant_id, vendor_id, contract_number, start_date, end_date,
          status, payment_terms_days, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6::contract_status, $7, $8)`,
        [
          tenantId, vendorId, `CNT-${2024}-${String(i + 1).padStart(4, '0')}`,
          startDate, endDate, status, [7, 15, 30][i % 3], userId
        ]
      );
    }

    // 4. Create Vendor Rates
    console.log('Creating Vendor Rates...');
    for (let i = 0; i < vendorIds.length; i++) {
      const vendorId = vendorIds[i];
      const vendor = vendorData[i];
      
      const baseRate = vendor.type === 'HOTEL' ? 5000 + Math.random() * 10000 :
                      vendor.type === 'TRANSPORT' ? 2000 + Math.random() * 5000 :
                      vendor.type === 'GUIDE' ? 3000 + Math.random() * 4000 :
                      1000 + Math.random() * 3000;
      
      await query(
        `INSERT INTO vendor_rates (
          tenant_id, vendor_id, rate_name, rate_type, valid_from, base_rate, currency, is_active, created_by
        ) VALUES ($1, $2, $3, 'FIXED'::rate_type, $4, $5, 'INR', true, $6)`,
        [
          tenantId, vendorId, 'Standard Rate', new Date(), baseRate, userId
        ]
      );
    }

    // 5. Create Vendor Payables (100 payables)
    console.log('Creating Vendor Payables...');
    const payableStatuses = ['PAID', 'PAID', 'PAID', 'PENDING', 'APPROVED'];
    
    for (let i = 0; i < 100; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 60) - 30);
      
      const status = payableStatuses[i % payableStatuses.length];
      const grossAmount = 10000 + Math.random() * 90000;
      const netPayable = grossAmount * 0.95; // 5% deductions
      
      await query(
        `INSERT INTO vendor_payables (
          tenant_id, vendor_id, payable_number, gross_amount, net_payable,
          currency, due_date, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7::payable_status, $8)`,
        [
          tenantId, vendorId, `PAY-${2024}-${String(i + 1).padStart(5, '0')}`,
          grossAmount, netPayable, dueDate, status, userId
        ]
      );
    }

    // 6. Create Vendor Settlements (for paid payables)
    console.log('Creating Vendor Settlements...');
    const paymentMethods = ['BANK_TRANSFER', 'UPI', 'CHEQUE'];
    
    for (let i = 0; i < 60; i++) {
      const vendorId = vendorIds[i % vendorIds.length];
      const amount = 10000 + Math.random() * 90000;
      
      const paymentDate = new Date();
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 90));
      
      await query(
        `INSERT INTO vendor_settlements (
          tenant_id, vendor_id, settlement_number, amount, currency,
          payment_method, payment_reference, payment_date, created_by
        ) VALUES ($1, $2, $3, $4, 'INR', $5::settlement_method, $6, $7, $8)`,
        [
          tenantId, vendorId, `SET-${2024}-${String(i + 1).padStart(5, '0')}`,
          amount, paymentMethods[i % paymentMethods.length],
          `REF${Date.now()}${i}`, paymentDate, userId
        ]
      );
    }

    console.log('✅ Vendor seed completed successfully!');
    console.log(`Created: ${vendorIds.length} vendors, 40 contracts, ${vendorIds.length} rates, 100 payables, 60 settlements`);

  } catch (error) {
    console.error('❌ Vendor seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedVendors();
