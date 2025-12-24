import { FiscalPeriod, FiscalYear } from '../../entities/accounting/FiscalPeriod.js';

/**
 * Fiscal Period Repository Interface
 */
export interface IFiscalPeriodRepository {
    /**
     * Create a fiscal year with periods
     */
    createFiscalYear(
        fiscalYear: FiscalYear, 
        periods: FiscalPeriod[]
    ): Promise<{ fiscalYear: FiscalYear; periods: FiscalPeriod[] }>;

    /**
     * Find fiscal year by ID
     */
    findFiscalYearById(tenantId: string, id: string): Promise<FiscalYear | null>;

    /**
     * Find fiscal year by year number
     */
    findFiscalYearByYear(tenantId: string, year: number): Promise<FiscalYear | null>;

    /**
     * Get current fiscal year
     */
    getCurrentFiscalYear(tenantId: string): Promise<FiscalYear | null>;

    /**
     * Get all fiscal years
     */
    getFiscalYears(tenantId: string): Promise<FiscalYear[]>;

    /**
     * Find fiscal period by ID
     */
    findPeriodById(tenantId: string, id: string): Promise<FiscalPeriod | null>;

    /**
     * Find fiscal period by date
     */
    findPeriodByDate(
        tenantId: string, 
        date: Date, 
        branchId?: string
    ): Promise<FiscalPeriod | null>;

    /**
     * Get periods for a fiscal year
     */
    getPeriodsForYear(
        tenantId: string, 
        fiscalYear: number,
        branchId?: string
    ): Promise<FiscalPeriod[]>;

    /**
     * Update period status
     */
    updatePeriodStatus(period: FiscalPeriod): Promise<FiscalPeriod>;

    /**
     * Soft close a period (branch level)
     */
    softClosePeriod(
        tenantId: string,
        periodId: string,
        userId: string
    ): Promise<FiscalPeriod>;

    /**
     * Close a period
     */
    closePeriod(
        tenantId: string,
        periodId: string,
        userId: string
    ): Promise<FiscalPeriod>;

    /**
     * Lock a period (permanent)
     */
    lockPeriod(
        tenantId: string,
        periodId: string,
        userId: string
    ): Promise<FiscalPeriod>;

    /**
     * Reopen a soft-closed period
     */
    reopenPeriod(
        tenantId: string,
        periodId: string
    ): Promise<FiscalPeriod>;

    /**
     * Check if posting is allowed for a date
     */
    isPostingAllowed(
        tenantId: string,
        date: Date,
        branchId?: string
    ): Promise<boolean>;

    /**
     * Get open periods
     */
    getOpenPeriods(tenantId: string, branchId?: string): Promise<FiscalPeriod[]>;

    /**
     * Close fiscal year (year-end close)
     */
    closeFiscalYear(
        tenantId: string,
        fiscalYearId: string,
        userId: string
    ): Promise<FiscalYear>;
}
