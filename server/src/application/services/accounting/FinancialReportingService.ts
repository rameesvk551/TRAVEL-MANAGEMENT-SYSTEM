import { query } from '../../../infrastructure/database/connection.js';
import { AccountType, NormalBalance } from '../../../domain/entities/accounting/Account.js';

/**
 * Financial Statement Line Item
 */
export interface StatementLineItem {
    accountId: string;
    accountCode: string;
    accountName: string;
    level: number;
    isHeader: boolean;
    balance: number;
    previousBalance?: number;
    changeAmount?: number;
    changePercentage?: number;
    children?: StatementLineItem[];
}

/**
 * Profit & Loss Statement
 */
export interface ProfitAndLossStatement {
    tenantId: string;
    branchId?: string;
    branchName?: string;
    tripId?: string;
    periodStart: Date;
    periodEnd: Date;
    generatedAt: Date;
    
    // Revenue Section
    revenue: {
        items: StatementLineItem[];
        total: number;
    };
    
    // Cost of Sales Section
    costOfSales: {
        items: StatementLineItem[];
        total: number;
    };
    
    grossProfit: number;
    grossMargin: number;
    
    // Operating Expenses Section
    operatingExpenses: {
        items: StatementLineItem[];
        total: number;
    };
    
    operatingProfit: number;
    operatingMargin: number;
    
    // Other Income/Expenses
    otherIncome: {
        items: StatementLineItem[];
        total: number;
    };
    
    otherExpenses: {
        items: StatementLineItem[];
        total: number;
    };
    
    netProfit: number;
    netMargin: number;
    
    // Comparison data
    comparison?: {
        previousPeriodStart: Date;
        previousPeriodEnd: Date;
        previousNetProfit: number;
        changeAmount: number;
        changePercentage: number;
    };
}

/**
 * Balance Sheet Statement
 */
export interface BalanceSheetStatement {
    tenantId: string;
    branchId?: string;
    branchName?: string;
    asOfDate: Date;
    generatedAt: Date;
    
    // Assets
    assets: {
        current: {
            items: StatementLineItem[];
            total: number;
        };
        nonCurrent: {
            items: StatementLineItem[];
            total: number;
        };
        total: number;
    };
    
    // Liabilities
    liabilities: {
        current: {
            items: StatementLineItem[];
            total: number;
        };
        nonCurrent: {
            items: StatementLineItem[];
            total: number;
        };
        total: number;
    };
    
    // Equity
    equity: {
        items: StatementLineItem[];
        retainedEarnings: number;
        currentYearProfit: number;
        total: number;
    };
    
    // Validation
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    variance: number;
}

/**
 * Cash Flow Statement
 */
export interface CashFlowStatement {
    tenantId: string;
    branchId?: string;
    periodStart: Date;
    periodEnd: Date;
    generatedAt: Date;
    
    // Operating Activities
    operatingActivities: {
        netIncome: number;
        adjustments: StatementLineItem[];
        changesInWorkingCapital: StatementLineItem[];
        netCashFromOperations: number;
    };
    
    // Investing Activities
    investingActivities: {
        items: StatementLineItem[];
        netCashFromInvesting: number;
    };
    
    // Financing Activities
    financingActivities: {
        items: StatementLineItem[];
        netCashFromFinancing: number;
    };
    
    // Summary
    netCashChange: number;
    openingCashBalance: number;
    closingCashBalance: number;
}

/**
 * Trip Profitability Report
 */
export interface TripProfitabilityReport {
    tripId: string;
    tripReference: string;
    bookingId: string;
    branchId: string;
    branchName: string;
    customerName: string;
    tripDates: { start: Date; end: Date };
    
    // Revenue
    revenue: {
        packagePrice: number;
        additionalServices: number;
        taxes: number;
        totalRevenue: number;
    };
    
    // Direct Costs
    directCosts: {
        vendorCosts: Array<{
            vendorId: string;
            vendorName: string;
            service: string;
            amount: number;
        }>;
        totalVendorCosts: number;
    };
    
    // Margins
    grossProfit: number;
    grossMargin: number;
    
    // Allocated Overheads (if applicable)
    allocatedOverheads?: number;
    
    netProfit: number;
    netMargin: number;
}

/**
 * Financial Reporting Service
 * 
 * Generates:
 * - Profit & Loss Statement (Company/Branch/Trip level)
 * - Balance Sheet (Company/Branch level)
 * - Cash Flow Statement
 * - Trip Profitability Reports
 * - KPI Dashboards
 */
export class FinancialReportingService {

    // ==================== PROFIT & LOSS ====================

    /**
     * Generate Profit & Loss Statement
     */
    async generateProfitAndLoss(
        tenantId: string,
        startDate: Date,
        endDate: Date,
        options: {
            branchId?: string;
            tripId?: string;
            includeComparison?: boolean;
            consolidate?: boolean;
        } = {}
    ): Promise<ProfitAndLossStatement> {
        const { branchId, tripId, includeComparison, consolidate } = options;

        // Build base query conditions
        let conditions = 'le.tenant_id = $1 AND le.entry_date >= $2 AND le.entry_date <= $3';
        const params: any[] = [tenantId, startDate, endDate];
        let paramIndex = 4;

        if (branchId && !consolidate) {
            conditions += ` AND le.branch_id = $${paramIndex}`;
            params.push(branchId);
            paramIndex++;
        }

        if (tripId) {
            conditions += ` AND le.cost_center_id = $${paramIndex}`;
            params.push(tripId);
        }

        // Get all account balances
        const balanceQuery = `
            SELECT 
                a.id as account_id,
                a.account_code,
                a.name as account_name,
                a.account_type,
                a.parent_id,
                a.level,
                a.metadata->>'category' as category,
                COALESCE(SUM(le.debit_amount), 0) as total_debit,
                COALESCE(SUM(le.credit_amount), 0) as total_credit
            FROM public.accounts a
            LEFT JOIN public.ledger_entries le ON le.account_id = a.id
                AND ${conditions.replace('le.tenant_id', 'le.tenant_id')}
            WHERE a.tenant_id = $1 AND a.account_type IN ('INCOME', 'EXPENSE')
            GROUP BY a.id, a.account_code, a.name, a.account_type, a.parent_id, a.level, a.metadata
            ORDER BY a.account_code
        `;

        const balanceResult = await query(balanceQuery, params);

        // Categorize accounts
        const revenueItems: StatementLineItem[] = [];
        const costOfSalesItems: StatementLineItem[] = [];
        const operatingExpenseItems: StatementLineItem[] = [];
        const otherIncomeItems: StatementLineItem[] = [];
        const otherExpenseItems: StatementLineItem[] = [];

        for (const row of balanceResult.rows) {
            const balance = row.account_type === 'INCOME'
                ? parseFloat(row.total_credit) - parseFloat(row.total_debit)
                : parseFloat(row.total_debit) - parseFloat(row.total_credit);

            if (Math.abs(balance) < 0.01) continue;

            const item: StatementLineItem = {
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                level: row.level,
                isHeader: false,
                balance: Math.round(balance * 100) / 100,
            };

            const code = row.account_code;
            
            if (row.account_type === 'INCOME') {
                if (code.startsWith('4100') || code.startsWith('4200') || code.startsWith('4300')) {
                    revenueItems.push(item);
                } else {
                    otherIncomeItems.push(item);
                }
            } else {
                if (code.startsWith('5100')) {
                    costOfSalesItems.push(item);
                } else if (code.startsWith('6') || code.startsWith('7')) {
                    operatingExpenseItems.push(item);
                } else {
                    otherExpenseItems.push(item);
                }
            }
        }

        const totalRevenue = revenueItems.reduce((sum, item) => sum + item.balance, 0);
        const totalCostOfSales = costOfSalesItems.reduce((sum, item) => sum + item.balance, 0);
        const grossProfit = totalRevenue - totalCostOfSales;
        const totalOperatingExpenses = operatingExpenseItems.reduce((sum, item) => sum + item.balance, 0);
        const operatingProfit = grossProfit - totalOperatingExpenses;
        const totalOtherIncome = otherIncomeItems.reduce((sum, item) => sum + item.balance, 0);
        const totalOtherExpenses = otherExpenseItems.reduce((sum, item) => sum + item.balance, 0);
        const netProfit = operatingProfit + totalOtherIncome - totalOtherExpenses;

        // Get branch name if applicable
        let branchName: string | undefined;
        if (branchId) {
            const branchResult = await query('SELECT name FROM public.branches WHERE id = $1', [branchId]);
            branchName = branchResult.rows[0]?.name;
        }

        const statement: ProfitAndLossStatement = {
            tenantId,
            branchId,
            branchName,
            tripId,
            periodStart: startDate,
            periodEnd: endDate,
            generatedAt: new Date(),
            
            revenue: {
                items: revenueItems,
                total: totalRevenue,
            },
            costOfSales: {
                items: costOfSalesItems,
                total: totalCostOfSales,
            },
            grossProfit,
            grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
            
            operatingExpenses: {
                items: operatingExpenseItems,
                total: totalOperatingExpenses,
            },
            operatingProfit,
            operatingMargin: totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0,
            
            otherIncome: {
                items: otherIncomeItems,
                total: totalOtherIncome,
            },
            otherExpenses: {
                items: otherExpenseItems,
                total: totalOtherExpenses,
            },
            
            netProfit,
            netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        };

        // Add comparison if requested
        if (includeComparison) {
            const periodLength = endDate.getTime() - startDate.getTime();
            const previousEnd = new Date(startDate.getTime() - 1);
            const previousStart = new Date(previousEnd.getTime() - periodLength);

            const previousPnL = await this.generateProfitAndLoss(tenantId, previousStart, previousEnd, {
                branchId,
                tripId,
                includeComparison: false,
            });

            statement.comparison = {
                previousPeriodStart: previousStart,
                previousPeriodEnd: previousEnd,
                previousNetProfit: previousPnL.netProfit,
                changeAmount: netProfit - previousPnL.netProfit,
                changePercentage: previousPnL.netProfit !== 0
                    ? ((netProfit - previousPnL.netProfit) / Math.abs(previousPnL.netProfit)) * 100
                    : 0,
            };
        }

        return statement;
    }

    // ==================== BALANCE SHEET ====================

    /**
     * Generate Balance Sheet Statement
     */
    async generateBalanceSheet(
        tenantId: string,
        asOfDate: Date,
        options: {
            branchId?: string;
            consolidate?: boolean;
        } = {}
    ): Promise<BalanceSheetStatement> {
        const { branchId, consolidate } = options;

        let conditions = 'le.tenant_id = $1 AND le.entry_date <= $2';
        const params: any[] = [tenantId, asOfDate];

        if (branchId && !consolidate) {
            params.push(branchId);
            conditions += ` AND le.branch_id = $3`;
        }

        // Get all account balances
        const balanceQuery = `
            SELECT 
                a.id as account_id,
                a.account_code,
                a.name as account_name,
                a.account_type,
                a.normal_balance,
                a.parent_id,
                a.level,
                a.metadata->>'category' as category,
                COALESCE(SUM(le.debit_amount), 0) as total_debit,
                COALESCE(SUM(le.credit_amount), 0) as total_credit
            FROM public.accounts a
            LEFT JOIN public.ledger_entries le ON le.account_id = a.id
                AND ${conditions}
            WHERE a.tenant_id = $1 AND a.account_type IN ('ASSET', 'LIABILITY', 'EQUITY')
            GROUP BY a.id, a.account_code, a.name, a.account_type, a.normal_balance, a.parent_id, a.level, a.metadata
            ORDER BY a.account_code
        `;

        const balanceResult = await query(balanceQuery, params);

        // Categorize accounts
        const currentAssets: StatementLineItem[] = [];
        const nonCurrentAssets: StatementLineItem[] = [];
        const currentLiabilities: StatementLineItem[] = [];
        const nonCurrentLiabilities: StatementLineItem[] = [];
        const equityItems: StatementLineItem[] = [];

        for (const row of balanceResult.rows) {
            const balance = row.normal_balance === 'DEBIT'
                ? parseFloat(row.total_debit) - parseFloat(row.total_credit)
                : parseFloat(row.total_credit) - parseFloat(row.total_debit);

            if (Math.abs(balance) < 0.01) continue;

            const item: StatementLineItem = {
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                level: row.level,
                isHeader: false,
                balance: Math.round(balance * 100) / 100,
            };

            const code = row.account_code;

            switch (row.account_type) {
                case 'ASSET':
                    // Current assets: Cash, Receivables, Prepaid (1100-1300)
                    if (code.startsWith('11') || code.startsWith('12') || code.startsWith('13')) {
                        currentAssets.push(item);
                    } else {
                        nonCurrentAssets.push(item);
                    }
                    break;
                case 'LIABILITY':
                    // Current liabilities: Payables, Short-term (2100-2300)
                    if (code.startsWith('21') || code.startsWith('22') || code.startsWith('23')) {
                        currentLiabilities.push(item);
                    } else {
                        nonCurrentLiabilities.push(item);
                    }
                    break;
                case 'EQUITY':
                    equityItems.push(item);
                    break;
            }
        }

        // Calculate current year profit for equity section
        const currentYearProfit = await this.calculateCurrentYearProfit(tenantId, asOfDate, branchId);

        const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.balance, 0);
        const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, item) => sum + item.balance, 0);
        const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

        const totalCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.balance, 0);
        const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, item) => sum + item.balance, 0);
        const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

        const totalEquityFromAccounts = equityItems.reduce((sum, item) => sum + item.balance, 0);
        const totalEquity = totalEquityFromAccounts + currentYearProfit;

        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
        const variance = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

        // Get branch name if applicable
        let branchName: string | undefined;
        if (branchId) {
            const branchResult = await query('SELECT name FROM public.branches WHERE id = $1', [branchId]);
            branchName = branchResult.rows[0]?.name;
        }

        return {
            tenantId,
            branchId,
            branchName,
            asOfDate,
            generatedAt: new Date(),
            
            assets: {
                current: {
                    items: currentAssets,
                    total: totalCurrentAssets,
                },
                nonCurrent: {
                    items: nonCurrentAssets,
                    total: totalNonCurrentAssets,
                },
                total: totalAssets,
            },
            
            liabilities: {
                current: {
                    items: currentLiabilities,
                    total: totalCurrentLiabilities,
                },
                nonCurrent: {
                    items: nonCurrentLiabilities,
                    total: totalNonCurrentLiabilities,
                },
                total: totalLiabilities,
            },
            
            equity: {
                items: equityItems,
                retainedEarnings: 0, // Would be calculated from retained earnings account
                currentYearProfit,
                total: totalEquity,
            },
            
            totalLiabilitiesAndEquity,
            isBalanced: Math.abs(variance) < 0.01,
            variance,
        };
    }

    // ==================== CASH FLOW ====================

    /**
     * Generate Cash Flow Statement (Indirect Method)
     */
    async generateCashFlow(
        tenantId: string,
        startDate: Date,
        endDate: Date,
        options: {
            branchId?: string;
        } = {}
    ): Promise<CashFlowStatement> {
        const { branchId } = options;

        // Get net income for the period
        const pnl = await this.generateProfitAndLoss(tenantId, startDate, endDate, { branchId });
        const netIncome = pnl.netProfit;

        // Get changes in working capital accounts
        const workingCapitalQuery = `
            WITH period_balances AS (
                SELECT 
                    a.id as account_id,
                    a.account_code,
                    a.name as account_name,
                    a.account_type,
                    a.normal_balance,
                    COALESCE(SUM(CASE WHEN le.entry_date < $2 THEN le.debit_amount - le.credit_amount ELSE 0 END), 0) as opening_balance,
                    COALESCE(SUM(CASE WHEN le.entry_date <= $3 THEN le.debit_amount - le.credit_amount ELSE 0 END), 0) as closing_balance
                FROM public.accounts a
                LEFT JOIN public.ledger_entries le ON le.account_id = a.id AND le.tenant_id = $1
                    ${branchId ? 'AND le.branch_id = $4' : ''}
                WHERE a.tenant_id = $1 
                AND a.account_code SIMILAR TO '(12|13|21|22)%'
                GROUP BY a.id, a.account_code, a.name, a.account_type, a.normal_balance
            )
            SELECT *,
                closing_balance - opening_balance as change
            FROM period_balances
            WHERE ABS(closing_balance - opening_balance) > 0.01
            ORDER BY account_code
        `;

        const params = branchId 
            ? [tenantId, startDate, endDate, branchId]
            : [tenantId, startDate, endDate];

        const workingCapitalResult = await query(workingCapitalQuery, params);

        const changesInWorkingCapital: StatementLineItem[] = [];
        let workingCapitalChange = 0;

        for (const row of workingCapitalResult.rows) {
            let change = parseFloat(row.change);
            
            // Adjust sign: increase in current assets = cash outflow, increase in current liabilities = cash inflow
            if (row.account_type === 'ASSET') {
                change = -change;
            }

            changesInWorkingCapital.push({
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                level: 0,
                isHeader: false,
                balance: Math.round(change * 100) / 100,
            });

            workingCapitalChange += change;
        }

        const netCashFromOperations = netIncome + workingCapitalChange;

        // Get cash account balances
        const cashQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN le.entry_date < $2 THEN le.debit_amount - le.credit_amount ELSE 0 END), 0) as opening_cash,
                COALESCE(SUM(CASE WHEN le.entry_date <= $3 THEN le.debit_amount - le.credit_amount ELSE 0 END), 0) as closing_cash
            FROM public.accounts a
            JOIN public.ledger_entries le ON le.account_id = a.id
            WHERE a.tenant_id = $1 AND a.account_code LIKE '11%'
            ${branchId ? 'AND le.branch_id = $4' : ''}
        `;

        const cashResult = await query(cashQuery, params);
        const openingCashBalance = parseFloat(cashResult.rows[0]?.opening_cash || 0);
        const closingCashBalance = parseFloat(cashResult.rows[0]?.closing_cash || 0);

        // Calculate investing and financing as the remainder
        const netCashChange = closingCashBalance - openingCashBalance;
        const otherCashFlows = netCashChange - netCashFromOperations;

        return {
            tenantId,
            branchId,
            periodStart: startDate,
            periodEnd: endDate,
            generatedAt: new Date(),
            
            operatingActivities: {
                netIncome,
                adjustments: [], // Depreciation, etc. would go here
                changesInWorkingCapital,
                netCashFromOperations: Math.round(netCashFromOperations * 100) / 100,
            },
            
            investingActivities: {
                items: [],
                netCashFromInvesting: 0, // Would need fixed asset tracking
            },
            
            financingActivities: {
                items: [],
                netCashFromFinancing: Math.round(otherCashFlows * 100) / 100,
            },
            
            netCashChange: Math.round(netCashChange * 100) / 100,
            openingCashBalance: Math.round(openingCashBalance * 100) / 100,
            closingCashBalance: Math.round(closingCashBalance * 100) / 100,
        };
    }

    // ==================== TRIP PROFITABILITY ====================

    /**
     * Generate Trip Profitability Report
     */
    async getTripProfitability(
        tenantId: string,
        tripId: string
    ): Promise<TripProfitabilityReport | null> {
        // Get trip/booking details
        const tripResult = await query(`
            SELECT 
                b.id as booking_id,
                b.booking_reference,
                b.branch_id,
                br.name as branch_name,
                b.customer_name,
                b.travel_start_date,
                b.travel_end_date,
                b.total_amount,
                b.taxes
            FROM public.bookings b
            JOIN public.branches br ON b.branch_id = br.id
            WHERE b.tenant_id = $1 AND b.id = $2
        `, [tenantId, tripId]);

        if (tripResult.rows.length === 0) return null;

        const trip = tripResult.rows[0];

        // Get revenue from ledger
        const revenueResult = await query(`
            SELECT COALESCE(SUM(le.credit_amount - le.debit_amount), 0) as total_revenue
            FROM public.ledger_entries le
            JOIN public.accounts a ON le.account_id = a.id
            WHERE le.tenant_id = $1 
            AND le.cost_center_id = $2
            AND a.account_type = 'INCOME'
        `, [tenantId, tripId]);

        const totalRevenue = parseFloat(revenueResult.rows[0]?.total_revenue || trip.total_amount);

        // Get vendor costs
        const vendorCostsResult = await query(`
            SELECT 
                vp.vendor_id,
                v.name as vendor_name,
                vp.service_type as service,
                COALESCE(SUM(vp.amount), 0) as amount
            FROM public.vendor_payables vp
            JOIN public.vendors v ON vp.vendor_id = v.id
            WHERE vp.tenant_id = $1 AND vp.booking_id = $2
            GROUP BY vp.vendor_id, v.name, vp.service_type
        `, [tenantId, tripId]);

        const vendorCosts = vendorCostsResult.rows.map(row => ({
            vendorId: row.vendor_id,
            vendorName: row.vendor_name,
            service: row.service,
            amount: parseFloat(row.amount),
        }));

        const totalVendorCosts = vendorCosts.reduce((sum, vc) => sum + vc.amount, 0);
        const grossProfit = totalRevenue - totalVendorCosts;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return {
            tripId,
            tripReference: trip.booking_reference,
            bookingId: trip.booking_id,
            branchId: trip.branch_id,
            branchName: trip.branch_name,
            customerName: trip.customer_name,
            tripDates: {
                start: trip.travel_start_date,
                end: trip.travel_end_date,
            },
            revenue: {
                packagePrice: parseFloat(trip.total_amount) - parseFloat(trip.taxes || 0),
                additionalServices: 0,
                taxes: parseFloat(trip.taxes || 0),
                totalRevenue,
            },
            directCosts: {
                vendorCosts,
                totalVendorCosts,
            },
            grossProfit,
            grossMargin: Math.round(grossMargin * 100) / 100,
            netProfit: grossProfit, // Same as gross for trip-level
            netMargin: Math.round(grossMargin * 100) / 100,
        };
    }

    /**
     * Get all trip profitability for a period
     */
    async getTripProfitabilityReport(
        tenantId: string,
        startDate: Date,
        endDate: Date,
        branchId?: string
    ): Promise<{
        trips: TripProfitabilityReport[];
        summary: {
            totalTrips: number;
            totalRevenue: number;
            totalCosts: number;
            totalProfit: number;
            averageMargin: number;
            profitableTrips: number;
            unprofitableTrips: number;
        };
    }> {
        let conditions = 'b.tenant_id = $1 AND b.travel_start_date >= $2 AND b.travel_start_date <= $3';
        const params: any[] = [tenantId, startDate, endDate];

        if (branchId) {
            params.push(branchId);
            conditions += ` AND b.branch_id = $4`;
        }

        const bookingsResult = await query(`
            SELECT b.id FROM public.bookings b
            WHERE ${conditions}
            ORDER BY b.travel_start_date
        `, params);

        const trips: TripProfitabilityReport[] = [];
        let totalRevenue = 0;
        let totalCosts = 0;
        let profitableTrips = 0;

        for (const row of bookingsResult.rows) {
            const tripReport = await this.getTripProfitability(tenantId, row.id);
            if (tripReport) {
                trips.push(tripReport);
                totalRevenue += tripReport.revenue.totalRevenue;
                totalCosts += tripReport.directCosts.totalVendorCosts;
                if (tripReport.grossProfit > 0) profitableTrips++;
            }
        }

        const totalProfit = totalRevenue - totalCosts;
        const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
            trips,
            summary: {
                totalTrips: trips.length,
                totalRevenue,
                totalCosts,
                totalProfit,
                averageMargin: Math.round(averageMargin * 100) / 100,
                profitableTrips,
                unprofitableTrips: trips.length - profitableTrips,
            },
        };
    }

    // ==================== BRANCH COMPARISON ====================

    /**
     * Get branch comparison report
     */
    async getBranchComparison(
        tenantId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        branches: Array<{
            branchId: string;
            branchName: string;
            revenue: number;
            expenses: number;
            netProfit: number;
            margin: number;
            bookingCount: number;
        }>;
        companyTotal: {
            revenue: number;
            expenses: number;
            netProfit: number;
            margin: number;
        };
    }> {
        // Get all branches
        const branchesResult = await query(`
            SELECT id, name FROM public.branches
            WHERE tenant_id = $1 AND is_active = true
            ORDER BY name
        `, [tenantId]);

        const branches: Array<{
            branchId: string;
            branchName: string;
            revenue: number;
            expenses: number;
            netProfit: number;
            margin: number;
            bookingCount: number;
        }> = [];

        let companyRevenue = 0;
        let companyExpenses = 0;

        for (const branch of branchesResult.rows) {
            const pnl = await this.generateProfitAndLoss(tenantId, startDate, endDate, {
                branchId: branch.id,
            });

            // Get booking count
            const bookingCountResult = await query(`
                SELECT COUNT(*) as count FROM public.bookings
                WHERE tenant_id = $1 AND branch_id = $2
                AND created_at >= $3 AND created_at <= $4
            `, [tenantId, branch.id, startDate, endDate]);

            const revenue = pnl.revenue.total;
            const expenses = pnl.costOfSales.total + pnl.operatingExpenses.total;

            branches.push({
                branchId: branch.id,
                branchName: branch.name,
                revenue,
                expenses,
                netProfit: pnl.netProfit,
                margin: pnl.netMargin,
                bookingCount: parseInt(bookingCountResult.rows[0].count),
            });

            companyRevenue += revenue;
            companyExpenses += expenses;
        }

        const companyNetProfit = companyRevenue - companyExpenses;

        return {
            branches,
            companyTotal: {
                revenue: companyRevenue,
                expenses: companyExpenses,
                netProfit: companyNetProfit,
                margin: companyRevenue > 0 ? (companyNetProfit / companyRevenue) * 100 : 0,
            },
        };
    }

    // ==================== HELPERS ====================

    private async calculateCurrentYearProfit(
        tenantId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<number> {
        // Get current fiscal year
        const fyResult = await query(`
            SELECT start_date FROM public.fiscal_years
            WHERE tenant_id = $1 AND start_date <= $2 AND end_date >= $2
        `, [tenantId, asOfDate]);

        if (fyResult.rows.length === 0) {
            // Default to calendar year
            const yearStart = new Date(asOfDate.getFullYear(), 0, 1);
            const pnl = await this.generateProfitAndLoss(tenantId, yearStart, asOfDate, { branchId });
            return pnl.netProfit;
        }

        const pnl = await this.generateProfitAndLoss(
            tenantId,
            fyResult.rows[0].start_date,
            asOfDate,
            { branchId }
        );

        return pnl.netProfit;
    }
}
