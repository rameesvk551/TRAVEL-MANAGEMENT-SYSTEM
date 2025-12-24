import { query, getClient } from '../../../infrastructure/database/connection.js';
import { 
    TaxCode, 
    TaxTransaction, 
    TaxRegistration,
    TaxCodeProps,
    TaxTransactionProps,
    determineGSTType 
} from '../../../domain/entities/accounting/TaxConfig.js';
import { 
    TaxSummary, 
    InputTaxCreditSummary, 
    TDSSummary 
} from '../../../domain/interfaces/accounting/ITaxRepository.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * Tax Engine Service
 * 
 * Comprehensive tax management with:
 * - GST/VAT/TDS calculation
 * - Input tax credit tracking
 * - Place of supply determination
 * - Tax return data aggregation
 * - Reverse charge handling
 */
export class TaxEngineService {

    // ==================== TAX CODES ====================

    /**
     * Create a tax code
     */
    async createTaxCode(props: TaxCodeProps): Promise<TaxCode> {
        const taxCode = TaxCode.create(props);

        const result = await query(`
            INSERT INTO public.tax_codes (
                id, tenant_id, code, name, description, tax_type, tax_category,
                rate, calculation_method, input_tax_account_id, output_tax_account_id,
                expense_account_id, effective_from, effective_to, is_active,
                is_reverse_charge, is_compound, compound_on_tax_codes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING *
        `, [
            taxCode.id,
            taxCode.tenantId,
            taxCode.code,
            taxCode.name,
            taxCode.description,
            taxCode.taxType,
            taxCode.taxCategory,
            taxCode.rate,
            taxCode.calculationMethod,
            taxCode.inputTaxAccountId,
            taxCode.outputTaxAccountId,
            taxCode.expenseAccountId,
            taxCode.effectiveFrom,
            taxCode.effectiveTo,
            taxCode.isActive,
            taxCode.isReverseCharge,
            taxCode.isCompound,
            taxCode.compoundOnTaxCodes,
            taxCode.createdAt,
            taxCode.updatedAt,
        ]);

        return this.mapToTaxCode(result.rows[0]);
    }

    /**
     * Get tax code by ID
     */
    async getTaxCodeById(tenantId: string, id: string): Promise<TaxCode | null> {
        const result = await query(`
            SELECT * FROM public.tax_codes
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, id]);

        if (result.rows.length === 0) return null;
        return this.mapToTaxCode(result.rows[0]);
    }

    /**
     * Get tax code by code
     */
    async getTaxCodeByCode(tenantId: string, code: string): Promise<TaxCode | null> {
        const result = await query(`
            SELECT * FROM public.tax_codes
            WHERE tenant_id = $1 AND code = $2
        `, [tenantId, code]);

        if (result.rows.length === 0) return null;
        return this.mapToTaxCode(result.rows[0]);
    }

    /**
     * Get all active tax codes
     */
    async getActiveTaxCodes(tenantId: string, taxType?: string): Promise<TaxCode[]> {
        let sql = `
            SELECT * FROM public.tax_codes
            WHERE tenant_id = $1 AND is_active = true
        `;
        const params: any[] = [tenantId];

        if (taxType) {
            params.push(taxType);
            sql += ` AND tax_type = $${params.length}`;
        }

        sql += ` ORDER BY code`;

        const result = await query(sql, params);
        return result.rows.map(row => this.mapToTaxCode(row));
    }

    /**
     * Initialize standard GST tax codes for India
     */
    async initializeGSTCodes(
        tenantId: string,
        inputAccountId: string,
        outputAccountId: string
    ): Promise<TaxCode[]> {
        const codes: TaxCodeProps[] = [
            // Intra-state (CGST + SGST)
            { tenantId, code: 'GST5', name: 'GST 5%', taxType: 'GST', taxCategory: 'STANDARD', rate: 5, calculationMethod: 'EXCLUSIVE', inputTaxAccountId: inputAccountId, outputTaxAccountId: outputAccountId, effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'GST12', name: 'GST 12%', taxType: 'GST', taxCategory: 'STANDARD', rate: 12, calculationMethod: 'EXCLUSIVE', inputTaxAccountId: inputAccountId, outputTaxAccountId: outputAccountId, effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'GST18', name: 'GST 18%', taxType: 'GST', taxCategory: 'STANDARD', rate: 18, calculationMethod: 'EXCLUSIVE', inputTaxAccountId: inputAccountId, outputTaxAccountId: outputAccountId, effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'GST28', name: 'GST 28%', taxType: 'GST', taxCategory: 'STANDARD', rate: 28, calculationMethod: 'EXCLUSIVE', inputTaxAccountId: inputAccountId, outputTaxAccountId: outputAccountId, effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'GST0', name: 'GST 0% (Zero Rated)', taxType: 'GST', taxCategory: 'ZERO', rate: 0, calculationMethod: 'EXCLUSIVE', inputTaxAccountId: inputAccountId, outputTaxAccountId: outputAccountId, effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'GSTEXEMPT', name: 'GST Exempt', taxType: 'GST', taxCategory: 'EXEMPT', rate: 0, calculationMethod: 'EXCLUSIVE', effectiveFrom: new Date('2017-07-01'), isActive: true, isReverseCharge: false, isCompound: false },
            
            // TDS
            { tenantId, code: 'TDS194C1', name: 'TDS 194C - 1%', description: 'Contractor (Individual/HUF)', taxType: 'TDS', taxCategory: 'TDS_194C', rate: 1, calculationMethod: 'EXCLUSIVE', effectiveFrom: new Date('2020-04-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'TDS194C2', name: 'TDS 194C - 2%', description: 'Contractor (Others)', taxType: 'TDS', taxCategory: 'TDS_194C', rate: 2, calculationMethod: 'EXCLUSIVE', effectiveFrom: new Date('2020-04-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'TDS194J', name: 'TDS 194J - 10%', description: 'Professional/Technical Services', taxType: 'TDS', taxCategory: 'TDS_194J', rate: 10, calculationMethod: 'EXCLUSIVE', effectiveFrom: new Date('2020-04-01'), isActive: true, isReverseCharge: false, isCompound: false },
            { tenantId, code: 'TDS194H', name: 'TDS 194H - 5%', description: 'Commission/Brokerage', taxType: 'TDS', taxCategory: 'TDS_194H', rate: 5, calculationMethod: 'EXCLUSIVE', effectiveFrom: new Date('2020-04-01'), isActive: true, isReverseCharge: false, isCompound: false },
        ];

        const createdCodes: TaxCode[] = [];
        for (const codeProps of codes) {
            try {
                const created = await this.createTaxCode(codeProps);
                createdCodes.push(created);
            } catch (e) {
                // Skip if already exists
            }
        }

        return createdCodes;
    }

    // ==================== TAX CALCULATION ====================

    /**
     * Calculate tax for a transaction
     */
    calculateTax(
        baseAmount: number,
        taxCode: TaxCode,
        placeOfSupply: 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT' | 'SEZ' = 'INTRA_STATE'
    ): {
        taxableAmount: number;
        cgst: number;
        sgst: number;
        igst: number;
        totalTax: number;
        totalAmount: number;
    } {
        if (taxCode.taxCategory === 'EXEMPT' || taxCode.taxCategory === 'ZERO') {
            return {
                taxableAmount: baseAmount,
                cgst: 0,
                sgst: 0,
                igst: 0,
                totalTax: 0,
                totalAmount: baseAmount,
            };
        }

        const taxableAmount = taxCode.calculationMethod === 'INCLUSIVE'
            ? baseAmount / (1 + taxCode.rate / 100)
            : baseAmount;

        const totalTax = taxableAmount * (taxCode.rate / 100);

        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (placeOfSupply === 'INTRA_STATE') {
            cgst = totalTax / 2;
            sgst = totalTax / 2;
        } else {
            igst = totalTax;
        }

        return {
            taxableAmount: Math.round(taxableAmount * 100) / 100,
            cgst: Math.round(cgst * 100) / 100,
            sgst: Math.round(sgst * 100) / 100,
            igst: Math.round(igst * 100) / 100,
            totalTax: Math.round(totalTax * 100) / 100,
            totalAmount: Math.round((taxableAmount + totalTax) * 100) / 100,
        };
    }

    /**
     * Calculate TDS on a payment
     */
    calculateTDS(
        amount: number,
        tdsCode: TaxCode
    ): { tdsAmount: number; netPayable: number } {
        if (tdsCode.taxType !== 'TDS') {
            throw new Error('Invalid TDS code');
        }

        const tdsAmount = Math.round(amount * (tdsCode.rate / 100) * 100) / 100;
        const netPayable = amount - tdsAmount;

        return { tdsAmount, netPayable };
    }

    // ==================== TAX TRANSACTIONS ====================

    /**
     * Record a tax transaction
     */
    async recordTaxTransaction(props: TaxTransactionProps): Promise<TaxTransaction> {
        const transaction = TaxTransaction.create(props);

        const result = await query(`
            INSERT INTO public.tax_transactions (
                id, tenant_id, branch_id, tax_code_id, tax_code, tax_rate,
                tax_type, tax_category, source_module, source_record_id, journal_entry_id,
                transaction_date, place_of_supply, taxable_amount, tax_amount, total_amount,
                party_type, party_id, party_name, party_tax_id, is_input_tax,
                is_reverse_charge, is_credited, fiscal_year, fiscal_period, is_reported, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
            )
            RETURNING *
        `, [
            transaction.id,
            transaction.tenantId,
            transaction.branchId,
            transaction.taxCodeId,
            transaction.taxCode,
            transaction.taxRate,
            transaction.taxType,
            transaction.taxCategory,
            transaction.sourceModule,
            transaction.sourceRecordId,
            transaction.journalEntryId,
            transaction.transactionDate,
            transaction.placeOfSupply,
            transaction.taxableAmount,
            transaction.taxAmount,
            transaction.totalAmount,
            transaction.partyType,
            transaction.partyId,
            transaction.partyName,
            transaction.partyTaxId,
            transaction.isInputTax,
            transaction.isReverseCharge,
            transaction.isCredited,
            transaction.fiscalYear,
            transaction.fiscalPeriod,
            transaction.isReported,
            transaction.createdAt,
        ]);

        return this.mapToTaxTransaction(result.rows[0]);
    }

    /**
     * Get GST summary for a period
     */
    async getGSTSummary(
        tenantId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<TaxSummary> {
        const params: any[] = [tenantId, fiscalYear, fiscalPeriod];
        let branchClause = '';

        if (branchId) {
            params.push(branchId);
            branchClause = `AND branch_id = $4`;
        }

        const result = await query(`
            SELECT 
                is_input_tax,
                tax_category,
                place_of_supply,
                COUNT(*) as transaction_count,
                SUM(taxable_amount) as taxable_amount,
                SUM(tax_amount) as tax_amount
            FROM public.tax_transactions
            WHERE tenant_id = $1
            AND fiscal_year = $2
            AND fiscal_period = $3
            AND tax_type = 'GST'
            ${branchClause}
            GROUP BY is_input_tax, tax_category, place_of_supply
        `, params);

        let outputCGST = 0, outputSGST = 0, outputIGST = 0;
        let inputCGST = 0, inputSGST = 0, inputIGST = 0;
        let salesCount = 0, purchaseCount = 0;
        let reverseChargeTax = 0;

        for (const row of result.rows) {
            const taxAmount = parseFloat(row.tax_amount);
            const isIntraState = row.place_of_supply === 'INTRA_STATE';
            const count = parseInt(row.transaction_count);

            if (row.is_input_tax) {
                purchaseCount += count;
                if (isIntraState) {
                    inputCGST += taxAmount / 2;
                    inputSGST += taxAmount / 2;
                } else {
                    inputIGST += taxAmount;
                }
            } else {
                salesCount += count;
                if (isIntraState) {
                    outputCGST += taxAmount / 2;
                    outputSGST += taxAmount / 2;
                } else {
                    outputIGST += taxAmount;
                }
            }
        }

        const totalOutputTax = outputCGST + outputSGST + outputIGST;
        const totalInputTax = inputCGST + inputSGST + inputIGST;

        return {
            fiscalYear,
            fiscalPeriod,
            branchId,
            outputCGST,
            outputSGST,
            outputIGST,
            totalOutputTax,
            inputCGST,
            inputSGST,
            inputIGST,
            totalInputTax,
            netCGST: outputCGST - inputCGST,
            netSGST: outputSGST - inputSGST,
            netIGST: outputIGST - inputIGST,
            netPayable: totalOutputTax - totalInputTax,
            salesCount,
            purchaseCount,
            reverseChargeTax,
        };
    }

    /**
     * Get input tax credit summary
     */
    async getInputTaxCredit(
        tenantId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<InputTaxCreditSummary> {
        const params: any[] = [tenantId, asOfDate];
        let branchClause = '';

        if (branchId) {
            params.push(branchId);
            branchClause = `AND branch_id = $3`;
        }

        const result = await query(`
            SELECT 
                place_of_supply,
                SUM(CASE WHEN is_credited = false THEN tax_amount ELSE 0 END) as available_itc,
                SUM(CASE WHEN is_credited = true THEN tax_amount ELSE 0 END) as utilised_itc
            FROM public.tax_transactions
            WHERE tenant_id = $1
            AND is_input_tax = true
            AND tax_type = 'GST'
            AND transaction_date <= $2
            ${branchClause}
            GROUP BY place_of_supply
        `, params);

        let itcCGST = 0, itcSGST = 0, itcIGST = 0;
        let utilisedITC = 0;

        for (const row of result.rows) {
            const available = parseFloat(row.available_itc);
            utilisedITC += parseFloat(row.utilised_itc);

            if (row.place_of_supply === 'INTRA_STATE') {
                itcCGST += available / 2;
                itcSGST += available / 2;
            } else {
                itcIGST += available;
            }
        }

        const availableITC = itcCGST + itcSGST + itcIGST;

        return {
            availableITC,
            itcCGST,
            itcSGST,
            itcIGST,
            blockedITC: 0,
            reversedITC: 0,
            utilisedITC,
            balanceITC: availableITC,
        };
    }

    /**
     * Get TDS summary for a period
     */
    async getTDSSummary(
        tenantId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<TDSSummary> {
        const params: any[] = [tenantId, fiscalYear, fiscalPeriod];
        let branchClause = '';

        if (branchId) {
            params.push(branchId);
            branchClause = `AND branch_id = $4`;
        }

        const result = await query(`
            SELECT 
                tax_category,
                tc.description,
                COUNT(*) as transaction_count,
                SUM(taxable_amount) as total_amount,
                SUM(tax_amount) as tds_deducted
            FROM public.tax_transactions tt
            JOIN public.tax_codes tc ON tt.tax_code_id = tc.id
            WHERE tt.tenant_id = $1
            AND tt.fiscal_year = $2
            AND tt.fiscal_period = $3
            AND tt.tax_type = 'TDS'
            ${branchClause}
            GROUP BY tax_category, tc.description
        `, params);

        const sections = result.rows.map(row => ({
            section: row.tax_category,
            description: row.description || row.tax_category,
            transactionCount: parseInt(row.transaction_count),
            totalAmount: parseFloat(row.total_amount),
            tdsDeducted: parseFloat(row.tds_deducted),
        }));

        const totalTDSDeducted = sections.reduce((sum, s) => sum + s.tdsDeducted, 0);

        return {
            fiscalYear,
            fiscalPeriod,
            sections,
            totalTDSDeducted,
            totalTDSDeposited: 0, // Would need payment tracking
            pendingDeposit: totalTDSDeducted,
        };
    }

    /**
     * Mark transactions as reported in a return
     */
    async markAsReported(
        tenantId: string,
        transactionIds: string[],
        returnReference: string
    ): Promise<void> {
        await query(`
            UPDATE public.tax_transactions
            SET is_reported = true,
                reported_in_return = $3,
                reported_at = NOW()
            WHERE tenant_id = $1 AND id = ANY($2)
        `, [tenantId, transactionIds, returnReference]);
    }

    // ==================== TAX REGISTRATIONS ====================

    /**
     * Create tax registration
     */
    async createTaxRegistration(
        tenantId: string,
        branchId: string,
        props: {
            taxType: string;
            registrationNumber: string;
            legalName: string;
            tradeName?: string;
            stateCode?: string;
            registrationDate: Date;
        }
    ): Promise<TaxRegistration> {
        const id = generateId();

        const result = await query(`
            INSERT INTO public.tax_registrations (
                id, tenant_id, branch_id, tax_type, registration_number,
                legal_name, trade_name, state_code, registration_date,
                is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW())
            RETURNING *
        `, [
            id,
            tenantId,
            branchId,
            props.taxType,
            props.registrationNumber,
            props.legalName,
            props.tradeName,
            props.stateCode,
            props.registrationDate,
        ]);

        return this.mapToTaxRegistration(result.rows[0]);
    }

    /**
     * Get GSTIN for a branch
     */
    async getGSTIN(tenantId: string, branchId: string): Promise<string | null> {
        const result = await query(`
            SELECT registration_number FROM public.tax_registrations
            WHERE tenant_id = $1 AND branch_id = $2 AND tax_type = 'GST' AND is_active = true
        `, [tenantId, branchId]);

        return result.rows.length > 0 ? result.rows[0].registration_number : null;
    }

    // ==================== MAPPERS ====================

    private mapToTaxCode(row: any): TaxCode {
        return TaxCode.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            code: row.code,
            name: row.name,
            description: row.description,
            taxType: row.tax_type,
            taxCategory: row.tax_category,
            rate: parseFloat(row.rate),
            calculationMethod: row.calculation_method,
            inputTaxAccountId: row.input_tax_account_id,
            outputTaxAccountId: row.output_tax_account_id,
            expenseAccountId: row.expense_account_id,
            effectiveFrom: row.effective_from,
            effectiveTo: row.effective_to,
            isActive: row.is_active,
            isReverseCharge: row.is_reverse_charge,
            isCompound: row.is_compound,
            compoundOnTaxCodes: row.compound_on_tax_codes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    private mapToTaxTransaction(row: any): TaxTransaction {
        return TaxTransaction.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            branchId: row.branch_id,
            taxCodeId: row.tax_code_id,
            taxCode: row.tax_code,
            taxRate: parseFloat(row.tax_rate),
            taxType: row.tax_type,
            taxCategory: row.tax_category,
            sourceModule: row.source_module,
            sourceRecordId: row.source_record_id,
            journalEntryId: row.journal_entry_id,
            transactionDate: row.transaction_date,
            placeOfSupply: row.place_of_supply,
            taxableAmount: parseFloat(row.taxable_amount),
            taxAmount: parseFloat(row.tax_amount),
            totalAmount: parseFloat(row.total_amount),
            partyType: row.party_type,
            partyId: row.party_id,
            partyName: row.party_name,
            partyTaxId: row.party_tax_id,
            isInputTax: row.is_input_tax,
            isReverseCharge: row.is_reverse_charge,
            isCredited: row.is_credited,
            creditedAt: row.credited_at,
            fiscalYear: row.fiscal_year,
            fiscalPeriod: row.fiscal_period,
            isReported: row.is_reported,
            reportedInReturn: row.reported_in_return,
            reportedAt: row.reported_at,
            createdAt: row.created_at,
        });
    }

    private mapToTaxRegistration(row: any): TaxRegistration {
        return TaxRegistration.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            branchId: row.branch_id,
            taxType: row.tax_type,
            registrationNumber: row.registration_number,
            legalName: row.legal_name,
            tradeName: row.trade_name,
            stateCode: row.state_code,
            registrationDate: row.registration_date,
            validUntil: row.valid_until,
            isActive: row.is_active,
            filingFrequency: row.filing_frequency,
            compositionScheme: row.composition_scheme,
            reverseChargeApplicable: row.reverse_charge_applicable,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}
