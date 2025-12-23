import { VendorSettlement, SettlementMethod, BankDetailsSnapshot } from '../../../domain/entities/vendor/index.js';
import { VendorSettlementRepository, VendorPayableRepository, VendorRepository } from '../../../infrastructure/repositories/vendor/index.js';
import { SettlementFilters, SettlementSummary } from '../../../domain/interfaces/vendor/index.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

export interface CreateSettlementDTO {
    vendorId: string;
    payableIds: string[];
    payableAmounts: Array<{ payableId: string; amount: number }>;
    totalAmount: number;
    currency?: string;
    paymentMethod: SettlementMethod;
    paymentReference?: string;
    paymentDate: Date;
    notes?: string;
}

export class VendorSettlementService {
    constructor(
        private settlementRepository: VendorSettlementRepository,
        private payableRepository: VendorPayableRepository,
        private vendorRepository: VendorRepository
    ) {}

    async create(dto: CreateSettlementDTO, tenantId: string, userId?: string): Promise<VendorSettlement> {
        // Validate vendor exists
        const vendor = await this.vendorRepository.findById(dto.vendorId, tenantId);
        if (!vendor) throw new NotFoundError('Vendor not found');

        // Validate all payables exist and are settleable
        for (const { payableId, amount } of dto.payableAmounts) {
            const payable = await this.payableRepository.findById(payableId, tenantId);
            if (!payable) throw new NotFoundError(`Payable ${payableId} not found`);
            if (!['APPROVED', 'PARTIALLY_SETTLED'].includes(payable.status)) {
                throw new ValidationError(`Payable ${payable.payableNumber} is not approved for settlement`);
            }
            if (amount > payable.remainingAmount) {
                throw new ValidationError(`Settlement amount for ${payable.payableNumber} exceeds remaining`);
            }
        }

        // Calculate total
        const calculatedTotal = dto.payableAmounts.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(calculatedTotal - dto.totalAmount) > 0.01) {
            throw new ValidationError('Total amount does not match sum of payable amounts');
        }

        // Snapshot bank details
        const bankDetailsSnapshot: BankDetailsSnapshot = {
            bankName: vendor.bankName,
            accountNumber: vendor.bankAccountNumber,
            ifscCode: vendor.bankIfscCode,
            upiId: vendor.upiId,
        };

        // Create settlement
        const settlement = VendorSettlement.create({
            tenantId,
            vendorId: dto.vendorId,
            payableIds: dto.payableIds,
            amount: dto.totalAmount,
            currency: dto.currency ?? vendor.defaultCurrency,
            paymentMethod: dto.paymentMethod,
            paymentReference: dto.paymentReference,
            paymentDate: dto.paymentDate,
            bankDetailsSnapshot,
            notes: dto.notes,
            createdBy: userId,
        });

        const saved = await this.settlementRepository.save(settlement);

        // Link payables and update their settled amounts
        await this.settlementRepository.linkPayables(saved.id, dto.payableAmounts);
        
        for (const { payableId, amount } of dto.payableAmounts) {
            await this.payableRepository.updateSettledAmount(payableId, tenantId, amount);
        }

        return saved;
    }

    async getById(id: string, tenantId: string): Promise<VendorSettlement> {
        const settlement = await this.settlementRepository.findById(id, tenantId);
        if (!settlement) throw new NotFoundError('Settlement not found');
        return settlement;
    }

    async getByNumber(settlementNumber: string, tenantId: string): Promise<VendorSettlement> {
        const settlement = await this.settlementRepository.findByNumber(settlementNumber, tenantId);
        if (!settlement) throw new NotFoundError('Settlement not found');
        return settlement;
    }

    async getAll(tenantId: string, filters?: SettlementFilters, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.settlementRepository.findAll(tenantId, filters, limit, offset),
            this.settlementRepository.count(tenantId, filters),
        ]);
        return { data, total, page, limit };
    }

    async getByVendor(vendorId: string, tenantId: string): Promise<VendorSettlement[]> {
        return this.settlementRepository.findByVendor(vendorId, tenantId);
    }

    async verify(id: string, tenantId: string, verifiedBy: string): Promise<void> {
        const settlement = await this.getById(id, tenantId);
        if (settlement.isVerified) {
            throw new ValidationError('Settlement is already verified');
        }
        await this.settlementRepository.verify(id, tenantId, verifiedBy);
    }

    async getSummary(tenantId: string, dateFrom?: Date, dateTo?: Date): Promise<SettlementSummary> {
        return this.settlementRepository.getSummary(tenantId, dateFrom, dateTo);
    }

    async getVendorSummary(vendorId: string, tenantId: string): Promise<SettlementSummary> {
        return this.settlementRepository.getVendorSummary(vendorId, tenantId);
    }
}
