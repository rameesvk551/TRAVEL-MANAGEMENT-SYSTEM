// scripts/verify_seed.ts
// Verify seed data counts

import { query, closePool } from '../infrastructure/database/index.js';

async function safeCount(sql: string): Promise<number> {
  try {
    const res = await query(sql);
    return parseInt(res.rows[0].count) || 0;
  } catch {
    return -1; // Table doesn't exist
  }
}

async function verify() {
  try {
    console.log('📊 Verifying seed data...\n');

    console.log('=== HRMS Data ===');
    console.log('Branches:', await safeCount('SELECT count(*) FROM public.branches'));
    console.log('Departments:', await safeCount('SELECT count(*) FROM hrms.departments'));
    console.log('Employees:', await safeCount('SELECT count(*) FROM hrms.employees'));
    console.log('Skills:', await safeCount('SELECT count(*) FROM hrms.skills'));
    console.log('Employee Skills:', await safeCount('SELECT count(*) FROM hrms.employee_skills'));
    console.log('Leave Types:', await safeCount('SELECT count(*) FROM hrms.leave_types'));
    console.log('Leave Balances:', await safeCount('SELECT count(*) FROM hrms.leave_balances'));
    console.log('Leave Requests:', await safeCount('SELECT count(*) FROM hrms.leave_requests'));
    console.log('Attendance Records:', await safeCount('SELECT count(*) FROM hrms.attendance'));
    console.log('Pay Structures:', await safeCount('SELECT count(*) FROM hrms.pay_structures'));
    console.log('Payroll Records:', await safeCount('SELECT count(*) FROM hrms.payroll'));

    console.log('\n=== Core Data ===');
    console.log('Tenants:', await safeCount('SELECT count(*) FROM tenants'));
    console.log('Users:', await safeCount('SELECT count(*) FROM users'));
    console.log('Resources:', await safeCount('SELECT count(*) FROM resources'));
    console.log('Bookings:', await safeCount('SELECT count(*) FROM bookings'));

    console.log('\n=== CRM Data ===');
    console.log('Contacts:', await safeCount('SELECT count(*) FROM contacts'));
    console.log('Leads:', await safeCount('SELECT count(*) FROM leads'));
    console.log('Pipelines:', await safeCount('SELECT count(*) FROM pipelines'));
    console.log('Activities:', await safeCount('SELECT count(*) FROM activities'));

    console.log('\n=== Inventory Data ===');
    console.log('Departure Instances:', await safeCount('SELECT count(*) FROM departure_instances'));
    console.log('Inventory Holds:', await safeCount('SELECT count(*) FROM inventory_holds'));
    console.log('Seat Blocks:', await safeCount('SELECT count(*) FROM seat_blocks'));
    console.log('Waitlist Entries:', await safeCount('SELECT count(*) FROM waitlist_entries'));

    console.log('\n=== Vendor Data ===');
    console.log('Vendors:', await safeCount('SELECT count(*) FROM vendors'));
    console.log('Vendor Contacts:', await safeCount('SELECT count(*) FROM vendor_contacts'));
    console.log('Vendor Contracts:', await safeCount('SELECT count(*) FROM vendor_contracts'));
    console.log('Vendor Rates:', await safeCount('SELECT count(*) FROM vendor_rates'));
    console.log('Vendor Payables:', await safeCount('SELECT count(*) FROM vendor_payables'));
    console.log('Vendor Settlements:', await safeCount('SELECT count(*) FROM vendor_settlements'));

    console.log('\n=== WhatsApp Data ===');
    console.log('Templates:', await safeCount('SELECT count(*) FROM whatsapp_templates'));
    console.log('Conversations:', await safeCount('SELECT count(*) FROM whatsapp_conversations'));
    console.log('Messages:', await safeCount('SELECT count(*) FROM whatsapp_messages'));
    console.log('Opt-Ins:', await safeCount('SELECT count(*) FROM whatsapp_opt_ins'));
    console.log('Timeline Entries:', await safeCount('SELECT count(*) FROM unified_timeline'));

    console.log('\n✅ Verification complete!');
    console.log('(Values of -1 indicate table does not exist)');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

verify();
