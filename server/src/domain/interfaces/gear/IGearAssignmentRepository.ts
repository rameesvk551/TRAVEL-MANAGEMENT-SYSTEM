import { GearAssignment, GearAssignmentStatus, GearAssignmentType } from '../../entities/gear/GearAssignment.js';

export interface GearAssignmentFilters {
    tripId?: string;
    bookingId?: string;
    gearItemId?: string;
    assignmentType?: GearAssignmentType;
    status?: GearAssignmentStatus | GearAssignmentStatus[];
    assignedToUserId?: string;
    assignedToGuestId?: string;
    pendingReturn?: boolean;
    overdue?: boolean;
}

export interface IGearAssignmentRepository {
    findById(id: string, tenantId: string): Promise<GearAssignment | null>;
    findAll(
        tenantId: string,
        filters?: GearAssignmentFilters,
        limit?: number,
        offset?: number
    ): Promise<GearAssignment[]>;
    findByTrip(tripId: string, tenantId: string): Promise<GearAssignment[]>;
    findByBooking(bookingId: string, tenantId: string): Promise<GearAssignment[]>;
    findByGearItem(gearItemId: string, tenantId: string): Promise<GearAssignment[]>;
    findActiveByGearItem(gearItemId: string, tenantId: string): Promise<GearAssignment | null>;
    findPendingReturns(tenantId: string): Promise<GearAssignment[]>;
    findOverdue(tenantId: string): Promise<GearAssignment[]>;
    count(tenantId: string, filters?: GearAssignmentFilters): Promise<number>;
    save(assignment: GearAssignment): Promise<GearAssignment>;
    saveMany(assignments: GearAssignment[]): Promise<GearAssignment[]>;
    update(assignment: GearAssignment): Promise<GearAssignment>;
    updateStatus(
        id: string,
        tenantId: string,
        status: GearAssignmentStatus
    ): Promise<void>;
    issueGear(
        id: string,
        tenantId: string,
        issuedByUserId: string,
        issueNotes?: string,
        issueCondition?: string
    ): Promise<GearAssignment>;
    returnGear(
        id: string,
        tenantId: string,
        receivedByUserId: string,
        returnNotes?: string,
        returnCondition?: string,
        returnConditionScore?: number,
        damageReportId?: string
    ): Promise<GearAssignment>;
}
