import { VendorDispute, DisputeStatus, DisputePriority } from '../../entities/vendor/index.js';

export interface DisputeFilters {
    vendorId?: string;
    assignmentId?: string;
    payableId?: string;
    status?: DisputeStatus;
    priority?: DisputePriority;
    disputeType?: string;
}

export interface DisputeSummary {
    totalOpen: number;
    totalUnderReview: number;
    totalResolved: number;
    totalDisputedAmount: number;
}

export interface IVendorDisputeRepository {
    findById(id: string, tenantId: string): Promise<VendorDispute | null>;
    findByNumber(disputeNumber: string, tenantId: string): Promise<VendorDispute | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorDispute[]>;
    findByAssignment(assignmentId: string, tenantId: string): Promise<VendorDispute[]>;
    findByPayable(payableId: string, tenantId: string): Promise<VendorDispute[]>;
    findAll(
        tenantId: string,
        filters?: DisputeFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorDispute[]>;
    count(tenantId: string, filters?: DisputeFilters): Promise<number>;
    save(dispute: VendorDispute): Promise<VendorDispute>;
    update(dispute: VendorDispute): Promise<VendorDispute>;
    updateStatus(id: string, tenantId: string, status: DisputeStatus): Promise<void>;
    resolve(
        id: string,
        tenantId: string,
        status: DisputeStatus,
        resolutionNotes: string,
        resolvedBy: string,
        adjustmentAmount?: number
    ): Promise<void>;
    findOpen(tenantId: string): Promise<VendorDispute[]>;
    getSummary(tenantId: string): Promise<DisputeSummary>;
}
