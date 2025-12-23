import { VendorPayable, PayableStatus, DeductionDetail } from '../../../domain/entities/vendor/index.js';
import { VendorPayableRepository } from '../../../infrastructure/repositories/vendor/index.js';
import { PayableFilters, PayableSummary } from '../../../domain/interfaces/vendor/index.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

export interface CreatePayableDTO {
    vendorId: string;
    assignmentId?: string;
    grossAmount: number;
    advancePaid?: number;
    deductions?: number;
    penalties?: number;
    adjustments?: number;
    taxAmount?: number;
    netPayable: number;
    currency?: string;
    deductionDetails?: DeductionDetail[];
    dueDate?: Date;
    notes?: string;
}

export interface UpdatePayableDTO {
    grossAmount?: number;
    advancePaid?: number;
    deductions?: number;
    penalties?: number;
    adjustments?: number;
    taxAmount?: number;
    netPayable?: number;
    deductionDetails?: DeductionDetail[];
    dueDate?: Date;
    notes?: string;
}

export class VendorPayableService {
    constructor(private payableRepository: VendorPayableRepository) {}

    async create(dto: CreatePayableDTO, tenantId: string, userId?: string): Promise<VendorPayable> {
        if (dto.netPayable <= 0) {
            throw new ValidationError('Net payable must be greater than 0');
        }

        const payable = VendorPayable.create({
            tenantId,
            createdBy: userId,
            status: 'DRAFT',
            ...dto,
        });

        return this.payableRepository.save(payable);
    }

    async getById(id: string, tenantId: string): Promise<VendorPayable> {
        const payable = await this.payableRepository.findById(id, tenantId);
        if (!payable) throw new NotFoundError('Payable not found');
        return payable;
    }

    async getByNumber(payableNumber: string, tenantId: string): Promise<VendorPayable> {
        const payable = await this.payableRepository.findByNumber(payableNumber, tenantId);
        if (!payable) throw new NotFoundError('Payable not found');
        return payable;
    }

    async getAll(tenantId: string, filters?: PayableFilters, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.payableRepository.findAll(tenantId, filters, limit, offset),
            this.payableRepository.count(tenantId, filters),
        ]);
        return { data, total, page, limit };
    }

    async getByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]> {
        return this.payableRepository.findByVendor(vendorId, tenantId);
    }

    async update(id: string, dto: UpdatePayableDTO, tenantId: string): Promise<VendorPayable> {
        const existing = await this.getById(id, tenantId);
        
        if (['FULLY_SETTLED', 'CANCELLED'].includes(existing.status)) {
            throw new ValidationError('Cannot update a settled or cancelled payable');
        }

        const updated = VendorPayable.create({ ...existing, ...dto, id, tenantId });
        return this.payableRepository.update(updated);
    }

    async submit(id: string, tenantId: string): Promise<void> {
        const payable = await this.getById(id, tenantId);
        if (payable.status !== 'DRAFT') {
            throw new ValidationError('Only draft payables can be submitted');
        }
        await this.payableRepository.updateStatus(id, tenantId, 'PENDING');
    }

    async approve(id: string, tenantId: string, approvedBy: string): Promise<void> {
        const payable = await this.getById(id, tenantId);
        if (payable.status !== 'PENDING') {
            throw new ValidationError('Only pending payables can be approved');
        }
        await this.payableRepository.updateStatus(id, tenantId, 'APPROVED');
    }

    async hold(id: string, tenantId: string): Promise<void> {
        await this.getById(id, tenantId);
        await this.payableRepository.updateStatus(id, tenantId, 'ON_HOLD');
    }

    async dispute(id: string, tenantId: string): Promise<void> {
        await this.getById(id, tenantId);
        await this.payableRepository.updateStatus(id, tenantId, 'DISPUTED');
    }

    async recordSettlement(id: string, amount: number, tenantId: string): Promise<void> {
        const payable = await this.getById(id, tenantId);
        
        if (!['APPROVED', 'PARTIALLY_SETTLED'].includes(payable.status)) {
            throw new ValidationError('Payable must be approved before settlement');
        }

        if (amount > payable.remainingAmount) {
            throw new ValidationError('Settlement amount exceeds remaining payable');
        }

        await this.payableRepository.updateSettledAmount(id, tenantId, amount);
    }

    async getOverdue(tenantId: string): Promise<VendorPayable[]> {
        return this.payableRepository.findOverdue(tenantId);
    }

    async getPendingByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]> {
        return this.payableRepository.findPendingByVendor(vendorId, tenantId);
    }

    async getSummary(tenantId: string): Promise<PayableSummary> {
        return this.payableRepository.getSummary(tenantId);
    }

    async getVendorSummary(vendorId: string, tenantId: string): Promise<PayableSummary> {
        return this.payableRepository.getVendorSummary(vendorId, tenantId);
    }
}
