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
    console.log('Inventory Departures:', await safeCount('SELECT count(*) FROM inventory.departures'));

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
