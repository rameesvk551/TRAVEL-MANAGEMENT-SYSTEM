import { VendorAssignment, VendorAssignmentProps, AssignmentStatus, RateSnapshot } from '../../../domain/entities/vendor/index.js';
import { VendorAssignmentRepository, VendorRepository, VendorPayableRepository } from '../../../infrastructure/repositories/vendor/index.js';
import { VendorPayable } from '../../../domain/entities/vendor/VendorPayable.js';
import { AssignmentFilters } from '../../../domain/interfaces/vendor/index.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/index.js';

export interface CreateAssignmentDTO {
    vendorId: string;
    bookingId?: string;
    resourceId?: string;
    departureId?: string;
    assignmentType?: string;
    serviceDescription?: string;
    serviceStartDate: Date;
    serviceEndDate: Date;
    rateId?: string;
    rateSnapshot?: RateSnapshot;
    quantity?: number;
    unitType?: string;
    grossAmount: number;
    discountAmount?: number;
    netAmount: number;
    currency?: string;
    replacesId?: string;
    internalNotes?: string;
}

export interface UpdateAssignmentDTO {
    serviceDescription?: string;
    serviceStartDate?: Date;
    serviceEndDate?: Date;
    quantity?: number;
    grossAmount?: number;
    discountAmount?: number;
    netAmount?: number;
    fulfilmentPercentage?: number;
    fulfilmentNotes?: string;
    customerRating?: number;
    customerFeedback?: string;
    internalNotes?: string;
}

export class VendorAssignmentService {
    constructor(
        private assignmentRepository: VendorAssignmentRepository,
        private vendorRepository: VendorRepository,
        private payableRepository: VendorPayableRepository
    ) {}

    async create(dto: CreateAssignmentDTO, tenantId: string, userId?: string): Promise<VendorAssignment> {
        // Validate vendor exists and is active
        const vendor = await this.vendorRepository.findById(dto.vendorId, tenantId);
        if (!vendor) throw new NotFoundError('Vendor not found');
        if (vendor.status !== 'ACTIVE') throw new ValidationError('Vendor is not active');

        // Validate dates
        if (new Date(dto.serviceStartDate) > new Date(dto.serviceEndDate)) {
            throw new ValidationError('Service start date must be before end date');
        }

        const assignment = VendorAssignment.create({
            tenantId,
            createdBy: userId,
            ...dto,
        });

        return this.assignmentRepository.save(assignment);
    }

    async getById(id: string, tenantId: string): Promise<VendorAssignment> {
        const assignment = await this.assignmentRepository.findById(id, tenantId);
        if (!assignment) throw new NotFoundError('Assignment not found');
        return assignment;
    }

    async getAll(tenantId: string, filters?: AssignmentFilters, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.assignmentRepository.findAll(tenantId, filters, limit, offset),
            this.assignmentRepository.count(tenantId, filters),
        ]);
        return { data, total, page, limit };
    }

    async getByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]> {
        return this.assignmentRepository.findByVendor(vendorId, tenantId);
    }

    async getByBooking(bookingId: string, tenantId: string): Promise<VendorAssignment[]> {
        return this.assignmentRepository.findByBooking(bookingId, tenantId);
    }

    async update(id: string, dto: UpdateAssignmentDTO, tenantId: string): Promise<VendorAssignment> {
        const existing = await this.getById(id, tenantId);
        const updated = VendorAssignment.create({ ...existing, ...dto, id, tenantId });
        return this.assignmentRepository.update(updated);
    }

    async updateStatus(id: string, status: AssignmentStatus, tenantId: string, reason?: string): Promise<void> {
        await this.getById(id, tenantId);
        await this.assignmentRepository.updateStatus(id, tenantId, status);
    }

    async accept(id: string, tenantId: string): Promise<void> {
        await this.updateStatus(id, 'ACCEPTED', tenantId);
    }

    async complete(id: string, tenantId: string, userId?: string): Promise<VendorPayable> {
        const assignment = await this.getById(id, tenantId);
        
        // Update assignment status
        await this.assignmentRepository.updateStatus(id, tenantId, 'COMPLETED');

        // Auto-generate payable
        const payable = VendorPayable.create({
            tenantId,
            vendorId: assignment.vendorId,
            assignmentId: assignment.id,
            grossAmount: assignment.grossAmount,
            netPayable: assignment.netAmount,
            currency: assignment.currency,
            status: 'PENDING',
            createdBy: userId,
        });

        return this.payableRepository.save(payable);
    }

    async cancel(id: string, tenantId: string, reason: string): Promise<void> {
        const assignment = await this.getById(id, tenantId);
        if (['COMPLETED', 'CANCELLED'].includes(assignment.status)) {
            throw new ValidationError('Cannot cancel a completed or already cancelled assignment');
        }
        await this.assignmentRepository.updateStatus(id, tenantId, 'CANCELLED');
    }

    async replace(id: string, newVendorId: string, tenantId: string, userId?: string): Promise<VendorAssignment> {
        const original = await this.getById(id, tenantId);
        
        // Mark original as replaced
        await this.assignmentRepository.updateStatus(id, tenantId, 'REPLACED');

        // Create new assignment
        const replacement = await this.create({
            ...original,
            vendorId: newVendorId,
            replacesId: original.id,
        }, tenantId, userId);

        return replacement;
    }

    async getUpcoming(tenantId: string, daysAhead = 7): Promise<VendorAssignment[]> {
        return this.assignmentRepository.findUpcoming(tenantId, daysAhead);
    }

    async getPendingByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]> {
        return this.assignmentRepository.findPendingByVendor(vendorId, tenantId);
    }
}
