import { GearAssignment, GearAssignmentProps, GearAssignmentType, GearAssignmentStatus } from '../../../domain/entities/gear/GearAssignment.js';
import { GearAssignmentRepository } from '../../../infrastructure/repositories/gear/GearAssignmentRepository.js';
import { GearInventoryRepository } from '../../../infrastructure/repositories/gear/GearInventoryRepository.js';
import { GearItemRepository } from '../../../infrastructure/repositories/gear/GearItemRepository.js';
import { GearAssignmentFilters } from '../../../domain/interfaces/gear/IGearAssignmentRepository.js';
import { ValidationError, NotFoundError } from '../../../shared/errors/index.js';
import { PaginatedResult, Pagination } from '../../../shared/types/index.js';

export interface CreateGearAssignmentDTO {
    tripId: string;
    bookingId?: string;
    gearItemId: string;
    assignmentType: GearAssignmentType;
    assignedToUserId?: string;
    assignedToGuestId?: string;
    assignedToName?: string;
    plannedIssueDate?: Date;
    plannedReturnDate?: Date;
    notes?: string;
}

export interface IssueGearDTO {
    assignmentId: string;
    issueNotes?: string;
    issueCondition?: string;
    checklistData?: Record<string, unknown>;
    gpsCoordinates?: string;
    signatureData?: string;
    photos?: string[];
}

export interface ReturnGearDTO {
    assignmentId: string;
    returnNotes?: string;
    returnCondition?: string;
    returnConditionScore?: number;
    hasDamage?: boolean;
    damageDescription?: string;
    photos?: string[];
}

export interface TripGearManifest {
    tripId: string;
    assignments: GearAssignment[];
    byType: Record<GearAssignmentType, GearAssignment[]>;
    totalItems: number;
    issuedCount: number;
    returnedCount: number;
    pendingIssue: number;
    pendingReturn: number;
}

export class GearAssignmentService {
    constructor(
        private assignmentRepository: GearAssignmentRepository,
        private inventoryRepository: GearInventoryRepository,
        private itemRepository: GearItemRepository
    ) {}

    async createAssignment(
        dto: CreateGearAssignmentDTO,
        tenantId: string,
        userId: string
    ): Promise<GearAssignment> {
        // Validate gear item exists and is available
        const item = await this.itemRepository.findById(dto.gearItemId, tenantId);
        if (!item) {
            throw new NotFoundError('Gear item not found');
        }

        // Check if item is safe for assignment
        if (!item.isSafeForAssignment()) {
            throw new ValidationError(`Gear item ${item.sku} is not safe for assignment`);
        }

        // Check current inventory status
        const inventory = await this.inventoryRepository.findByGearItemId(dto.gearItemId, tenantId);
        if (!inventory || !inventory.canBeAssigned()) {
            throw new ValidationError(`Gear item ${item.sku} is not available for assignment`);
        }

        // Check for existing active assignment
        const existingActive = await this.assignmentRepository.findActiveByGearItem(dto.gearItemId, tenantId);
        if (existingActive) {
            throw new ValidationError(`Gear item ${item.sku} is already assigned to another trip`);
        }

        // Create assignment
        const assignment = GearAssignment.create({
            tenantId,
            tripId: dto.tripId,
            bookingId: dto.bookingId,
            gearItemId: dto.gearItemId,
            assignmentType: dto.assignmentType,
            status: 'PLANNED',
            assignedToUserId: dto.assignedToUserId,
            assignedToGuestId: dto.assignedToGuestId,
            assignedToName: dto.assignedToName,
            assignedByUserId: userId,
            plannedIssueDate: dto.plannedIssueDate,
            plannedReturnDate: dto.plannedReturnDate,
            notes: dto.notes,
        });

        const saved = await this.assignmentRepository.save(assignment);

        // Update inventory status to reserved
        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId: dto.gearItemId,
            status: 'RESERVED',
            statusChangedBy: userId,
            statusReason: `Reserved for trip ${dto.tripId}`,
            tripId: dto.tripId,
            assignedToUserId: dto.assignedToUserId,
            assignedToGuestId: dto.assignedToGuestId,
        });

        return saved;
    }

    async createBulkAssignments(
        tripId: string,
        assignments: Omit<CreateGearAssignmentDTO, 'tripId'>[],
        tenantId: string,
        userId: string
    ): Promise<GearAssignment[]> {
        const results: GearAssignment[] = [];
        
        for (const dto of assignments) {
            try {
                const assignment = await this.createAssignment(
                    { ...dto, tripId },
                    tenantId,
                    userId
                );
                results.push(assignment);
            } catch (error) {
                // Log error but continue with other assignments
                console.error(`Failed to assign gear ${dto.gearItemId}:`, error);
            }
        }

        return results;
    }

    async issueGear(dto: IssueGearDTO, tenantId: string, userId: string): Promise<GearAssignment> {
        const assignment = await this.assignmentRepository.findById(dto.assignmentId, tenantId);
        if (!assignment) {
            throw new NotFoundError('Assignment not found');
        }

        if (!assignment.canBeIssued()) {
            throw new ValidationError('Assignment is not in a state that allows issuing');
        }

        // Issue the gear
        const issued = await this.assignmentRepository.issueGear(
            dto.assignmentId,
            tenantId,
            userId,
            dto.issueNotes,
            dto.issueCondition
        );

        // Update inventory status
        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId: assignment.gearItemId,
            status: 'IN_USE',
            statusChangedBy: userId,
            statusReason: 'Gear issued',
        });

        return issued;
    }

    async returnGear(dto: ReturnGearDTO, tenantId: string, userId: string): Promise<GearAssignment> {
        const assignment = await this.assignmentRepository.findById(dto.assignmentId, tenantId);
        if (!assignment) {
            throw new NotFoundError('Assignment not found');
        }

        if (!assignment.isPendingReturn()) {
            throw new ValidationError('Assignment is not pending return');
        }

        // TODO: Create damage report if hasDamage is true
        const damageReportId = dto.hasDamage ? undefined : undefined; // Placeholder

        // Return the gear
        const returned = await this.assignmentRepository.returnGear(
            dto.assignmentId,
            tenantId,
            userId,
            dto.returnNotes,
            dto.returnCondition,
            dto.returnConditionScore,
            damageReportId
        );

        // Update inventory status
        const newStatus = dto.hasDamage ? 'DAMAGED' : 'QUARANTINE';
        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId: assignment.gearItemId,
            status: newStatus,
            statusChangedBy: userId,
            statusReason: dto.hasDamage ? 'Returned with damage' : 'Returned, pending inspection',
            tripId: undefined,
            assignedToUserId: undefined,
            assignedToGuestId: undefined,
        });

        // Update usage stats on gear item
        if (assignment.actualIssueDate) {
            const tripDays = Math.ceil(
                (new Date().getTime() - assignment.actualIssueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            await this.itemRepository.updateUsageStats(assignment.gearItemId, tenantId, tripDays);
        }

        // Update gear condition if provided
        if (dto.returnCondition && dto.returnConditionScore) {
            await this.itemRepository.updateCondition(
                assignment.gearItemId,
                tenantId,
                dto.returnCondition as any,
                dto.returnConditionScore
            );
        }

        return returned;
    }

    async getTripManifest(tripId: string, tenantId: string): Promise<TripGearManifest> {
        const assignments = await this.assignmentRepository.findByTrip(tripId, tenantId);

        const byType: Record<GearAssignmentType, GearAssignment[]> = {
            PARTICIPANT: [],
            SHARED: [],
            GUIDE: [],
            EMERGENCY: [],
            SUPPORT: [],
        };

        let issuedCount = 0;
        let returnedCount = 0;
        let pendingIssue = 0;
        let pendingReturn = 0;

        for (const assignment of assignments) {
            byType[assignment.assignmentType].push(assignment);
            
            if (assignment.status === 'ISSUED' || assignment.status === 'IN_USE') {
                issuedCount++;
                pendingReturn++;
            } else if (assignment.status === 'RETURNED') {
                returnedCount++;
            } else if (assignment.status === 'PLANNED' || assignment.status === 'RESERVED') {
                pendingIssue++;
            }
        }

        return {
            tripId,
            assignments,
            byType,
            totalItems: assignments.length,
            issuedCount,
            returnedCount,
            pendingIssue,
            pendingReturn,
        };
    }

    async getByTrip(tripId: string, tenantId: string): Promise<GearAssignment[]> {
        return this.assignmentRepository.findByTrip(tripId, tenantId);
    }

    async getPendingReturns(tenantId: string): Promise<GearAssignment[]> {
        return this.assignmentRepository.findPendingReturns(tenantId);
    }

    async getOverdueReturns(tenantId: string): Promise<GearAssignment[]> {
        return this.assignmentRepository.findOverdue(tenantId);
    }

    async cancelAssignment(id: string, tenantId: string, userId: string): Promise<void> {
        const assignment = await this.assignmentRepository.findById(id, tenantId);
        if (!assignment) {
            throw new NotFoundError('Assignment not found');
        }

        if (assignment.status === 'ISSUED' || assignment.status === 'IN_USE') {
            throw new ValidationError('Cannot cancel assignment - gear already issued');
        }

        await this.assignmentRepository.updateStatus(id, tenantId, 'CANCELLED');

        // Release inventory
        await this.inventoryRepository.updateStatus(tenantId, {
            gearItemId: assignment.gearItemId,
            status: 'AVAILABLE',
            statusChangedBy: userId,
            statusReason: 'Assignment cancelled',
            tripId: undefined,
            assignedToUserId: undefined,
            assignedToGuestId: undefined,
        });
    }
}
