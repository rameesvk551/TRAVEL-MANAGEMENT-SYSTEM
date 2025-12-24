/**
 * Seed Accounting Data Script
 * 
 * Populates the accounting system with realistic dummy data for testing and development.
 * 
 * Run with: npx tsx src/scripts/seedAccountingData.ts
 */

import { query, getClient } from '../infrastructure/database/connection.js';
import { generateId } from '../shared/utils/index.js';

// We'll fetch the actual tenant ID and branch IDs from the database
let TENANT_ID: string;
let BRANCHES: { id: string; name: string; stateCode?: string }[] = [];
let ADMIN_USER_ID: string;

// Fiscal year settings (April to March - Indian FY)
const CURRENT_FY = {
    year: 2025,
    startDate: new Date('2024-04-01'),
    endDate: new Date('2025-03-31'),
};

async function seedAccountingData() {
    console.log('🚀 Starting Accounting Data Seed...\n');

    const client = await getClient();

    try {
        // First, get the tenant and branches from existing data
        console.log('🔍 Looking up existing tenant and branches...');
        const tenantResult = await client.query('SELECT id FROM public.tenants LIMIT 1');
        if (tenantResult.rows.length === 0) {
            throw new Error('No tenant found! Please run the main seed script first.');
        }
        TENANT_ID = tenantResult.rows[0].id;
        console.log(`   Found tenant: ${TENANT_ID}`);

        const branchResult = await client.query('SELECT id, name FROM public.branches WHERE tenant_id = $1', [TENANT_ID]);
        if (branchResult.rows.length === 0) {
            throw new Error('No branches found! Please run the main seed script first.');
        }
        BRANCHES = branchResult.rows;
        console.log(`   Found ${BRANCHES.length} branches\n`);

        // Get admin user for created_by
        const userResult = await client.query(`SELECT id FROM public.users WHERE tenant_id = $1 LIMIT 1`, [TENANT_ID]);
        if (userResult.rows.length === 0) {
            throw new Error('No users found! Please run the main seed script first.');
        }
        ADMIN_USER_ID = userResult.rows[0].id;

        await client.query('BEGIN');

        // 1. Create Chart of Accounts
        console.log('📊 Creating Chart of Accounts...');
        const accounts = await createChartOfAccounts(client);
        console.log(`   ✓ Created ${Object.keys(accounts).length} accounts\n`);

        // 2. Create Fiscal Year and Periods
        console.log('📅 Creating Fiscal Year and Periods...');
        const fiscalYearId = await createFiscalYear(client);
        console.log(`   ✓ Created FY ${CURRENT_FY.year} with 12 periods\n`);

        // 3. Create Tax Codes
        console.log('💰 Creating Tax Codes...');
        const taxCodes = await createTaxCodes(client, accounts);
        console.log(`   ✓ Created ${taxCodes.length} tax codes\n`);

        // 4. Create Bank Accounts
        console.log('🏦 Creating Bank Accounts...');
        const bankAccounts = await createBankAccounts(client, accounts);
        console.log(`   ✓ Created ${bankAccounts.length} bank accounts\n`);

        // 5. Create Sample Journal Entries (simulating bookings)
        console.log('📝 Creating Sample Journal Entries...');
        const journalCount = await createSampleJournalEntries(client, accounts);
        console.log(`   ✓ Created ${journalCount} journal entries with ledger postings\n`);

        // 6. Create Bank Transactions
        console.log('🔄 Creating Bank Transactions...');
        const bankTxns = await createBankTransactions(client, bankAccounts);
        console.log(`   ✓ Created ${bankTxns} bank transactions\n`);

        await client.query('COMMIT');
        console.log('✅ Accounting data seeded successfully!\n');

        // Print summary
        await printSummary();

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// ==================== CHART OF ACCOUNTS ====================

async function createChartOfAccounts(client: any): Promise<Record<string, string>> {
    const accounts: Record<string, string> = {};

    // Note: account_type must be: 'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
    const chartOfAccounts = [
        // ASSETS (1xxx)
        { code: '1000', name: 'Assets', type: 'ASSET', normal: 'DEBIT', level: 0, isHeader: true },
        { code: '1100', name: 'Current Assets', type: 'ASSET', normal: 'DEBIT', level: 1, parent: '1000', isHeader: true },
        { code: '1101', name: 'Cash on Hand', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1100', subType: 'CASH' },
        { code: '1102', name: 'Bank - HDFC Current', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1100', isBank: true, subType: 'BANK' },
        { code: '1103', name: 'Bank - ICICI Current', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1100', isBank: true, subType: 'BANK' },
        { code: '1104', name: 'Bank - SBI Savings', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1100', isBank: true, subType: 'BANK' },
        { code: '1200', name: 'Receivables', type: 'ASSET', normal: 'DEBIT', level: 1, parent: '1000', isHeader: true },
        { code: '1201', name: 'Accounts Receivable - Customers', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1200', subType: 'RECEIVABLE' },
        { code: '1210', name: 'Advance to Vendors', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1200', subType: 'ADVANCE' },
        { code: '1300', name: 'Prepaid Expenses', type: 'ASSET', normal: 'DEBIT', level: 1, parent: '1000', isHeader: true },
        { code: '1301', name: 'Prepaid Rent', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1300', subType: 'PREPAID' },
        { code: '1302', name: 'Prepaid Insurance', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1300', subType: 'PREPAID' },
        { code: '1400', name: 'Tax Assets', type: 'ASSET', normal: 'DEBIT', level: 1, parent: '1000', isHeader: true },
        { code: '1401', name: 'GST Input Credit - CGST', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1400', isTax: true, subType: 'TAX_ASSET' },
        { code: '1402', name: 'GST Input Credit - SGST', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1400', isTax: true, subType: 'TAX_ASSET' },
        { code: '1403', name: 'GST Input Credit - IGST', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1400', isTax: true, subType: 'TAX_ASSET' },
        { code: '1500', name: 'Fixed Assets', type: 'ASSET', normal: 'DEBIT', level: 1, parent: '1000', isHeader: true },
        { code: '1501', name: 'Office Equipment', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1500', subType: 'FIXED_ASSET' },
        { code: '1502', name: 'Furniture & Fixtures', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1500', subType: 'FIXED_ASSET' },
        { code: '1503', name: 'Computers & IT Equipment', type: 'ASSET', normal: 'DEBIT', level: 2, parent: '1500', subType: 'FIXED_ASSET' },

        // LIABILITIES (2xxx)
        { code: '2000', name: 'Liabilities', type: 'LIABILITY', normal: 'CREDIT', level: 0, isHeader: true },
        { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', normal: 'CREDIT', level: 1, parent: '2000', isHeader: true },
        { code: '2101', name: 'Accounts Payable - Vendors', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2100', subType: 'PAYABLE' },
        { code: '2102', name: 'Accounts Payable - Airlines', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2100', subType: 'PAYABLE' },
        { code: '2103', name: 'Accounts Payable - Hotels', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2100', subType: 'PAYABLE' },
        { code: '2200', name: 'Tax Liabilities', type: 'LIABILITY', normal: 'CREDIT', level: 1, parent: '2000', isHeader: true },
        { code: '2201', name: 'GST Output - CGST', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2200', isTax: true, subType: 'TAX_LIABILITY' },
        { code: '2202', name: 'GST Output - SGST', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2200', isTax: true, subType: 'TAX_LIABILITY' },
        { code: '2203', name: 'GST Output - IGST', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2200', isTax: true, subType: 'TAX_LIABILITY' },
        { code: '2204', name: 'TDS Payable - 194C', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2200', isTax: true, subType: 'TDS_PAYABLE' },
        { code: '2205', name: 'TDS Payable - 194J', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2200', isTax: true, subType: 'TDS_PAYABLE' },
        { code: '2300', name: 'Employee Liabilities', type: 'LIABILITY', normal: 'CREDIT', level: 1, parent: '2000', isHeader: true },
        { code: '2301', name: 'Salaries Payable', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2300', subType: 'ACCRUAL' },
        { code: '2302', name: 'PF Payable', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2300', subType: 'STATUTORY' },
        { code: '2303', name: 'ESI Payable', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2300', subType: 'STATUTORY' },
        { code: '2400', name: 'Customer Advances', type: 'LIABILITY', normal: 'CREDIT', level: 1, parent: '2000', isHeader: true },
        { code: '2401', name: 'Advance from Customers', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2400', subType: 'ADVANCE' },
        { code: '2500', name: 'Inter-Branch', type: 'LIABILITY', normal: 'CREDIT', level: 1, parent: '2000', isHeader: true },
        { code: '2501', name: 'Due to/from Branches', type: 'LIABILITY', normal: 'CREDIT', level: 2, parent: '2500', subType: 'INTER_COMPANY' },

        // EQUITY (3xxx)
        { code: '3000', name: 'Equity', type: 'EQUITY', normal: 'CREDIT', level: 0, isHeader: true },
        { code: '3100', name: 'Capital', type: 'EQUITY', normal: 'CREDIT', level: 1, parent: '3000', isHeader: true },
        { code: '3101', name: 'Owner\'s Capital', type: 'EQUITY', normal: 'CREDIT', level: 2, parent: '3100', subType: 'CAPITAL' },
        { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normal: 'CREDIT', level: 1, parent: '3000', isHeader: true },
        { code: '3201', name: 'Retained Earnings - Prior Years', type: 'EQUITY', normal: 'CREDIT', level: 2, parent: '3200', subType: 'RETAINED_EARNINGS' },
        { code: '3202', name: 'Current Year Earnings', type: 'EQUITY', normal: 'CREDIT', level: 2, parent: '3200', subType: 'CURRENT_EARNINGS' },

        // REVENUE (4xxx) - Note: Using REVENUE instead of INCOME
        { code: '4000', name: 'Revenue', type: 'REVENUE', normal: 'CREDIT', level: 0, isHeader: true },
        { code: '4100', name: 'Service Revenue', type: 'REVENUE', normal: 'CREDIT', level: 1, parent: '4000', isHeader: true },
        { code: '4101', name: 'Package Tour Revenue', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4100', subType: 'OPERATING' },
        { code: '4102', name: 'Flight Booking Revenue', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4100', subType: 'OPERATING' },
        { code: '4103', name: 'Hotel Booking Revenue', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4100', subType: 'OPERATING' },
        { code: '4104', name: 'Visa Processing Revenue', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4100', subType: 'OPERATING' },
        { code: '4105', name: 'Travel Insurance Revenue', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4100', subType: 'OPERATING' },
        { code: '4200', name: 'Commission Income', type: 'REVENUE', normal: 'CREDIT', level: 1, parent: '4000', isHeader: true },
        { code: '4201', name: 'Airline Commission', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4200', subType: 'COMMISSION' },
        { code: '4202', name: 'Hotel Commission', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4200', subType: 'COMMISSION' },
        { code: '4300', name: 'Other Income', type: 'REVENUE', normal: 'CREDIT', level: 1, parent: '4000', isHeader: true },
        { code: '4301', name: 'Forex Gain', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4300', subType: 'OTHER' },
        { code: '4302', name: 'Interest Income', type: 'REVENUE', normal: 'CREDIT', level: 2, parent: '4300', subType: 'OTHER' },

        // COST OF SALES (5xxx)
        { code: '5000', name: 'Cost of Sales', type: 'EXPENSE', normal: 'DEBIT', level: 0, isHeader: true },
        { code: '5100', name: 'Direct Costs', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '5000', isHeader: true },
        { code: '5101', name: 'Airline Ticket Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5102', name: 'Hotel Accommodation Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5103', name: 'Transport Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5104', name: 'Activity & Sightseeing Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5105', name: 'Visa Processing Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5106', name: 'Travel Insurance Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },
        { code: '5107', name: 'Guide & Escort Costs', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '5100', subType: 'COST_OF_SALES' },

        // OPERATING EXPENSES (6xxx)
        { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', normal: 'DEBIT', level: 0, isHeader: true },
        { code: '6100', name: 'Personnel Expenses', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '6000', isHeader: true },
        { code: '6101', name: 'Salaries & Wages', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6100', subType: 'PAYROLL' },
        { code: '6102', name: 'Employee Benefits', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6100', subType: 'PAYROLL' },
        { code: '6103', name: 'PF Contribution - Employer', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6100', subType: 'STATUTORY' },
        { code: '6104', name: 'ESI Contribution - Employer', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6100', subType: 'STATUTORY' },
        { code: '6200', name: 'Office Expenses', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '6000', isHeader: true },
        { code: '6201', name: 'Rent Expense', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6200', subType: 'OCCUPANCY' },
        { code: '6202', name: 'Electricity & Utilities', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6200', subType: 'UTILITIES' },
        { code: '6203', name: 'Office Supplies', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6200', subType: 'SUPPLIES' },
        { code: '6204', name: 'Internet & Phone', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6200', subType: 'UTILITIES' },
        { code: '6300', name: 'Marketing Expenses', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '6000', isHeader: true },
        { code: '6301', name: 'Advertising', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6300', subType: 'MARKETING' },
        { code: '6302', name: 'Digital Marketing', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6300', subType: 'MARKETING' },
        { code: '6303', name: 'Trade Shows & Events', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6300', subType: 'MARKETING' },
        { code: '6400', name: 'Travel & Entertainment', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '6000', isHeader: true },
        { code: '6401', name: 'Staff Travel', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6400', subType: 'TRAVEL' },
        { code: '6402', name: 'Client Entertainment', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6400', subType: 'ENTERTAINMENT' },
        { code: '6500', name: 'Professional Fees', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '6000', isHeader: true },
        { code: '6501', name: 'Legal Fees', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6500', subType: 'PROFESSIONAL' },
        { code: '6502', name: 'Audit Fees', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6500', subType: 'PROFESSIONAL' },
        { code: '6503', name: 'Consulting Fees', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '6500', subType: 'PROFESSIONAL' },

        // OTHER EXPENSES (7xxx)
        { code: '7000', name: 'Other Expenses', type: 'EXPENSE', normal: 'DEBIT', level: 0, isHeader: true },
        { code: '7100', name: 'Finance Costs', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '7000', isHeader: true },
        { code: '7101', name: 'Bank Charges', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '7100', subType: 'FINANCE' },
        { code: '7102', name: 'Interest Expense', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '7100', subType: 'FINANCE' },
        { code: '7103', name: 'Forex Loss', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '7100', subType: 'FINANCE' },
        { code: '7200', name: 'Depreciation', type: 'EXPENSE', normal: 'DEBIT', level: 1, parent: '7000', isHeader: true },
        { code: '7201', name: 'Depreciation - Equipment', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '7200', subType: 'DEPRECIATION' },
        { code: '7202', name: 'Depreciation - Furniture', type: 'EXPENSE', normal: 'DEBIT', level: 2, parent: '7200', subType: 'DEPRECIATION' },
    ];

    // Create account ID mapping
    const accountIdMap: Record<string, string> = {};

    for (const acc of chartOfAccounts) {
        const id = generateId();
        accountIdMap[acc.code] = id;
        accounts[acc.code] = id;

        const parentId = acc.parent ? accountIdMap[acc.parent] : null;

        await client.query(`
            INSERT INTO public.accounts (
                id, tenant_id, code, name, account_type, sub_type, normal_balance,
                parent_account_id, level, is_header, is_bank_account, is_tax_account,
                is_system_account, allow_branch_posting, status, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, 'ACTIVE', $14, NOW(), NOW())
            ON CONFLICT (tenant_id, code) DO NOTHING
        `, [
            id, TENANT_ID, acc.code, acc.name, acc.type, acc.subType || null, acc.normal,
            parentId, acc.level, acc.isHeader || false, acc.isBank || false, acc.isTax || false,
            !acc.isHeader, // allow_branch_posting only for non-header accounts
            ADMIN_USER_ID
        ]);
    }

    return accounts;
}

// ==================== FISCAL YEAR ====================

async function createFiscalYear(client: any): Promise<string> {
    const fiscalYearId = generateId();

    await client.query(`
        INSERT INTO public.fiscal_years (
            id, tenant_id, year, name, start_date, end_date,
            is_current, is_closed, is_locked, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, false, false, NOW(), NOW())
        ON CONFLICT (tenant_id, year) DO NOTHING
    `, [
        fiscalYearId, TENANT_ID, CURRENT_FY.year,
        `FY ${CURRENT_FY.year - 1}-${CURRENT_FY.year}`,
        CURRENT_FY.startDate, CURRENT_FY.endDate
    ]);

    // Create 12 monthly periods
    const months = ['April', 'May', 'June', 'July', 'August', 'September',
        'October', 'November', 'December', 'January', 'February', 'March'];

    for (let i = 0; i < 12; i++) {
        const periodId = generateId();
        const year = i < 9 ? CURRENT_FY.year - 1 : CURRENT_FY.year;
        const month = (i + 3) % 12; // April = 3, March = 2
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        // Determine status based on current date
        const now = new Date();
        let status = 'OPEN';
        if (endDate < now) {
            const monthsAgo = (now.getFullYear() - endDate.getFullYear()) * 12 + (now.getMonth() - endDate.getMonth());
            status = monthsAgo > 2 ? 'CLOSED' : 'SOFT_CLOSED';
        }

        await client.query(`
            INSERT INTO public.fiscal_periods (
                id, tenant_id, fiscal_year, period_number, period_name, start_date, end_date,
                status, adjustments_allowed, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            ON CONFLICT DO NOTHING
        `, [
            periodId, TENANT_ID, CURRENT_FY.year, i + 1,
            `${months[i]} ${year}`, startDate, endDate, status, status === 'OPEN'
        ]);
    }

    return fiscalYearId;
}

// ==================== TAX CODES ====================

async function createTaxCodes(client: any, accounts: Record<string, string>): Promise<string[]> {
    const taxCodes = [
        { code: 'GST5', name: 'GST 5%', type: 'GST', rate: 5, category: 'STANDARD' },
        { code: 'GST12', name: 'GST 12%', type: 'GST', rate: 12, category: 'STANDARD' },
        { code: 'GST18', name: 'GST 18%', type: 'GST', rate: 18, category: 'STANDARD' },
        { code: 'GST28', name: 'GST 28%', type: 'GST', rate: 28, category: 'LUXURY' },
        { code: 'GST0', name: 'GST 0%', type: 'GST', rate: 0, category: 'ZERO_RATED' },
        { code: 'EXEMPT', name: 'GST Exempt', type: 'GST', rate: 0, category: 'EXEMPT' },
        { code: 'TDS194C1', name: 'TDS 194C - 1%', type: 'TDS', rate: 1, category: 'TDS_194C' },
        { code: 'TDS194C2', name: 'TDS 194C - 2%', type: 'TDS', rate: 2, category: 'TDS_194C' },
        { code: 'TDS194J', name: 'TDS 194J - 10%', type: 'TDS', rate: 10, category: 'TDS_194J' },
        { code: 'TDS194H', name: 'TDS 194H - 5%', type: 'TDS', rate: 5, category: 'TDS_194H' },
    ];

    const ids: string[] = [];

    for (const tax of taxCodes) {
        const id = generateId();
        ids.push(id);

        await client.query(`
            INSERT INTO public.tax_codes (
                id, tenant_id, code, name, tax_type, tax_category, rate,
                calculation_method, input_tax_account_id, output_tax_account_id,
                effective_from, is_active, is_reverse_charge, is_compound, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'EXCLUSIVE', $8, $9, $10, true, false, false, NOW(), NOW())
            ON CONFLICT (tenant_id, code) DO NOTHING
        `, [
            id, TENANT_ID, tax.code, tax.name, tax.type, tax.category, tax.rate,
            accounts['1401'], accounts['2201'], new Date('2017-07-01')
        ]);
    }

    return ids;
}

// ==================== BANK ACCOUNTS ====================

async function createBankAccounts(client: any, accounts: Record<string, string>): Promise<Array<{ id: string; branchId: string; name: string; glAccountId: string }>> {
    const bankDefs = [
        { name: 'HDFC Current', bank: 'HDFC Bank', accNo: '50200012345678', glCode: '1102', opening: 500000, type: 'CURRENT', ifsc: 'HDFC0001234' },
        { name: 'ICICI Current', bank: 'ICICI Bank', accNo: '123456789012', glCode: '1103', opening: 750000, type: 'CURRENT', ifsc: 'ICIC0001234' },
        { name: 'SBI Savings', bank: 'State Bank of India', accNo: '98765432101234', glCode: '1104', opening: 600000, type: 'SAVINGS', ifsc: 'SBIN0001234' },
    ];

    const result: Array<{ id: string; branchId: string; name: string; glAccountId: string }> = [];

    // Create bank accounts for each branch
    for (const branch of BRANCHES) {
        for (const bankDef of bankDefs) {
            const id = generateId();
            const accountName = `${bankDef.name} - ${branch.name}`;
            const glAccountId = accounts[bankDef.glCode];
            const uniqueAccNo = `${bankDef.accNo}${branch.id.slice(-4)}`;
            
            result.push({ id, branchId: branch.id, name: accountName, glAccountId });

            await client.query(`
                INSERT INTO public.bank_accounts (
                    id, tenant_id, branch_id, account_id, bank_name,
                    account_number, account_type, ifsc_code, currency,
                    opening_balance, current_balance, is_active, is_primary, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR', $9, $9, true, $10, NOW(), NOW())
                ON CONFLICT (tenant_id, account_number) DO NOTHING
            `, [
                id, TENANT_ID, branch.id, glAccountId, bankDef.bank,
                uniqueAccNo, bankDef.type, bankDef.ifsc,
                bankDef.opening, bankDef.name.includes('HDFC') // HDFC is primary
            ]);
        }
    }

    return result;
}

// ==================== SAMPLE JOURNAL ENTRIES ====================

async function createSampleJournalEntries(client: any, accounts: Record<string, string>): Promise<number> {
    let entryCount = 0;
    const now = new Date();
    
    // Sample booking-like entries for each branch
    const bookingData = [
        { ref: 'BKG-001', customer: 'Rajesh Kumar', amount: 125000, destination: 'Thailand', daysAgo: 45 },
        { ref: 'BKG-002', customer: 'Priya Menon', amount: 85000, destination: 'Singapore', daysAgo: 40 },
        { ref: 'BKG-003', customer: 'Arun Nair', amount: 250000, destination: 'Europe', daysAgo: 35 },
        { ref: 'BKG-004', customer: 'Lakshmi Devi', amount: 45000, destination: 'Goa', daysAgo: 30 },
        { ref: 'BKG-005', customer: 'Mohammed Ali', amount: 180000, destination: 'Dubai', daysAgo: 25 },
        { ref: 'BKG-006', customer: 'Suresh Reddy', amount: 320000, destination: 'Australia', daysAgo: 20 },
        { ref: 'BKG-007', customer: 'Kavitha Sharma', amount: 95000, destination: 'Bali', daysAgo: 15 },
        { ref: 'BKG-008', customer: 'Venkat Rao', amount: 145000, destination: 'Maldives', daysAgo: 10 },
        { ref: 'BKG-009', customer: 'Deepa Krishnan', amount: 78000, destination: 'Kerala', daysAgo: 5 },
        { ref: 'BKG-010', customer: 'Prakash Hegde', amount: 420000, destination: 'Switzerland', daysAgo: 2 },
    ];

    for (const branch of BRANCHES) {
        // Create revenue journal entries
        for (const booking of bookingData) {
            const entryDate = new Date(now);
            entryDate.setDate(entryDate.getDate() - booking.daysAgo);
            
            const taxRate = 0.18; // 18% GST
            const baseAmount = Math.round(booking.amount / (1 + taxRate));
            const taxAmount = booking.amount - baseAmount;
            const cgst = Math.round(taxAmount / 2);
            const sgst = taxAmount - cgst;

            const journalId = await createJournalEntry(
                client,
                branch.id,
                entryDate,
                'BOOKING',
                `${booking.ref}-${branch.name.slice(0,3).toUpperCase()}`,
                `Revenue: ${booking.customer} - ${booking.destination} Tour`
            );
            
            // Dr Accounts Receivable, Cr Revenue, Cr GST
            await createJournalLines(client, journalId, [
                { accountId: accounts['1201'], debit: booking.amount, credit: 0, desc: 'Accounts Receivable' },
                { accountId: accounts['4101'], debit: 0, credit: baseAmount, desc: 'Tour Revenue' },
                { accountId: accounts['2201'], debit: 0, credit: cgst, desc: 'CGST Output' },
                { accountId: accounts['2202'], debit: 0, credit: sgst, desc: 'SGST Output' },
            ]);

            await createLedgerEntries(client, journalId, branch.id, entryDate, [
                { accountId: accounts['1201'], accountCode: '1201', accountName: 'Accounts Receivable', debit: booking.amount, credit: 0 },
                { accountId: accounts['4101'], accountCode: '4101', accountName: 'Tour Revenue', debit: 0, credit: baseAmount },
                { accountId: accounts['2201'], accountCode: '2201', accountName: 'CGST Output', debit: 0, credit: cgst },
                { accountId: accounts['2202'], accountCode: '2202', accountName: 'SGST Output', debit: 0, credit: sgst },
            ]);

            entryCount++;

            // Create corresponding cost entries (60% of revenue as cost)
            const costAmount = Math.round(baseAmount * 0.6);
            const airlineCost = Math.round(costAmount * 0.4);
            const hotelCost = Math.round(costAmount * 0.35);
            const transportCost = Math.round(costAmount * 0.15);
            // Activity cost is the remainder to ensure balance
            const activityCost = costAmount - airlineCost - hotelCost - transportCost;
            
            const costJournalId = await createJournalEntry(
                client,
                branch.id,
                entryDate,
                'VENDOR_ASSIGNMENT',
                `COST-${booking.ref}-${branch.name.slice(0,3).toUpperCase()}`,
                `Costs: ${booking.customer} - ${booking.destination} Tour`
            );

            await createJournalLines(client, costJournalId, [
                { accountId: accounts['5101'], debit: airlineCost, credit: 0, desc: 'Airline Costs' },
                { accountId: accounts['5102'], debit: hotelCost, credit: 0, desc: 'Hotel Costs' },
                { accountId: accounts['5103'], debit: transportCost, credit: 0, desc: 'Transport Costs' },
                { accountId: accounts['5104'], debit: activityCost, credit: 0, desc: 'Activity Costs' },
                { accountId: accounts['2101'], debit: 0, credit: costAmount, desc: 'Accounts Payable' },
            ]);

            await createLedgerEntries(client, costJournalId, branch.id, entryDate, [
                { accountId: accounts['5101'], accountCode: '5101', accountName: 'Airline Costs', debit: airlineCost, credit: 0 },
                { accountId: accounts['5102'], accountCode: '5102', accountName: 'Hotel Costs', debit: hotelCost, credit: 0 },
                { accountId: accounts['5103'], accountCode: '5103', accountName: 'Transport Costs', debit: transportCost, credit: 0 },
                { accountId: accounts['5104'], accountCode: '5104', accountName: 'Activity Costs', debit: activityCost, credit: 0 },
                { accountId: accounts['2101'], accountCode: '2101', accountName: 'Accounts Payable', debit: 0, credit: costAmount },
            ]);

            entryCount++;
        }

        // Create expense entries
        const expenseData = [
            { category: 'Rent', account: '6201', amount: 50000 + Math.floor(Math.random() * 30000) },
            { category: 'Electricity', account: '6202', amount: 8000 + Math.floor(Math.random() * 5000) },
            { category: 'Internet', account: '6204', amount: 3000 + Math.floor(Math.random() * 2000) },
            { category: 'Office Supplies', account: '6203', amount: 5000 + Math.floor(Math.random() * 3000) },
            { category: 'Digital Marketing', account: '6302', amount: 30000 + Math.floor(Math.random() * 20000) },
        ];

        for (const expense of expenseData) {
            const expenseDate = new Date(now);
            expenseDate.setDate(expenseDate.getDate() - Math.floor(Math.random() * 30));

            const expenseJournalId = await createJournalEntry(
                client,
                branch.id,
                expenseDate,
                'EXPENSE',
                `EXP-${expense.category.slice(0,3).toUpperCase()}-${branch.name.slice(0,3).toUpperCase()}`,
                `${expense.category} Expense - ${branch.name}`
            );

            await createJournalLines(client, expenseJournalId, [
                { accountId: accounts[expense.account], debit: expense.amount, credit: 0, desc: expense.category },
                { accountId: accounts['1102'], debit: 0, credit: expense.amount, desc: 'Bank Payment' },
            ]);

            await createLedgerEntries(client, expenseJournalId, branch.id, expenseDate, [
                { accountId: accounts[expense.account], accountCode: expense.account, accountName: expense.category, debit: expense.amount, credit: 0 },
                { accountId: accounts['1102'], accountCode: '1102', accountName: 'Bank', debit: 0, credit: expense.amount },
            ]);

            entryCount++;
        }
    }

    return entryCount;
}

async function createJournalEntry(
    client: any,
    branchId: string,
    entryDate: Date,
    sourceModule: string,
    entryNumber: string,
    description: string
): Promise<string> {
    const journalId = generateId();
    const fiscalPeriod = entryDate.getMonth() >= 3 ? entryDate.getMonth() - 2 : entryDate.getMonth() + 10;

    await client.query(`
        INSERT INTO public.journal_entries (
            id, tenant_id, branch_id, entry_number, entry_date, posting_date,
            entry_type, status, description, source_module, source_record_type,
            total_debit, total_credit, currency, exchange_rate,
            fiscal_year, fiscal_period, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $5, 'STANDARD', 'POSTED', $6, $7, $8, 0, 0, 'INR', 1, $9, $10, $11, NOW(), NOW())
    `, [
        journalId, TENANT_ID, branchId, entryNumber, entryDate, description,
        sourceModule, sourceModule, CURRENT_FY.year, fiscalPeriod, ADMIN_USER_ID
    ]);

    return journalId;
}

async function createJournalLines(
    client: any,
    journalId: string,
    lines: Array<{ accountId: string; debit: number; credit: number; desc: string }>
): Promise<void> {
    let totalDebit = 0;
    let totalCredit = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        totalDebit += line.debit;
        totalCredit += line.credit;

        await client.query(`
            INSERT INTO public.journal_lines (
                id, journal_entry_id, account_id, debit_amount, credit_amount,
                description, line_number, currency, exchange_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'INR', 1)
        `, [generateId(), journalId, line.accountId, line.debit, line.credit, line.desc, i + 1]);
    }

    // Update totals on journal entry
    await client.query(`
        UPDATE public.journal_entries SET total_debit = $1, total_credit = $2 WHERE id = $3
    `, [totalDebit, totalCredit, journalId]);
}

async function createLedgerEntries(
    client: any,
    journalId: string,
    branchId: string,
    entryDate: Date,
    entries: Array<{ accountId: string; accountCode: string; accountName: string; debit: number; credit: number }>
): Promise<void> {
    const fiscalPeriod = entryDate.getMonth() >= 3 ? entryDate.getMonth() - 2 : entryDate.getMonth() + 10;
    
    // Get the entry number from journal
    const journalResult = await client.query(`SELECT entry_number, description FROM public.journal_entries WHERE id = $1`, [journalId]);
    const entryNumber = journalResult.rows[0]?.entry_number || 'UNKNOWN';
    const description = journalResult.rows[0]?.description || '';

    // Get journal line IDs
    const linesResult = await client.query(`SELECT id, account_id FROM public.journal_lines WHERE journal_entry_id = $1 ORDER BY line_number`, [journalId]);
    const lineMap = new Map<string, string>();
    for (const line of linesResult.rows) {
        lineMap.set(line.account_id, line.id);
    }

    let runningBalance = 0;
    for (const entry of entries) {
        if (entry.debit === 0 && entry.credit === 0) continue;
        
        runningBalance += entry.debit - entry.credit;
        const lineId = lineMap.get(entry.accountId) || generateId();

        await client.query(`
            INSERT INTO public.ledger_entries (
                id, tenant_id, branch_id, account_id, account_code, account_name,
                journal_entry_id, journal_line_id, entry_number, entry_date, posting_date,
                description, debit_amount, credit_amount, running_balance,
                currency, exchange_rate, base_currency_debit, base_currency_credit,
                source_module, fiscal_year, fiscal_period, entry_type, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, 'INR', 1, $12, $13, 'ACCOUNTING', $15, $16, 'POSTED', $17, NOW())
        `, [
            generateId(), TENANT_ID, branchId, entry.accountId, entry.accountCode, entry.accountName,
            journalId, lineId, entryNumber, entryDate, description,
            entry.debit, entry.credit, runningBalance, CURRENT_FY.year, fiscalPeriod, ADMIN_USER_ID
        ]);
    }
}

// ==================== BANK TRANSACTIONS ====================

async function createBankTransactions(
    client: any,
    bankAccounts: Array<{ id: string; branchId: string; name: string; glAccountId: string }>
): Promise<number> {
    let count = 0;
    const now = new Date();

    for (const bankAccount of bankAccounts) {
        // Add bank charges and interest transactions
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
            const txnDate = new Date(now);
            txnDate.setMonth(txnDate.getMonth() - monthOffset);
            txnDate.setDate(1);

            const chargeAmount = 500 + Math.floor(Math.random() * 200);
            
            // Bank charges (debit from account = credit_amount in bank_transactions represents money going out)
            await client.query(`
                INSERT INTO public.bank_transactions (
                    id, tenant_id, bank_account_id, transaction_date, value_date,
                    description, reference, debit_amount, credit_amount,
                    is_reconciled, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $4, $5, $6, $7, 0, true, NOW(), NOW())
            `, [
                generateId(), TENANT_ID, bankAccount.id, txnDate,
                'Monthly Bank Charges', `CHG-${monthOffset + 1}`, chargeAmount
            ]);
            count++;

            // Interest credit (credit to account = credit_amount in bank_transactions)
            if (Math.random() > 0.5) {
                const interestDate = new Date(txnDate);
                interestDate.setDate(15);
                const interestAmount = 200 + Math.floor(Math.random() * 300);
                
                await client.query(`
                    INSERT INTO public.bank_transactions (
                        id, tenant_id, bank_account_id, transaction_date, value_date,
                        description, reference, debit_amount, credit_amount,
                        is_reconciled, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $4, $5, $6, 0, $7, true, NOW(), NOW())
                `, [
                    generateId(), TENANT_ID, bankAccount.id, interestDate,
                    'Interest Credit', `INT-${monthOffset + 1}`, interestAmount
                ]);
                count++;
            }
        }
    }

    return count;
}

// ==================== SUMMARY ====================

async function printSummary(): Promise<void> {
    console.log('\n📊 ACCOUNTING DATA SUMMARY');
    console.log('═'.repeat(50));

    try {
        // Account counts
        const accountResult = await query(`
            SELECT account_type, COUNT(*) as count
            FROM public.accounts WHERE tenant_id = $1
            GROUP BY account_type ORDER BY account_type
        `, [TENANT_ID]);
        console.log('\nChart of Accounts:');
        for (const row of accountResult.rows) {
            console.log(`  ${row.account_type}: ${row.count} accounts`);
        }

        // Journal entry counts
        const journalResult = await query(`
            SELECT source_module, COUNT(*) as count, COALESCE(SUM(total_debit), 0) as total_amount
            FROM public.journal_entries WHERE tenant_id = $1
            GROUP BY source_module ORDER BY source_module
        `, [TENANT_ID]);
        console.log('\nJournal Entries:');
        for (const row of journalResult.rows) {
            console.log(`  ${row.source_module}: ${row.count} entries (₹${Number(row.total_amount || 0).toLocaleString('en-IN')})`);
        }

        // Branch-wise revenue
        const revenueResult = await query(`
            SELECT b.name as branch_name, COALESCE(SUM(le.credit_amount), 0) as revenue
            FROM public.ledger_entries le
            JOIN public.branches b ON le.branch_id = b.id
            JOIN public.accounts a ON le.account_id = a.id
            WHERE le.tenant_id = $1 AND a.account_type = 'REVENUE'
            GROUP BY b.name ORDER BY revenue DESC
        `, [TENANT_ID]);
        console.log('\nRevenue by Branch:');
        for (const row of revenueResult.rows) {
            console.log(`  ${row.branch_name}: ₹${Number(row.revenue || 0).toLocaleString('en-IN')}`);
        }

        // Trial balance check
        const tbResult = await query(`
            SELECT 
                COALESCE(SUM(debit_amount), 0) as total_debits,
                COALESCE(SUM(credit_amount), 0) as total_credits
            FROM public.ledger_entries WHERE tenant_id = $1
        `, [TENANT_ID]);
        const debits = Number(tbResult.rows[0]?.total_debits || 0);
        const credits = Number(tbResult.rows[0]?.total_credits || 0);
        const diff = Math.abs(debits - credits);
        console.log('\nTrial Balance:');
        console.log(`  Total Debits:  ₹${debits.toLocaleString('en-IN')}`);
        console.log(`  Total Credits: ₹${credits.toLocaleString('en-IN')}`);
        console.log(`  Difference:    ₹${diff.toLocaleString('en-IN')} ${diff < 1 ? '✓ BALANCED' : '⚠ UNBALANCED'}`);
    } catch (error) {
        console.log('\n⚠ Could not print summary - some tables may not exist');
    }

    console.log('\n' + '═'.repeat(50));
}

// Run the seed
seedAccountingData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
