// scripts/seed_hrms.ts
// Seed HRMS dummy data

import { query, closePool } from '../infrastructure/database/index.js';

async function seedHRMS() {
  try {
    console.log('🌱 Starting HRMS seed...');

    // Get tenant
    const tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'demo-travel' LIMIT 1`);
    if (tenantRes.rows.length === 0) {
      throw new Error('Tenant not found. Run main seed first.');
    }
    const tenantId = tenantRes.rows[0].id;

    // Cleanup HRMS tables (in dependency order)
    console.log('Cleaning HRMS data...');
    await query('DELETE FROM hrms.payroll WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.pay_structures WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.trip_assignments WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.leave_balances WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.leave_requests WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.leave_types WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.attendance WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.employee_skills WHERE employee_id IN (SELECT id FROM hrms.employees WHERE tenant_id = $1)', [tenantId]);
    await query('DELETE FROM hrms.skills WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.employees WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM hrms.departments WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM public.branches WHERE tenant_id = $1', [tenantId]);

    // 1. Create Branches (in public schema)
    console.log('Creating Branches...');
    const branches = await seedBranches(tenantId);

    // 2. Create Departments
    console.log('Creating Departments...');
    const departments = await seedDepartments(tenantId);

    // 3. Create Skills
    console.log('Creating Skills...');
    const skills = await seedSkills(tenantId);

    // 4. Create Employees
    console.log('Creating Employees...');
    const employees = await seedEmployees(tenantId, branches, departments);

    // 5. Assign Skills to Employees
    console.log('Assigning Skills...');
    await assignSkills(employees, skills);

    // 6. Create Leave Types
    console.log('Creating Leave Types...');
    const leaveTypes = await seedLeaveTypes(tenantId);

    // 7. Initialize Leave Balances
    console.log('Initializing Leave Balances...');
    await seedLeaveBalances(tenantId, employees, leaveTypes);

    // 8. Create Leave Requests
    console.log('Creating Leave Requests...');
    await seedLeaveRequests(tenantId, employees, leaveTypes);

    // 9. Create Attendance Records
    console.log('Creating Attendance Records...');
    await seedAttendance(tenantId, employees);

    // 10. Create Pay Structures
    console.log('Creating Pay Structures...');
    await seedPayStructures(tenantId, employees);

    // 11. Create Payroll (payslips)
    console.log('Creating Payroll Records...');
    await seedPayroll(tenantId, employees);

    console.log('✅ HRMS seed completed successfully!');
    console.log(`Created: ${employees.length} employees, ${Object.keys(leaveTypes).length} leave types`);

  } catch (error) {
    console.error('❌ HRMS seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// ============================================
// BRANCHES (public.branches)
// ============================================
async function seedBranches(tenantId: string) {
  const branchData = [
    { name: 'Delhi HQ', code: 'DEL', city: 'New Delhi', state: 'Delhi', type: 'HEAD_OFFICE' },
    { name: 'Mumbai Office', code: 'MUM', city: 'Mumbai', state: 'Maharashtra', type: 'REGIONAL_OFFICE' },
    { name: 'Manali Base', code: 'MNL', city: 'Manali', state: 'Himachal Pradesh', type: 'OPERATIONAL_BASE' },
  ];

  const branches: Record<string, string> = {};
  for (const b of branchData) {
    const res = await query(
      `INSERT INTO public.branches (tenant_id, name, code, city, state, country, type, is_active)
       VALUES ($1, $2, $3, $4, $5, 'India', $6, true) RETURNING id`,
      [tenantId, b.name, b.code, b.city, b.state, b.type]
    );
    branches[b.code] = res.rows[0].id;
  }
  return branches;
}

// ============================================
// DEPARTMENTS (hrms.departments)
// ============================================
async function seedDepartments(tenantId: string) {
  const deptData = [
    { name: 'Operations', code: 'OPS' },
    { name: 'Sales & Marketing', code: 'SALES' },
    { name: 'Trek Guides', code: 'GUIDES' },
    { name: 'Drivers & Logistics', code: 'LOGISTICS' },
    { name: 'Finance', code: 'FIN' },
    { name: 'Human Resources', code: 'HR' },
  ];

  const departments: Record<string, string> = {};
  for (const d of deptData) {
    const res = await query(
      `INSERT INTO hrms.departments (tenant_id, name, code, is_active)
       VALUES ($1, $2, $3, true) RETURNING id`,
      [tenantId, d.name, d.code]
    );
    departments[d.code] = res.rows[0].id;
  }
  return departments;
}

// ============================================
// SKILLS (hrms.skills)
// ============================================
async function seedSkills(tenantId: string) {
  const skillData = [
    { name: 'Trekking Guide', code: 'TREK', category: 'TECHNICAL' },
    { name: 'First Aid Certified', code: 'FAID', category: 'CERTIFICATION' },
    { name: 'Vehicle Driving', code: 'DRIV', category: 'TECHNICAL' },
    { name: 'Customer Service', code: 'CUST', category: 'SOFT_SKILL' },
    { name: 'Hindi Speaking', code: 'HIND', category: 'LANGUAGE' },
    { name: 'English Speaking', code: 'ENGL', category: 'LANGUAGE' },
    { name: 'Rock Climbing', code: 'ROCK', category: 'TECHNICAL' },
    { name: 'Photography', code: 'PHOT', category: 'SOFT_SKILL' },
  ];

  const skills: string[] = [];
  for (const s of skillData) {
    const res = await query(
      `INSERT INTO hrms.skills (tenant_id, code, name, category, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [tenantId, s.code, s.name, s.category]
    );
    skills.push(res.rows[0].id);
  }
  return skills;
}

// ============================================
// EMPLOYEES (hrms.employees)
// ============================================
interface EmployeeInfo {
  id: string;
  code: string;
  cat: string;
  salary: number;
  tripRate?: number;
  dailyRate?: number;
}

async function seedEmployees(
  tenantId: string,
  branches: Record<string, string>,
  departments: Record<string, string>
): Promise<EmployeeInfo[]> {
  const employeeData = [
    // Office Staff
    { code: 'EMP001', first: 'Rajesh', last: 'Kumar', type: 'FULL_TIME', cat: 'OFFICE_STAFF', 
      branch: 'DEL', dept: 'OPS', email: 'rajesh@demo.com', phone: '+919876543001', salary: 45000 },
    { code: 'EMP002', first: 'Priya', last: 'Sharma', type: 'FULL_TIME', cat: 'OFFICE_STAFF',
      branch: 'DEL', dept: 'SALES', email: 'priya@demo.com', phone: '+919876543002', salary: 40000 },
    { code: 'EMP003', first: 'Amit', last: 'Verma', type: 'FULL_TIME', cat: 'OFFICE_STAFF',
      branch: 'MUM', dept: 'SALES', email: 'amit@demo.com', phone: '+919876543003', salary: 42000 },
    { code: 'EMP004', first: 'Sneha', last: 'Patel', type: 'FULL_TIME', cat: 'OFFICE_STAFF',
      branch: 'DEL', dept: 'FIN', email: 'sneha@demo.com', phone: '+919876543004', salary: 50000 },
    { code: 'EMP005', first: 'Vikram', last: 'Singh', type: 'FULL_TIME', cat: 'OFFICE_STAFF',
      branch: 'DEL', dept: 'HR', email: 'vikram@demo.com', phone: '+919876543005', salary: 48000 },
    
    // Field Staff - Guides
    { code: 'GD001', first: 'Tenzing', last: 'Sherpa', type: 'FULL_TIME', cat: 'FIELD_STAFF',
      branch: 'MNL', dept: 'GUIDES', email: 'tenzing@demo.com', phone: '+919876543010', salary: 35000 },
    { code: 'GD002', first: 'Dorje', last: 'Lama', type: 'FULL_TIME', cat: 'FIELD_STAFF',
      branch: 'MNL', dept: 'GUIDES', email: 'dorje@demo.com', phone: '+919876543011', salary: 32000 },
    { code: 'GD003', first: 'Ravi', last: 'Thakur', type: 'CONTRACT', cat: 'FIELD_STAFF',
      branch: 'MNL', dept: 'GUIDES', email: 'ravi@demo.com', phone: '+919876543012', salary: 0, tripRate: 2500 },
    
    // Drivers
    { code: 'DR001', first: 'Suresh', last: 'Yadav', type: 'FULL_TIME', cat: 'FIELD_STAFF',
      branch: 'DEL', dept: 'LOGISTICS', email: 'suresh@demo.com', phone: '+919876543020', salary: 28000 },
    { code: 'DR002', first: 'Ramesh', last: 'Chauhan', type: 'FULL_TIME', cat: 'FIELD_STAFF',
      branch: 'MUM', dept: 'LOGISTICS', email: 'ramesh@demo.com', phone: '+919876543021', salary: 26000 },
    
    // Seasonal Workers
    { code: 'SS001', first: 'Deepak', last: 'Negi', type: 'CONTRACT', cat: 'SEASONAL',
      branch: 'MNL', dept: 'GUIDES', email: 'deepak@demo.com', phone: '+919876543030', salary: 0, dailyRate: 1200 },
    { code: 'SS002', first: 'Manoj', last: 'Rawat', type: 'CONTRACT', cat: 'SEASONAL',
      branch: 'MNL', dept: 'GUIDES', email: 'manoj@demo.com', phone: '+919876543031', salary: 0, dailyRate: 1000 },
  ];

  const employees: EmployeeInfo[] = [];
  
  for (const e of employeeData) {
    const joiningDate = new Date();
    joiningDate.setMonth(joiningDate.getMonth() - Math.floor(Math.random() * 24));
    
    const res = await query(
      `INSERT INTO hrms.employees (
        tenant_id, employee_code, first_name, last_name, type, category,
        branch_id, department_id, joining_date, lifecycle_stage, is_active,
        contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', true, $10)
      RETURNING id`,
      [
        tenantId, e.code, e.first, e.last, e.type, e.cat,
        branches[e.branch], departments[e.dept], joiningDate,
        JSON.stringify({ email: e.email, phone: e.phone })
      ]
    );
    employees.push({ 
      id: res.rows[0].id, 
      code: e.code, 
      cat: e.cat, 
      salary: e.salary,
      tripRate: e.tripRate,
      dailyRate: e.dailyRate
    });
  }
  return employees;
}

// ============================================
// EMPLOYEE SKILLS
// ============================================
async function assignSkills(employees: EmployeeInfo[], skills: string[]) {
  for (const emp of employees) {
    if (emp.cat === 'FIELD_STAFF' || emp.cat === 'SEASONAL') {
      const numSkills = 2 + Math.floor(Math.random() * 4);
      const shuffled = [...skills].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(numSkills, shuffled.length); i++) {
        const proficiency = 1 + Math.floor(Math.random() * 5);
        await query(
          `INSERT INTO hrms.employee_skills (employee_id, skill_id, proficiency_level)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [emp.id, shuffled[i], proficiency]
        );
      }
    }
  }
}

// ============================================
// LEAVE TYPES
// ============================================
async function seedLeaveTypes(tenantId: string) {
  const leaveTypeData = [
    { code: 'CL', name: 'Casual Leave', paid: true, maxDays: 12, notice: 1 },
    { code: 'SL', name: 'Sick Leave', paid: true, maxDays: 10, notice: 0 },
    { code: 'EL', name: 'Earned Leave', paid: true, maxDays: 15, notice: 7 },
    { code: 'LWP', name: 'Leave Without Pay', paid: false, maxDays: 30, notice: 3 },
    { code: 'CO', name: 'Compensatory Off', paid: true, maxDays: 5, notice: 1 },
  ];

  const leaveTypes: Record<string, string> = {};
  for (const lt of leaveTypeData) {
    const res = await query(
      `INSERT INTO hrms.leave_types (
        tenant_id, code, name, is_paid, max_days_per_year, min_notice_days, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`,
      [tenantId, lt.code, lt.name, lt.paid, lt.maxDays, lt.notice]
    );
    leaveTypes[lt.code] = res.rows[0].id;
  }
  return leaveTypes;
}

// ============================================
// LEAVE BALANCES
// ============================================
async function seedLeaveBalances(tenantId: string, employees: EmployeeInfo[], leaveTypes: Record<string, string>) {
  const year = new Date().getFullYear();
  for (const emp of employees) {
    for (const [code, typeId] of Object.entries(leaveTypes)) {
      const opening = code === 'CL' ? 12 : code === 'SL' ? 10 : code === 'EL' ? 15 : 0;
      const taken = Math.floor(Math.random() * Math.min(opening, 5));
      
      await query(
        `INSERT INTO hrms.leave_balances (
          tenant_id, employee_id, leave_type_id, year, opening, taken, pending, accrued
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0)`,
        [tenantId, emp.id, typeId, year, opening, taken]
      );
    }
  }
}

// ============================================
// LEAVE REQUESTS
// ============================================
async function seedLeaveRequests(tenantId: string, employees: EmployeeInfo[], leaveTypes: Record<string, string>) {
  const statuses = ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'];
  
  for (let i = 0; i < 15; i++) {
    const emp = employees[Math.floor(Math.random() * employees.length)];
    const typeCode = ['CL', 'SL', 'EL'][Math.floor(Math.random() * 3)];
    const typeId = leaveTypes[typeCode];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() + Math.floor(Math.random() * 30) - 15);
    const days = 1 + Math.floor(Math.random() * 3);
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + days - 1);

    await query(
      `INSERT INTO hrms.leave_requests (
        tenant_id, employee_id, leave_type_id, from_date, to_date, total_days,
        is_half_day, reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)`,
      [tenantId, emp.id, typeId, fromDate, toDate, days, 'Personal work', status]
    );
  }
}

// ============================================
// ATTENDANCE
// ============================================
async function seedAttendance(tenantId: string, employees: EmployeeInfo[]) {
  const today = new Date();
  
  for (const emp of employees) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Random attendance type
      const rand = Math.random();
      let type = 'PRESENT';
      let status = 'APPROVED';
      
      if (rand < 0.05) type = 'ABSENT';
      else if (rand < 0.1) type = 'HALF_DAY';
      else if (rand < 0.15 && (emp.cat === 'FIELD_STAFF' || emp.cat === 'SEASONAL')) type = 'ON_TRIP';
      
      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
      const checkOut = new Date(date);
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0);
      
      const workHours = type === 'PRESENT' ? 8 + Math.random() : type === 'HALF_DAY' ? 4 : 0;

      await query(
        `INSERT INTO hrms.attendance (
          tenant_id, employee_id, date, type, status, source,
          check_in, check_out, work_hours
        ) VALUES ($1, $2, $3, $4, $5, 'SYSTEM', $6, $7, $8)
        ON CONFLICT (tenant_id, employee_id, date) DO NOTHING`,
        [
          tenantId, emp.id, date, type, status,
          type !== 'ABSENT' ? JSON.stringify({ timestamp: checkIn, mode: 'OFFICE' }) : null,
          type === 'PRESENT' ? JSON.stringify({ timestamp: checkOut, mode: 'OFFICE' }) : null,
          workHours
        ]
      );
    }
  }
}

// ============================================
// PAY STRUCTURES
// ============================================
async function seedPayStructures(tenantId: string, employees: EmployeeInfo[]) {
  for (const emp of employees) {
    const effectiveFrom = new Date();
    effectiveFrom.setMonth(effectiveFrom.getMonth() - 6);
    
    let payModel = 'MONTHLY';
    let baseSalary = emp.salary || 0;
    let tripRate = emp.tripRate || 0;
    let dailyRate = emp.dailyRate || 0;
    
    if (emp.tripRate) payModel = 'PER_TRIP';
    else if (emp.dailyRate) payModel = 'DAILY';

    await query(
      `INSERT INTO hrms.pay_structures (
        tenant_id, employee_id, effective_from, pay_model,
        basic_salary, daily_rate, per_trip_rate, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR')`,
      [tenantId, emp.id, effectiveFrom, payModel, baseSalary, dailyRate, tripRate]
    );
  }
}

// ============================================
// PAYROLL (Monthly payslips)
// ============================================
async function seedPayroll(tenantId: string, employees: EmployeeInfo[]) {
  const today = new Date();
  
  for (let m = 1; m <= 3; m++) {
    const year = today.getMonth() - m < 0 ? today.getFullYear() - 1 : today.getFullYear();
    const month = ((today.getMonth() - m) + 12) % 12 + 1;
    
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    for (const emp of employees) {
      if (!emp.salary && !emp.tripRate && !emp.dailyRate) continue;

      const presentDays = 20 + Math.floor(Math.random() * 5);
      const grossSalary = emp.salary || (emp.dailyRate ? emp.dailyRate * presentDays : 0);
      const totalDeductions = Math.floor(grossSalary * 0.1);
      const netSalary = grossSalary - totalDeductions;

      const earnings = [{ id: 'basic', name: 'Basic Salary', amount: grossSalary, isFixed: true }];
      const deductions = [{ id: 'pf', name: 'Provident Fund', amount: totalDeductions, isStatutory: true }];

      await query(
        `INSERT INTO hrms.payroll (
          tenant_id, employee_id, year, month, period_start, period_end,
          earnings, deductions, gross_salary, net_salary, currency, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'INR', 'PAID')`,
        [
          tenantId, emp.id, year, month, periodStart, periodEnd,
          JSON.stringify(earnings), JSON.stringify(deductions),
          grossSalary, netSalary
        ]
      );
    }
  }
}

seedHRMS();
