import { VendorAssignment, AssignmentStatus } from '../../entities/vendor/index.js';

export interface AssignmentFilters {
    vendorId?: string;
    bookingId?: string;
    resourceId?: string;
    departureId?: string;
    status?: AssignmentStatus;
    serviceDateFrom?: Date;
    serviceDateTo?: Date;
}

export interface IVendorAssignmentRepository {
    findById(id: string, tenantId: string): Promise<VendorAssignment | null>;
    findByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]>;
    findByBooking(bookingId: string, tenantId: string): Promise<VendorAssignment[]>;
    findByDeparture(departureId: string, tenantId: string): Promise<VendorAssignment[]>;
    findAll(
        tenantId: string,
        filters?: AssignmentFilters,
        limit?: number,
        offset?: number
    ): Promise<VendorAssignment[]>;
    count(tenantId: string, filters?: AssignmentFilters): Promise<number>;
    save(assignment: VendorAssignment): Promise<VendorAssignment>;
    update(assignment: VendorAssignment): Promise<VendorAssignment>;
    updateStatus(id: string, tenantId: string, status: AssignmentStatus): Promise<void>;
    findUpcoming(tenantId: string, daysAhead: number): Promise<VendorAssignment[]>;
    findPendingByVendor(vendorId: string, tenantId: string): Promise<VendorAssignment[]>;
}
