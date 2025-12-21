// application/services/hrms/LeaveService.ts
// Leave management business logic

import {
  LeaveRequest,
  LeaveBalance,
  createLeaveRequest,
  calculateLeaveDays,
  isInBlackoutPeriod,
  canApprove,
  getAvailableBalance,
} from '../../../domain/entities/hrms/Leave';
import {
  ILeaveRepository,
  LeaveRequestFilters,
} from '../../../domain/interfaces/hrms/ILeaveRepository';
import {
  CreateLeaveRequestDTO,
  LeaveActionDTO,
  LeaveRequestResponseDTO,
  LeaveBalanceResponseDTO,
  LeaveSummaryDTO,
  LEAVE_STATUS_LABELS,
} from '../../dtos/hrms/LeaveDTO';

export class LeaveService {
  constructor(
    private leaveRepo: ILeaveRepository
  ) {}

  async createRequest(
    employeeId: string,
    dto: CreateLeaveRequestDTO,
    tenantId: string
  ): Promise<LeaveRequestResponseDTO> {
    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);

    // Validate dates
    if (fromDate > toDate) {
      throw new Error('From date must be before to date');
    }

    // Get leave type
    const leaveType = await this.leaveRepo.findTypeById(dto.leaveTypeId, tenantId);
    if (!leaveType || !leaveType.isActive) {
      throw new Error('Invalid leave type');
    }

    // Check blackout periods
    if (isInBlackoutPeriod(fromDate, toDate, leaveType.blackoutPeriods)) {
      throw new Error('Cannot apply leave during blackout period');
    }

    // Calculate days
    const totalDays = calculateLeaveDays(fromDate, toDate, dto.isHalfDay);

    // Check balance
    const balance = await this.leaveRepo.findBalance(
      employeeId,
      dto.leaveTypeId,
      fromDate.getFullYear(),
      tenantId
    );

    if (!balance || getAvailableBalance(balance) < totalDays) {
      throw new Error('Insufficient leave balance');
    }

    // Check overlapping requests
    const overlapping = await this.leaveRepo.findOverlapping(
      employeeId,
      fromDate,
      toDate,
      tenantId
    );

    if (overlapping.length > 0) {
      throw new Error('Leave request overlaps with existing request');
    }

    // Create request
    const requestData = createLeaveRequest({
      tenantId,
      employeeId,
      leaveTypeId: dto.leaveTypeId,
      fromDate,
      toDate,
      totalDays,
      isHalfDay: dto.isHalfDay,
      halfDayType: dto.halfDayType,
      reason: dto.reason,
      approvalChain: [], // TODO: Build from approval chain config
      hasConflict: false,
      conflictingTrips: [], // TODO: Check trip conflicts
      replacementEmployeeId: dto.replacementEmployeeId,
      replacementConfirmed: false,
      attachments: dto.attachments || [],
    });

    const request = await this.leaveRepo.createRequest(requestData);

    // Update balance pending count
    await this.leaveRepo.updateBalance(balance.id, {
      pending: balance.pending + totalDays,
      updatedAt: new Date(),
    });

    return this.toRequestResponseDTO(request, leaveType.name, leaveType.isPaid);
  }

  async processAction(
    requestId: string,
    dto: LeaveActionDTO,
    approverId: string,
    tenantId: string
  ): Promise<LeaveRequestResponseDTO> {
    const request = await this.leaveRepo.findRequestById(requestId, tenantId);
    if (!request) {
      throw new Error('Leave request not found');
    }

    if (!canApprove(request, approverId)) {
      throw new Error('You are not authorized to approve this request');
    }

    // Update approval chain
    const updatedChain = request.approvalChain.map((step, index) => {
      if (index === request.currentApproverIndex) {
        return {
          ...step,
          status: dto.action === 'approve' ? 'APPROVED' as const : 'REJECTED' as const,
          comment: dto.comment,
          actionAt: new Date(),
        };
      }
      return step;
    });

    // Determine final status
    let finalStatus = request.status;
    if (dto.action === 'reject') {
      finalStatus = 'REJECTED';
    } else if (request.currentApproverIndex === request.approvalChain.length - 1) {
      finalStatus = 'APPROVED';
    }

    const updated = await this.leaveRepo.updateRequest(requestId, {
      approvalChain: updatedChain,
      currentApproverIndex: dto.action === 'approve' 
        ? request.currentApproverIndex + 1 
        : request.currentApproverIndex,
      status: finalStatus,
      updatedAt: new Date(),
    });

    // Update balance if approved/rejected
    if (finalStatus === 'APPROVED' || finalStatus === 'REJECTED') {
      const balance = await this.leaveRepo.findBalance(
        request.employeeId,
        request.leaveTypeId,
        request.fromDate.getFullYear(),
        tenantId
      );

      if (balance) {
        if (finalStatus === 'APPROVED') {
          await this.leaveRepo.updateBalance(balance.id, {
            pending: balance.pending - request.totalDays,
            taken: balance.taken + request.totalDays,
            updatedAt: new Date(),
          });
        } else {
          await this.leaveRepo.updateBalance(balance.id, {
            pending: balance.pending - request.totalDays,
            updatedAt: new Date(),
          });
        }
      }
    }

    const leaveType = await this.leaveRepo.findTypeById(request.leaveTypeId, tenantId);
    return this.toRequestResponseDTO(updated, leaveType?.name || '', leaveType?.isPaid || false);
  }

  async cancelRequest(
    requestId: string,
    reason: string,
    tenantId: string
  ): Promise<void> {
    const request = await this.leaveRepo.findRequestById(requestId, tenantId);
    if (!request) {
      throw new Error('Leave request not found');
    }

    if (!['DRAFT', 'PENDING'].includes(request.status)) {
      throw new Error('Can only cancel draft or pending requests');
    }

    await this.leaveRepo.updateRequest(requestId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date(),
    });

    // Restore balance
    const balance = await this.leaveRepo.findBalance(
      request.employeeId,
      request.leaveTypeId,
      request.fromDate.getFullYear(),
      tenantId
    );

    if (balance) {
      await this.leaveRepo.updateBalance(balance.id, {
        pending: balance.pending - request.totalDays,
        updatedAt: new Date(),
      });
    }
  }

  async getEmployeeRequests(
    employeeId: string,
    tenantId: string,
    year?: number
  ): Promise<LeaveRequestResponseDTO[]> {
    const filters: LeaveRequestFilters = { employeeId };
    if (year) {
      filters.dateFrom = new Date(year, 0, 1);
      filters.dateTo = new Date(year, 11, 31);
    }

    const requests = await this.leaveRepo.findAllRequests(tenantId, filters);
    
    // TODO: Batch fetch leave types
    return Promise.all(
      requests.map(async (r) => {
        const leaveType = await this.leaveRepo.findTypeById(r.leaveTypeId, tenantId);
        return this.toRequestResponseDTO(r, leaveType?.name || '', leaveType?.isPaid || false);
      })
    );
  }

  async getPendingApprovals(
    approverId: string,
    tenantId: string
  ): Promise<LeaveRequestResponseDTO[]> {
    const requests = await this.leaveRepo.findPendingForApprover(approverId, tenantId);
    
    return Promise.all(
      requests.map(async (r) => {
        const leaveType = await this.leaveRepo.findTypeById(r.leaveTypeId, tenantId);
        return this.toRequestResponseDTO(r, leaveType?.name || '', leaveType?.isPaid || false);
      })
    );
  }

  async getBalances(
    employeeId: string,
    year: number,
    tenantId: string
  ): Promise<LeaveBalanceResponseDTO[]> {
    const balances = await this.leaveRepo.findAllBalances(employeeId, year, tenantId);
    
    return Promise.all(
      balances.map(async (b) => {
        const leaveType = await this.leaveRepo.findTypeById(b.leaveTypeId, tenantId);
        return this.toBalanceResponseDTO(b, leaveType?.name || '', leaveType?.isPaid || false);
      })
    );
  }

  async getSummary(
    employeeId: string,
    year: number,
    tenantId: string
  ): Promise<LeaveSummaryDTO> {
    const balances = await this.getBalances(employeeId, year, tenantId);
    
    const requests = await this.leaveRepo.findAllRequests(tenantId, {
      employeeId,
      status: 'APPROVED',
      dateFrom: new Date(),
    });

    return {
      employeeId,
      year,
      balances,
      totalAvailable: balances.reduce((sum, b) => sum + b.available, 0),
      totalTaken: balances.reduce((sum, b) => sum + b.taken, 0),
      totalPending: balances.reduce((sum, b) => sum + b.pending, 0),
      upcomingLeaves: requests.slice(0, 5).map(r => ({
        fromDate: r.fromDate.toISOString().split('T')[0],
        toDate: r.toDate.toISOString().split('T')[0],
        type: '', // TODO: Get type name
        days: r.totalDays,
      })),
    };
  }

  // Mappers
  private toRequestResponseDTO(
    request: LeaveRequest,
    leaveTypeName: string,
    isPaid: boolean
  ): LeaveRequestResponseDTO {
    return {
      id: request.id,
      employeeId: request.employeeId,
      employeeName: '', // TODO: Resolve
      employeeCode: '',
      leaveType: {
        id: request.leaveTypeId,
        code: '',
        name: leaveTypeName,
        isPaid,
      },
      fromDate: request.fromDate.toISOString().split('T')[0],
      toDate: request.toDate.toISOString().split('T')[0],
      totalDays: request.totalDays,
      isHalfDay: request.isHalfDay,
      halfDayType: request.halfDayType,
      reason: request.reason,
      status: request.status,
      statusLabel: LEAVE_STATUS_LABELS[request.status],
      approvalChain: request.approvalChain.map(s => ({
        approverName: s.approverName,
        status: s.status,
        comment: s.comment,
        actionAt: s.actionAt?.toISOString(),
      })),
      currentApprover: request.approvalChain[request.currentApproverIndex]?.approverName,
      hasConflict: request.hasConflict,
      conflictingTrips: request.conflictingTrips.map(id => ({
        tripId: id,
        tripName: '', // TODO: Resolve
        dates: '',
      })),
      replacementEmployee: request.replacementEmployeeId 
        ? { id: request.replacementEmployeeId, name: '' } 
        : undefined,
      attachments: request.attachments,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }

  private toBalanceResponseDTO(
    balance: LeaveBalance,
    leaveTypeName: string,
    isPaid: boolean
  ): LeaveBalanceResponseDTO {
    const available = getAvailableBalance(balance);
    const total = balance.opening + balance.accrued + balance.carryForward + balance.adjusted;

    return {
      leaveType: {
        id: balance.leaveTypeId,
        code: '',
        name: leaveTypeName,
        isPaid,
      },
      year: balance.year,
      opening: balance.opening,
      accrued: balance.accrued,
      taken: balance.taken,
      pending: balance.pending,
      adjusted: balance.adjusted,
      carryForward: balance.carryForward,
      available,
      usedPercentage: total > 0 ? (balance.taken / total) * 100 : 0,
    };
  }
}
