import { generateId } from '../../../shared/utils/index.js';

/**
 * Trip gear assignment type
 */
export type GearAssignmentType = 
    | 'PARTICIPANT'     // Assigned to trip participant
    | 'SHARED'          // Shared gear (tents, stoves)
    | 'GUIDE'           // Guide-specific gear
    | 'EMERGENCY'       // Emergency reserve
    | 'SUPPORT';        // Support/porter gear

/**
 * Assignment status - lifecycle of gear assignment
 */
export type GearAssignmentStatus = 
    | 'PLANNED'         // Planned for trip
    | 'RESERVED'        // Reserved, blocking availability
    | 'ISSUED'          // Checked out / issued
    | 'IN_USE'          // Actively in use on trip
    | 'RETURNED'        // Returned after trip
    | 'PARTIAL_RETURN'  // Partially returned
    | 'DAMAGED'         // Returned with damage
    | 'LOST'            // Not returned, reported lost
    | 'REPLACED'        // Replaced mid-trip
    | 'CANCELLED';      // Assignment cancelled

export interface GearAssignmentProps {
    id?: string;
    tenantId: string;
    tripId: string;
    bookingId?: string;
    gearItemId: string;
    assignmentType: GearAssignmentType;
    status: GearAssignmentStatus;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    assignedToName?: string;
    assignedByUserId?: string;
    plannedIssueDate?: Date;
    actualIssueDate?: Date;
    issuedByUserId?: string;
    issueNotes?: string;
    issueCondition?: string;
    plannedReturnDate?: Date;
    actualReturnDate?: Date;
    receivedByUserId?: string;
    returnNotes?: string;
    returnCondition?: string;
    returnConditionScore?: number;
    replacedByItemId?: string;
    replacementReason?: string;
    damageReportId?: string;
    checklistCompleted?: boolean;
    checklistData?: Record<string, unknown>;
    gpsCoordinates?: string;
    signatureData?: string;
    photos?: string[];
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * GearAssignment entity - tracks gear assignment to trips.
 * Supports full issue/return lifecycle with condition tracking.
 */
export class GearAssignment {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly tripId: string;
    public readonly bookingId?: string;
    public readonly gearItemId: string;
    public readonly assignmentType: GearAssignmentType;
    public readonly status: GearAssignmentStatus;
    public readonly assignedToUserId?: string;
    public readonly assignedToGuestId?: string;
    public readonly assignedToName?: string;
    public readonly assignedByUserId?: string;
    public readonly plannedIssueDate?: Date;
    public readonly actualIssueDate?: Date;
    public readonly issuedByUserId?: string;
    public readonly issueNotes: string;
    public readonly issueCondition: string;
    public readonly plannedReturnDate?: Date;
    public readonly actualReturnDate?: Date;
    public readonly receivedByUserId?: string;
    public readonly returnNotes: string;
    public readonly returnCondition: string;
    public readonly returnConditionScore: number;
    public readonly replacedByItemId?: string;
    public readonly replacementReason: string;
    public readonly damageReportId?: string;
    public readonly checklistCompleted: boolean;
    public readonly checklistData: Record<string, unknown>;
    public readonly gpsCoordinates?: string;
    public readonly signatureData?: string;
    public readonly photos: string[];
    public readonly notes: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: GearAssignmentProps) {
        Object.assign(this, props);
    }

    static create(props: GearAssignmentProps): GearAssignment {
        return new GearAssignment({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            tripId: props.tripId,
            bookingId: props.bookingId,
            gearItemId: props.gearItemId,
            assignmentType: props.assignmentType,
            status: props.status ?? 'PLANNED',
            assignedToUserId: props.assignedToUserId,
            assignedToGuestId: props.assignedToGuestId,
            assignedToName: props.assignedToName,
            assignedByUserId: props.assignedByUserId,
            plannedIssueDate: props.plannedIssueDate,
            actualIssueDate: props.actualIssueDate,
            issuedByUserId: props.issuedByUserId,
            issueNotes: props.issueNotes ?? '',
            issueCondition: props.issueCondition ?? '',
            plannedReturnDate: props.plannedReturnDate,
            actualReturnDate: props.actualReturnDate,
            receivedByUserId: props.receivedByUserId,
            returnNotes: props.returnNotes ?? '',
            returnCondition: props.returnCondition ?? '',
            returnConditionScore: props.returnConditionScore ?? 0,
            replacedByItemId: props.replacedByItemId,
            replacementReason: props.replacementReason ?? '',
            damageReportId: props.damageReportId,
            checklistCompleted: props.checklistCompleted ?? false,
            checklistData: props.checklistData ?? {},
            gpsCoordinates: props.gpsCoordinates,
            signatureData: props.signatureData,
            photos: props.photos ?? [],
            notes: props.notes ?? '',
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
        });
    }

    static fromPersistence(data: GearAssignmentProps): GearAssignment {
        return GearAssignment.create(data);
    }

    /**
     * Check if assignment can be issued
     */
    canBeIssued(): boolean {
        return this.status === 'PLANNED' || this.status === 'RESERVED';
    }

    /**
     * Check if assignment is active
     */
    isActive(): boolean {
        return ['ISSUED', 'IN_USE'].includes(this.status);
    }

    /**
     * Check if return is pending
     */
    isPendingReturn(): boolean {
        return this.status === 'ISSUED' || this.status === 'IN_USE';
    }

    /**
     * Get days overdue for return
     */
    getDaysOverdue(): number {
        if (!this.plannedReturnDate || this.actualReturnDate) return 0;
        const now = new Date();
        if (now <= this.plannedReturnDate) return 0;
        const diff = now.getTime() - this.plannedReturnDate.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
}
