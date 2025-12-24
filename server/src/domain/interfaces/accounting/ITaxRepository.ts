import { TaxCode, TaxRegistration, TaxTransaction } from '../../entities/accounting/TaxConfig.js';

/**
 * Tax Repository Interface
 */
export interface ITaxRepository {
    // ==================== Tax Codes ====================
    
    /**
     * Create a tax code
     */
    createTaxCode(taxCode: TaxCode): Promise<TaxCode>;

    /**
     * Update a tax code
     */
    updateTaxCode(taxCode: TaxCode): Promise<TaxCode>;

    /**
     * Find tax code by ID
     */
    findTaxCodeById(tenantId: string, id: string): Promise<TaxCode | null>;

    /**
     * Find tax code by code
     */
    findTaxCodeByCode(tenantId: string, code: string): Promise<TaxCode | null>;

    /**
     * Get all active tax codes
     */
    getActiveTaxCodes(tenantId: string, taxType?: string): Promise<TaxCode[]>;

    /**
     * Get tax codes valid for a date
     */
    getTaxCodesForDate(tenantId: string, date: Date): Promise<TaxCode[]>;

    // ==================== Tax Registrations ====================

    /**
     * Create tax registration
     */
    createTaxRegistration(registration: TaxRegistration): Promise<TaxRegistration>;

    /**
     * Update tax registration
     */
    updateTaxRegistration(registration: TaxRegistration): Promise<TaxRegistration>;

    /**
     * Get registrations for a branch
     */
    getBranchRegistrations(
        tenantId: string, 
        branchId: string
    ): Promise<TaxRegistration[]>;

    /**
     * Get GSTIN for a branch
     */
    getGSTIN(tenantId: string, branchId: string): Promise<string | null>;

    // ==================== Tax Transactions ====================

    /**
     * Record a tax transaction
     */
    createTaxTransaction(transaction: TaxTransaction): Promise<TaxTransaction>;

    /**
     * Get tax transactions for a period
     */
    getTaxTransactions(
        tenantId: string,
        options: TaxTransactionQueryOptions
    ): Promise<TaxTransactionQueryResult>;

    /**
     * Get tax summary for a period (for returns)
     */
    getTaxSummary(
        tenantId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<TaxSummary>;

    /**
     * Get input tax credit available
     */
    getInputTaxCredit(
        tenantId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<InputTaxCreditSummary>;

    /**
     * Get output tax liability
     */
    getOutputTaxLiability(
        tenantId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<OutputTaxSummary>;

    /**
     * Mark transactions as reported
     */
    markAsReported(
        tenantId: string,
        transactionIds: string[],
        returnReference: string
    ): Promise<void>;

    /**
     * Get TDS summary for period
     */
    getTDSSummary(
        tenantId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<TDSSummary>;
}

/**
 * Tax transaction query options
 */
export interface TaxTransactionQueryOptions {
    branchId?: string;
    taxType?: string;
    isInputTax?: boolean;
    fiscalYear?: number;
    fiscalPeriod?: number;
    fromDate?: Date;
    toDate?: Date;
    partyId?: string;
    partyType?: string;
    isReported?: boolean;
    page?: number;
    pageSize?: number;
}

/**
 * Tax transaction query result
 */
export interface TaxTransactionQueryResult {
    transactions: TaxTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalTaxableAmount: number;
    totalTaxAmount: number;
}

/**
 * Tax summary for a period
 */
export interface TaxSummary {
    fiscalYear: number;
    fiscalPeriod: number;
    branchId?: string;
    
    // Output tax (sales)
    outputCGST: number;
    outputSGST: number;
    outputIGST: number;
    totalOutputTax: number;
    
    // Input tax (purchases)
    inputCGST: number;
    inputSGST: number;
    inputIGST: number;
    totalInputTax: number;
    
    // Net payable/receivable
    netCGST: number;
    netSGST: number;
    netIGST: number;
    netPayable: number;
    
    // Transaction counts
    salesCount: number;
    purchaseCount: number;
    
    // Reverse charge
    reverseChargeTax: number;
}

/**
 * Input tax credit summary
 */
export interface InputTaxCreditSummary {
    availableITC: number;
    itcCGST: number;
    itcSGST: number;
    itcIGST: number;
    blockedITC: number;
    reversedITC: number;
    utilisedITC: number;
    balanceITC: number;
}

/**
 * Output tax summary
 */
export interface OutputTaxSummary {
    totalTaxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalCess: number;
    totalTax: number;
    
    // Rate-wise breakup
    rateWiseSummary: {
        rate: number;
        taxableValue: number;
        cgst: number;
        sgst: number;
        igst: number;
    }[];
}

/**
 * TDS summary
 */
export interface TDSSummary {
    fiscalYear: number;
    fiscalPeriod: number;
    
    sections: {
        section: string;
        description: string;
        transactionCount: number;
        totalAmount: number;
        tdsDeducted: number;
    }[];
    
    totalTDSDeducted: number;
    totalTDSDeposited: number;
    pendingDeposit: number;
}
