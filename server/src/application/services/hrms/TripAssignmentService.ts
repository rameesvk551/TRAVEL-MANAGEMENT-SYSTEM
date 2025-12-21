// application/services/hrms/TripAssignmentService.ts
// Trip workforce management

import {
  TripAssignment,
  createTripAssignment,
  calculateTotalCompensation,
  canTransitionStatus,
  hasConflict,
} from '../../../domain/entities/hrms/TripAssignment';
import {
  ITripAssignmentRepository,
  TripAssignmentFilters,
  StaffAvailability,
} from '../../../domain/interfaces/hrms/ITripAssignmentRepository';
import {
  CreateTripAssignmentDTO,
  BulkAssignDTO,
  AssignmentActionDTO,
  CompleteAssignmentDTO,
  TripAssignmentResponseDTO,
  TripCrewDTO,
  AvailabilityCheckDTO,
  StaffSuggestionDTO,
  TRIP_ROLE_LABELS,
  ASSIGNMENT_STATUS_LABELS,
  COMPENSATION_TYPE_LABELS,
} from '../../dtos/hrms/TripAssignmentDTO';

export class TripAssignmentService {
  constructor(
    private assignmentRepo: ITripAssignmentRepository
  ) {}

  async assign(
    dto: CreateTripAssignmentDTO,
    tenantId: string,
    createdBy: string
  ): Promise<TripAssignmentResponseDTO> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Check availability
    const isAvailable = await this.assignmentRepo.checkAvailability(
      dto.employeeId,
      startDate,
      endDate,
      tenantId
    );

    if (!isAvailable) {
      throw new Error('Employee is not available for these dates');
    }

    // Calculate total days
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    const assignmentData = createTripAssignment({
      tenantId,
      tripId: dto.tripId,
      employeeId: dto.employeeId,
      role: dto.role,
      isPrimary: dto.isPrimary || false,
      startDate,
      endDate,
      totalDays,
      compensationType: dto.compensationType,
      tripBonus: dto.tripBonus,
      dailyRate: dto.dailyRate,
      specialInstructions: dto.specialInstructions,
      createdBy,
    });

    // Calculate total compensation
    const total = calculateTotalCompensation(assignmentData as TripAssignment);
    assignmentData.totalCompensation = total;

    const assignment = await this.assignmentRepo.create(assignmentData);
    return this.toResponseDTO(assignment);
  }

  async bulkAssign(
    dto: BulkAssignDTO,
    tenantId: string,
    createdBy: string
  ): Promise<TripAssignmentResponseDTO[]> {
    const results: TripAssignmentResponseDTO[] = [];

    for (const item of dto.assignments) {
      try {
        const result = await this.assign(
          {
            tripId: dto.tripId,
            employeeId: item.employeeId,
            role: item.role,
            isPrimary: item.isPrimary,
            startDate: '', // Will be fetched from trip
            endDate: '',
            compensationType: item.compensationType,
            tripBonus: item.tripBonus,
            dailyRate: item.dailyRate,
          },
          tenantId,
          createdBy
        );
        results.push(result);
      } catch (error) {
        // Log error but continue
        console.error(`Failed to assign ${item.employeeId}:`, error);
      }
    }

    return results;
  }

  async confirmOrDecline(
    assignmentId: string,
    dto: AssignmentActionDTO,
    tenantId: string
  ): Promise<TripAssignmentResponseDTO> {
    const assignment = await this.assignmentRepo.findById(assignmentId, tenantId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const targetStatus = dto.action === 'confirm' ? 'CONFIRMED' : 'DECLINED';

    if (!canTransitionStatus(assignment.status, targetStatus)) {
      throw new Error(`Cannot ${dto.action} assignment in current status`);
    }

    const updated = await this.assignmentRepo.update(assignmentId, {
      status: targetStatus,
      confirmedAt: dto.action === 'confirm' ? new Date() : undefined,
      declinedAt: dto.action === 'decline' ? new Date() : undefined,
      declinedReason: dto.reason,
      updatedAt: new Date(),
    });

    return this.toResponseDTO(updated);
  }

  async complete(
    assignmentId: string,
    dto: CompleteAssignmentDTO,
    tenantId: string
  ): Promise<TripAssignmentResponseDTO> {
    const assignment = await this.assignmentRepo.findById(assignmentId, tenantId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!canTransitionStatus(assignment.status, 'COMPLETED')) {
      throw new Error('Assignment cannot be completed in current status');
    }

    const updated = await this.assignmentRepo.update(assignmentId, {
      status: 'COMPLETED',
      rating: dto.rating,
      feedback: dto.feedback,
      incidentReports: dto.incidentReports || [],
      updatedAt: new Date(),
    });

    return this.toResponseDTO(updated);
  }

  async cancel(
    assignmentId: string,
    reason: string,
    tenantId: string
  ): Promise<void> {
    const assignment = await this.assignmentRepo.findById(assignmentId, tenantId);
    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!canTransitionStatus(assignment.status, 'CANCELLED')) {
      throw new Error('Assignment cannot be cancelled in current status');
    }

    await this.assignmentRepo.update(assignmentId, {
      status: 'CANCELLED',
      declinedReason: reason,
      updatedAt: new Date(),
    });
  }

  async getTripCrew(
    tripId: string,
    tenantId: string
  ): Promise<TripCrewDTO> {
    const assignments = await this.assignmentRepo.findByTrip(tripId, tenantId);

    const byRole: Record<string, number> = {};
    for (const a of assignments) {
      byRole[a.role] = (byRole[a.role] || 0) + 1;
    }

    return {
      tripId,
      tripName: assignments[0]?.tripName || '',
      dates: assignments.length > 0
        ? `${assignments[0].startDate.toLocaleDateString()} - ${assignments[0].endDate.toLocaleDateString()}`
        : '',
      crew: assignments.map(a => ({
        employeeId: a.employeeId,
        employeeName: a.employeeName || '',
        role: TRIP_ROLE_LABELS[a.role],
        isPrimary: a.isPrimary,
        status: a.status,
        phone: '', // TODO: Get from employee
      })),
      byRole,
      totalAssigned: assignments.length,
      confirmed: assignments.filter(a => a.status === 'CONFIRMED').length,
      pending: assignments.filter(a => a.status === 'PROPOSED').length,
      declined: assignments.filter(a => a.status === 'DECLINED').length,
    };
  }

  async getEmployeeUpcoming(
    employeeId: string,
    tenantId: string,
    limit = 5
  ): Promise<TripAssignmentResponseDTO[]> {
    const assignments = await this.assignmentRepo.findUpcoming(
      employeeId,
      tenantId,
      limit
    );
    return assignments.map(a => this.toResponseDTO(a));
  }

  async checkAvailability(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<AvailabilityCheckDTO> {
    const conflicts = await this.assignmentRepo.findConflicts(
      employeeId,
      startDate,
      endDate,
      tenantId
    );

    // TODO: Check leave conflicts

    return {
      employeeId,
      employeeName: '', // TODO: Resolve
      category: '',
      isAvailable: conflicts.length === 0,
      conflicts: conflicts.map(c => ({
        tripId: c.tripId,
        tripName: c.tripName || '',
        dates: `${c.startDate.toLocaleDateString()} - ${c.endDate.toLocaleDateString()}`,
        role: TRIP_ROLE_LABELS[c.role],
      })),
      leaveConflicts: [], // TODO: Get from leave service
      skills: [], // TODO: Get from employee
      recentTrips: 0, // TODO: Calculate
    };
  }

  async getStaffSuggestions(
    tripId: string,
    startDate: Date,
    endDate: Date,
    requiredRole: string,
    tenantId: string
  ): Promise<StaffSuggestionDTO> {
    const availableStaff = await this.assignmentRepo.getStaffAvailability(
      startDate,
      endDate,
      tenantId
    );

    // Filter by availability and sort by match score
    const suggestions = availableStaff
      .filter(s => s.isAvailable)
      .map(s => ({
        employee: {
          id: s.employeeId,
          name: s.employeeName,
          category: s.category,
        },
        matchScore: 0.8, // TODO: Calculate based on skills
        isAvailable: true,
        recentTripDays: 0, // TODO: Calculate
        skills: s.skills,
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return {
      forRole: requiredRole as any,
      suggestions,
    };
  }

  // Mappers
  private toResponseDTO(assignment: TripAssignment): TripAssignmentResponseDTO {
    return {
      id: assignment.id,
      trip: {
        id: assignment.tripId,
        name: assignment.tripName || '',
        type: '', // TODO: Get from trip
        startDate: assignment.startDate.toISOString().split('T')[0],
        endDate: assignment.endDate.toISOString().split('T')[0],
        totalGuests: 0,
      },
      employee: {
        id: assignment.employeeId,
        name: assignment.employeeName || '',
        code: '',
        category: '',
        phone: '',
      },
      role: assignment.role,
      roleLabel: TRIP_ROLE_LABELS[assignment.role],
      isPrimary: assignment.isPrimary,
      startDate: assignment.startDate.toISOString().split('T')[0],
      endDate: assignment.endDate.toISOString().split('T')[0],
      totalDays: assignment.totalDays,
      status: assignment.status,
      statusLabel: ASSIGNMENT_STATUS_LABELS[assignment.status],
      compensation: {
        type: assignment.compensationType,
        typeLabel: COMPENSATION_TYPE_LABELS[assignment.compensationType],
        tripBonus: assignment.tripBonus,
        dailyRate: assignment.dailyRate,
        totalAmount: assignment.totalCompensation || 0,
      },
      performance: assignment.rating
        ? { rating: assignment.rating, feedback: assignment.feedback }
        : undefined,
      specialInstructions: assignment.specialInstructions,
      createdAt: assignment.createdAt.toISOString(),
    };
  }
}
