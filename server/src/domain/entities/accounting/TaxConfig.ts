import { generateId } from '../../../shared/utils/index.js';

/**
 * Tax Configuration Types
 */

export type TaxType = 'GST' | 'VAT' | 'SALES_TAX' | 'SERVICE_TAX' | 'TDS' | 'WITHHOLDING' | 'CUSTOM';

export type TaxCalculationMethod = 'EXCLUSIVE' | 'INCLUSIVE';

export type TaxCategory = 
    | 'CGST'        // Central GST
    | 'SGST'        // State GST
    | 'IGST'        // Integrated GST
    | 'UTGST'       // Union Territory GST
    | 'CESS'        // Compensation Cess
    | 'TDS_194C'    // TDS on Contractors
    | 'TDS_194J'    // TDS on Professional Services
    | 'TDS_194H'    // TDS on Commission
    | 'STANDARD'    // Standard rate
    | 'REDUCED'     // Reduced rate
    | 'ZERO'        // Zero rated
    | 'EXEMPT';     // Exempt from tax

export type PlaceOfSupply = 
    | 'INTRA_STATE'   // Within same state
    | 'INTER_STATE'   // Between different states
    | 'EXPORT'        // Outside country
    | 'SEZ';          // Special Economic Zone

/**
 * Tax Code Properties
 */
export interface TaxCodeProps {
    id?: string;
    tenantId: string;
    code: string;               // e.g., "GST18", "TDS10"
    name: string;
    description?: string;
    taxType: TaxType;
    taxCategory: TaxCategory;
    rate: number;               // Percentage (e.g., 18 for 18%)
    calculationMethod: TaxCalculationMethod;
    
    // Account mapping
    inputTaxAccountId?: string;     // For input credit
    outputTaxAccountId?: string;    // For output liability
    expenseAccountId?: string;      // For non-creditable tax
    
    // Validity
    effectiveFrom: Date;
    effectiveTo?: Date;
    isActive: boolean;
    
    // Reverse charge
    isReverseCharge: boolean;
    
    // Compound tax (tax on tax)
    isCompound: boolean;
    compoundOnTaxCodes?: string[];
    
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Tax Code Entity
 */
export class TaxCode {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly code: string;
    public readonly name: string;
    public readonly description: string | null;
    public readonly taxType: TaxType;
    public readonly taxCategory: TaxCategory;
    public readonly rate: number;
    public readonly calculationMethod: TaxCalculationMethod;
    public readonly inputTaxAccountId: string | null;
    public readonly outputTaxAccountId: string | null;
    public readonly expenseAccountId: string | null;
    public readonly effectiveFrom: Date;
    public readonly effectiveTo: Date | null;
    public readonly isActive: boolean;
    public readonly isReverseCharge: boolean;
    public readonly isCompound: boolean;
    public readonly compoundOnTaxCodes: string[];
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: TaxCodeProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.code = props.code;
        this.name = props.name;
        this.description = props.description ?? null;
        this.taxType = props.taxType;
        this.taxCategory = props.taxCategory;
        this.rate = props.rate;
        this.calculationMethod = props.calculationMethod;
        this.inputTaxAccountId = props.inputTaxAccountId ?? null;
        this.outputTaxAccountId = props.outputTaxAccountId ?? null;
        this.expenseAccountId = props.expenseAccountId ?? null;
        this.effectiveFrom = props.effectiveFrom;
        this.effectiveTo = props.effectiveTo ?? null;
        this.isActive = props.isActive;
        this.isReverseCharge = props.isReverseCharge;
        this.isCompound = props.isCompound;
        this.compoundOnTaxCodes = props.compoundOnTaxCodes ?? [];
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: TaxCodeProps): TaxCode {
        return new TaxCode({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: TaxCodeProps & { id: string }): TaxCode {
        return new TaxCode(data);
    }

    /**
     * Check if tax code is valid for a given date
     */
    isValidForDate(date: Date): boolean {
        if (!this.isActive) return false;
        if (date < this.effectiveFrom) return false;
        if (this.effectiveTo && date > this.effectiveTo) return false;
        return true;
    }

    /**
     * Calculate tax amount
     */
    calculateTax(baseAmount: number): number {
        if (this.calculationMethod === 'EXCLUSIVE') {
            return baseAmount * (this.rate / 100);
        } else {
            // Inclusive: extract tax from total
            return baseAmount - (baseAmount / (1 + this.rate / 100));
        }
    }
}

/**
 * Tax Registration - Branch-level tax registration (GSTIN, VAT number, etc.)
 */
export interface TaxRegistrationProps {
    id?: string;
    tenantId: string;
    branchId: string;
    taxType: TaxType;
    registrationNumber: string;     // e.g., GSTIN, VAT number
    legalName: string;
    tradeName?: string;
    stateCode?: string;             // For GST
    registrationDate: Date;
    validUntil?: Date;
    isActive: boolean;
    
    // Filing configuration
    filingFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    
    // Compliance
    compositionScheme?: boolean;    // GST composition scheme
    reverseChargeApplicable?: boolean;
    
    createdAt?: Date;
    updatedAt?: Date;
}

export class TaxRegistration {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string;
    public readonly taxType: TaxType;
    public readonly registrationNumber: string;
    public readonly legalName: string;
    public readonly tradeName: string | null;
    public readonly stateCode: string | null;
    public readonly registrationDate: Date;
    public readonly validUntil: Date | null;
    public readonly isActive: boolean;
    public readonly filingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | null;
    public readonly compositionScheme: boolean;
    public readonly reverseChargeApplicable: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: TaxRegistrationProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId;
        this.taxType = props.taxType;
        this.registrationNumber = props.registrationNumber;
        this.legalName = props.legalName;
        this.tradeName = props.tradeName ?? null;
        this.stateCode = props.stateCode ?? null;
        this.registrationDate = props.registrationDate;
        this.validUntil = props.validUntil ?? null;
        this.isActive = props.isActive;
        this.filingFrequency = props.filingFrequency ?? null;
        this.compositionScheme = props.compositionScheme ?? false;
        this.reverseChargeApplicable = props.reverseChargeApplicable ?? false;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: TaxRegistrationProps): TaxRegistration {
        return new TaxRegistration({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: TaxRegistrationProps & { id: string }): TaxRegistration {
        return new TaxRegistration(data);
    }
}

/**
 * Tax Transaction - Record of tax calculated on transactions
 */
export interface TaxTransactionProps {
    id?: string;
    tenantId: string;
    branchId: string;
    taxCodeId: string;
    taxCode: string;
    taxRate: number;
    taxType: TaxType;
    taxCategory: TaxCategory;
    
    // Source
    sourceModule: string;           // BOOKING, VENDOR, etc.
    sourceRecordId: string;
    journalEntryId?: string;
    
    // Transaction details
    transactionDate: Date;
    placeOfSupply: PlaceOfSupply;
    
    // Amounts
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
    
    // Party
    partyType: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
    partyId: string;
    partyName: string;
    partyTaxId?: string;            // Customer/Vendor GSTIN
    
    // Tax direction
    isInputTax: boolean;            // true = input (purchases), false = output (sales)
    isReverseCharge: boolean;
    
    // Credit
    isCredited: boolean;            // Has input credit been claimed?
    creditedAt?: Date;
    
    // Fiscal period
    fiscalYear: number;
    fiscalPeriod: number;
    
    // Filing status
    isReported: boolean;
    reportedInReturn?: string;
    reportedAt?: Date;
    
    createdAt?: Date;
}

export class TaxTransaction {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string;
    public readonly taxCodeId: string;
    public readonly taxCode: string;
    public readonly taxRate: number;
    public readonly taxType: TaxType;
    public readonly taxCategory: TaxCategory;
    public readonly sourceModule: string;
    public readonly sourceRecordId: string;
    public readonly journalEntryId: string | null;
    public readonly transactionDate: Date;
    public readonly placeOfSupply: PlaceOfSupply;
    public readonly taxableAmount: number;
    public readonly taxAmount: number;
    public readonly totalAmount: number;
    public readonly partyType: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
    public readonly partyId: string;
    public readonly partyName: string;
    public readonly partyTaxId: string | null;
    public readonly isInputTax: boolean;
    public readonly isReverseCharge: boolean;
    public readonly isCredited: boolean;
    public readonly creditedAt: Date | null;
    public readonly fiscalYear: number;
    public readonly fiscalPeriod: number;
    public readonly isReported: boolean;
    public readonly reportedInReturn: string | null;
    public readonly reportedAt: Date | null;
    public readonly createdAt: Date;

    private constructor(props: TaxTransactionProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId;
        this.taxCodeId = props.taxCodeId;
        this.taxCode = props.taxCode;
        this.taxRate = props.taxRate;
        this.taxType = props.taxType;
        this.taxCategory = props.taxCategory;
        this.sourceModule = props.sourceModule;
        this.sourceRecordId = props.sourceRecordId;
        this.journalEntryId = props.journalEntryId ?? null;
        this.transactionDate = props.transactionDate;
        this.placeOfSupply = props.placeOfSupply;
        this.taxableAmount = props.taxableAmount;
        this.taxAmount = props.taxAmount;
        this.totalAmount = props.totalAmount;
        this.partyType = props.partyType;
        this.partyId = props.partyId;
        this.partyName = props.partyName;
        this.partyTaxId = props.partyTaxId ?? null;
        this.isInputTax = props.isInputTax;
        this.isReverseCharge = props.isReverseCharge;
        this.isCredited = props.isCredited;
        this.creditedAt = props.creditedAt ?? null;
        this.fiscalYear = props.fiscalYear;
        this.fiscalPeriod = props.fiscalPeriod;
        this.isReported = props.isReported;
        this.reportedInReturn = props.reportedInReturn ?? null;
        this.reportedAt = props.reportedAt ?? null;
        this.createdAt = props.createdAt ?? new Date();
    }

    static create(props: TaxTransactionProps): TaxTransaction {
        return new TaxTransaction({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: TaxTransactionProps & { id: string }): TaxTransaction {
        return new TaxTransaction(data);
    }
}

/**
 * Standard GST Tax Codes for India
 */
export const STANDARD_GST_CODES = {
    // CGST + SGST (Intra-state)
    GST_5_INTRA: { cgst: 2.5, sgst: 2.5, total: 5 },
    GST_12_INTRA: { cgst: 6, sgst: 6, total: 12 },
    GST_18_INTRA: { cgst: 9, sgst: 9, total: 18 },
    GST_28_INTRA: { cgst: 14, sgst: 14, total: 28 },
    
    // IGST (Inter-state)
    GST_5_INTER: { igst: 5 },
    GST_12_INTER: { igst: 12 },
    GST_18_INTER: { igst: 18 },
    GST_28_INTER: { igst: 28 },
    
    // TDS
    TDS_194C_1: { rate: 1, description: 'TDS on Contractor (Individual/HUF)' },
    TDS_194C_2: { rate: 2, description: 'TDS on Contractor (Others)' },
    TDS_194J_10: { rate: 10, description: 'TDS on Professional/Technical Services' },
    TDS_194H_5: { rate: 5, description: 'TDS on Commission/Brokerage' },
};

/**
 * Determine GST applicability based on place of supply
 */
export function determineGSTType(
    supplierStateCode: string,
    recipientStateCode: string,
    isExport: boolean = false,
    isSEZ: boolean = false
): { placeOfSupply: PlaceOfSupply; taxCategories: TaxCategory[] } {
    if (isExport) {
        return { placeOfSupply: 'EXPORT', taxCategories: ['ZERO'] };
    }
    
    if (isSEZ) {
        return { placeOfSupply: 'SEZ', taxCategories: ['ZERO'] };
    }
    
    if (supplierStateCode === recipientStateCode) {
        return { 
            placeOfSupply: 'INTRA_STATE', 
            taxCategories: ['CGST', 'SGST'] 
        };
    }
    
    return { 
        placeOfSupply: 'INTER_STATE', 
        taxCategories: ['IGST'] 
    };
}
