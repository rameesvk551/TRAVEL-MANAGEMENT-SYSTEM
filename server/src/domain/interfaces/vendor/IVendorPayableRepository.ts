import { VendorPayable, PayableStatus } from '../../entities/vendor/index.js';

export interface PayableFilters {
    vendorId?: string;
    assignmentId?: string;
    status?: PayableStatus;
    dueDateFrom?: Date;
    dueDateTo?: Date;
}

export interface PayableSummary {
    totalPending: number;
    totalApproved: number;
    totalSettled: number;
    totalOnHold: number;
    totalDisputed: number;
}

export interface IVendorPayableRepository {
    findById(id: string, tenantId: string): Promise<VendorPayable | null>;
    findByNumber(payableNumber: string, tenantId: string): Promise<VendorPayable | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]>;
    findByAssignment(assignmentId: string, tenantId: string): Promise<VendorPayable | null>;
    findAll(
        tenantId: string,
        filters?: PayableFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorPayable[]>;
    count(tenantId: string, filters?: PayableFilters): Promise<number>;
    save(payable: VendorPayable): Promise<VendorPayable>;
    update(payable: VendorPayable): Promise<VendorPayable>;
    updateStatus(id: string, tenantId: string, status: PayableStatus): Promise<void>;
    updateSettledAmount(id: string, tenantId: string, amount: number): Promise<void>;
    findOverdue(tenantId: string): Promise<VendorPayable[]>;
    findPendingByVendor(vendorId: string, tenantId: string): Promise<VendorPayable[]>;
    getSummary(tenantId: string): Promise<PayableSummary>;
    getVendorSummary(vendorId: string, tenantId: string): Promise<PayableSummary>;
}
