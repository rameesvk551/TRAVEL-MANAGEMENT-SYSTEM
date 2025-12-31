// scripts/seed_all.ts
// Master seed script to populate all modules with rich dummy data

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`\n✅ ${description} - COMPLETED\n`);
  } catch (error: any) {
    console.error(`\n❌ ${description} - FAILED`);
    console.error(error.message);
    throw error;
  }
}

async function seedAll() {
  console.log('\n' + '='.repeat(60));
  console.log('🌱 STARTING COMPLETE DATABASE SEEDING');
  console.log('='.repeat(60));
  console.log('\nThis will populate the database with rich dummy data for:');
  console.log('  • Core: Tenants, Users, Resources, Leads, Contacts, Activities');
  console.log('  • Bookings: 150+ bookings with realistic payments');
  console.log('  • HRMS: 30+ employees with attendance, payroll, leaves, expenses');
  console.log('  • Inventory: 100+ departures with holds and availability');
  console.log('  • WhatsApp: Conversations, messages, templates, campaigns');
  console.log('  • Vendors: 30 vendors with contracts, services, payments');
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    // 1. Main seed (Core data: tenants, users, resources, leads, contacts, activities, bookings)
    await runCommand('tsx src/scripts/seed.ts', 'STEP 1/5: Core Data (Resources, Leads, Bookings, Payments)');
    
    // 2. HRMS seed (Employees, attendance, payroll, leaves, trip assignments, expenses)
    await runCommand('tsx src/scripts/seed_hrms.ts', 'STEP 2/5: HRMS Data (Employees, Payroll, Attendance, Leaves)');
    
    // 3. Inventory seed (Departure instances, holds)
    await runCommand('tsx src/scripts/seed_inventory.ts', 'STEP 3/5: Inventory Data (Departures, Holds, Availability)');
    
    // 4. WhatsApp seed (Conversations, messages, templates, campaigns)
    await runCommand('tsx src/scripts/seed_whatsapp.ts', 'STEP 4/5: WhatsApp Data (Messages, Templates, Campaigns)');
    
    // 5. Vendor seed (Vendors, contracts, services, payments)
    await runCommand('tsx src/scripts/seed_vendors.ts', 'STEP 5/6: Vendor Data (Vendors, Contracts, Payments)');

    // 6. Accounting seed (Chart of Accounts, Journal Entries, Ledger, Bank Accounts)
    await runCommand('tsx src/scripts/seedAccountingData.ts', 'STEP 6/6: Accounting Data (COA, Journal Entries, Ledger)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 DATABASE SUMMARY:');
    console.log('  • 35 Resources (Treks, Tours, Vehicles, Hotels, Activities)');
    console.log('  • 50 Contacts across different locations');
    console.log('  • 60 Leads with realistic scoring and stages');
    console.log('  • 110+ Activities (Calls, Emails, Meetings, Tasks)');
    console.log('  • 150 Bookings with calculated taxes and payments');
    console.log('  • 30+ Employees with full HRMS records');
    console.log('  • 100+ Departure instances with real-time availability');
    console.log('  • 40 Inventory holds (Cart, Payment Pending)');
    console.log('  • 30+ WhatsApp conversations with 250+ messages');
    console.log('  • 6 Message templates and 5 campaigns');
    console.log('  • 30 Vendors with contracts and service records');
    console.log('  • 100 Vendor payments tracked');
    console.log('  • Full Chart of Accounts with 80+ accounts');
    console.log('  • 12 Fiscal periods and tax codes');
    console.log('  • 100+ Journal entries and ledger postings');
    console.log('\n🔐 LOGIN CREDENTIALS:');
    console.log('  Admin: admin@demo.com / password123');
    console.log('  Staff: staff@demo.com / password123');
    console.log('  Tenant: demo-travel');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ SEEDING FAILED - Please check errors above');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

seedAll();
