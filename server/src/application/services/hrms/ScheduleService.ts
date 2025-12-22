// application/services/hrms/ScheduleService.ts
// Schedule Service Implementation

import type { 
  IScheduleRepository, 
  ShiftFilters, 
  RosterFilters 
} from '../../../domain/interfaces/hrms/IScheduleRepository';
import type { Shift, Roster, RosterEntry, WorkPattern, ShiftSwapRequest } from '../../../domain/entities/hrms/Schedule';
import type {
  CreateShiftDTO,
  UpdateShiftDTO,
  ShiftFiltersDTO,
  ShiftResponseDTO,
  CreateWorkPatternDTO,
  UpdateWorkPatternDTO,
  WorkPatternResponseDTO,
  CreateRosterDTO,
  UpdateRosterDTO,
  RosterFiltersDTO,
  RosterResponseDTO,
  CreateRosterEntryDTO,
  BulkRosterEntryDTO,
  UpdateRosterEntryDTO,
  RosterEntryResponseDTO,
  CreateSwapRequestDTO,
  SwapRequestResponseDTO,
  GenerateRosterDTO,
} from '../../dtos/hrms/ScheduleDTO';
import { ScheduleMapper } from '../../dtos/hrms/ScheduleDTO';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/errors/AppError';

export class ScheduleService {
  constructor(private scheduleRepository: IScheduleRepository) {}

  // ===== SHIFTS =====
  async getShiftById(id: string): Promise<ShiftResponseDTO> {
    const shift = await this.scheduleRepository.findShiftById(id);
    if (!shift) {
      throw new NotFoundError('Shift not found');
    }
    return ScheduleMapper.toShiftResponseDTO(shift);
  }

  async getAllShifts(tenantId: string, filters: ShiftFiltersDTO): Promise<ShiftResponseDTO[]> {
    const repoFilters: ShiftFilters = {
      tenantId,
      type: filters.type,
      isActive: filters.isActive,
    };
    const shifts = await this.scheduleRepository.findAllShifts(repoFilters);
    return shifts.map(ScheduleMapper.toShiftResponseDTO);
  }

  async createShift(tenantId: string, dto: CreateShiftDTO): Promise<ShiftResponseDTO> {
    const shift: Omit<Shift, 'id'> = {
      tenantId,
      name: dto.name,
      code: dto.code,
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      breakDuration: dto.breakDuration,
      workHours: dto.workHours,
      isOvernight: dto.isOvernight || false,
      color: dto.color || '#3B82F6',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await this.scheduleRepository.createShift(shift);
    return ScheduleMapper.toShiftResponseDTO(created);
  }

  async updateShift(id: string, dto: UpdateShiftDTO): Promise<ShiftResponseDTO> {
    const existing = await this.scheduleRepository.findShiftById(id);
    if (!existing) {
      throw new NotFoundError('Shift not found');
    }
    const updated = await this.scheduleRepository.updateShift(id, dto);
    if (!updated) {
      throw new NotFoundError('Failed to update shift');
    }
    return ScheduleMapper.toShiftResponseDTO(updated);
  }

  async deleteShift(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findShiftById(id);
    if (!existing) {
      throw new NotFoundError('Shift not found');
    }
    await this.scheduleRepository.deleteShift(id);
  }

  // ===== WORK PATTERNS =====
  async getWorkPatternById(id: string): Promise<WorkPatternResponseDTO> {
    const pattern = await this.scheduleRepository.findWorkPatternById(id);
    if (!pattern) {
      throw new NotFoundError('Work pattern not found');
    }
    return ScheduleMapper.toWorkPatternResponseDTO(pattern);
  }

  async getAllWorkPatterns(tenantId: string): Promise<WorkPatternResponseDTO[]> {
    const patterns = await this.scheduleRepository.findAllWorkPatterns(tenantId);
    return patterns.map(ScheduleMapper.toWorkPatternResponseDTO);
  }

  async createWorkPattern(tenantId: string, dto: CreateWorkPatternDTO): Promise<WorkPatternResponseDTO> {
    const pattern: Omit<WorkPattern, 'id'> = {
      tenantId,
      name: dto.name,
      description: dto.description,
      pattern: dto.pattern,
      isRotating: dto.isRotating || false,
      rotationWeeks: dto.rotationWeeks || 1,
      isDefault: dto.isDefault || false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await this.scheduleRepository.createWorkPattern(pattern);
    return ScheduleMapper.toWorkPatternResponseDTO(created);
  }

  async updateWorkPattern(id: string, dto: UpdateWorkPatternDTO): Promise<WorkPatternResponseDTO> {
    const existing = await this.scheduleRepository.findWorkPatternById(id);
    if (!existing) {
      throw new NotFoundError('Work pattern not found');
    }
    const updated = await this.scheduleRepository.updateWorkPattern(id, dto);
    if (!updated) {
      throw new NotFoundError('Failed to update work pattern');
    }
    return ScheduleMapper.toWorkPatternResponseDTO(updated);
  }

  async deleteWorkPattern(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findWorkPatternById(id);
    if (!existing) {
      throw new NotFoundError('Work pattern not found');
    }
    await this.scheduleRepository.deleteWorkPattern(id);
  }

  // ===== ROSTERS =====
  async getRosterById(id: string): Promise<RosterResponseDTO> {
    const roster = await this.scheduleRepository.findRosterById(id);
    if (!roster) {
      throw new NotFoundError('Roster not found');
    }
    return ScheduleMapper.toRosterResponseDTO(roster);
  }

  async getAllRosters(tenantId: string, filters: RosterFiltersDTO): Promise<RosterResponseDTO[]> {
    const repoFilters: RosterFilters = {
      tenantId,
      status: filters.status,
      branchId: filters.branchId,
    };
    const rosters = await this.scheduleRepository.findAllRosters(repoFilters);
    return rosters.map(ScheduleMapper.toRosterResponseDTO);
  }

  async getCurrentRoster(tenantId: string, branchId?: string): Promise<RosterResponseDTO | null> {
    const roster = await this.scheduleRepository.findCurrentRoster(tenantId, branchId);
    return roster ? ScheduleMapper.toRosterResponseDTO(roster) : null;
  }

  async createRoster(tenantId: string, userId: string, dto: CreateRosterDTO): Promise<RosterResponseDTO> {
    const roster: Omit<Roster, 'id'> = {
      tenantId,
      name: dto.name,
      description: dto.description,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      branchId: dto.branchId,
      departmentId: dto.departmentId,
      status: 'DRAFT',
      entries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };
    const created = await this.scheduleRepository.createRoster(roster);
    return ScheduleMapper.toRosterResponseDTO(created);
  }

  async updateRoster(id: string, dto: UpdateRosterDTO): Promise<RosterResponseDTO> {
    const existing = await this.scheduleRepository.findRosterById(id);
    if (!existing) {
      throw new NotFoundError('Roster not found');
    }
    if (existing.status === 'PUBLISHED' && dto.status !== 'ARCHIVED') {
      throw new ValidationError('Cannot modify a published roster');
    }
    const updated = await this.scheduleRepository.updateRoster(id, dto);
    if (!updated) {
      throw new NotFoundError('Failed to update roster');
    }
    return ScheduleMapper.toRosterResponseDTO(updated);
  }

  async publishRoster(id: string, publisherId: string): Promise<RosterResponseDTO> {
    const existing = await this.scheduleRepository.findRosterById(id);
    if (!existing) {
      throw new NotFoundError('Roster not found');
    }
    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Can only publish draft rosters');
    }
    if (existing.entries.length === 0) {
      throw new ValidationError('Cannot publish empty roster');
    }
    const published = await this.scheduleRepository.publishRoster(id, publisherId);
    if (!published) {
      throw new NotFoundError('Failed to publish roster');
    }
    return ScheduleMapper.toRosterResponseDTO(published);
  }

  async deleteRoster(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findRosterById(id);
    if (!existing) {
      throw new NotFoundError('Roster not found');
    }
    if (existing.status === 'PUBLISHED') {
      throw new ValidationError('Cannot delete a published roster');
    }
    await this.scheduleRepository.deleteRoster(id);
  }

  // ===== ROSTER ENTRIES =====
  async getRosterEntryById(id: string): Promise<RosterEntryResponseDTO> {
    const entry = await this.scheduleRepository.findRosterEntryById(id);
    if (!entry) {
      throw new NotFoundError('Roster entry not found');
    }
    return ScheduleMapper.toRosterEntryResponseDTO(entry);
  }

  async getEmployeeSchedule(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<RosterEntryResponseDTO[]> {
    const entries = await this.scheduleRepository.findRosterEntriesByEmployee(
      employeeId,
      new Date(startDate),
      new Date(endDate)
    );
    return entries.map(ScheduleMapper.toRosterEntryResponseDTO);
  }

  async getScheduleByDate(
    tenantId: string,
    date: string,
    branchId?: string
  ): Promise<RosterEntryResponseDTO[]> {
    const entries = await this.scheduleRepository.findRosterEntriesByDate(
      tenantId,
      new Date(date),
      branchId
    );
    return entries.map(ScheduleMapper.toRosterEntryResponseDTO);
  }

  async createRosterEntry(tenantId: string, dto: CreateRosterEntryDTO): Promise<RosterEntryResponseDTO> {
    const entry: Omit<RosterEntry, 'id'> = {
      tenantId,
      employeeId: dto.employeeId,
      date: new Date(dto.date),
      shiftId: dto.shiftId,
      status: 'SCHEDULED',
      notes: dto.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const created = await this.scheduleRepository.createRosterEntry(entry);
    return ScheduleMapper.toRosterEntryResponseDTO(created);
  }

  async createBulkRosterEntries(
    tenantId: string,
    dto: BulkRosterEntryDTO
  ): Promise<RosterEntryResponseDTO[]> {
    const entries: Omit<RosterEntry, 'id'>[] = dto.entries.map(e => ({
      tenantId,
      employeeId: e.employeeId,
      date: new Date(e.date),
      shiftId: e.shiftId,
      status: 'SCHEDULED',
      notes: e.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const created = await this.scheduleRepository.createRosterEntriesBulk(entries);
    return created.map(ScheduleMapper.toRosterEntryResponseDTO);
  }

  async updateRosterEntry(id: string, dto: UpdateRosterEntryDTO): Promise<RosterEntryResponseDTO> {
    const existing = await this.scheduleRepository.findRosterEntryById(id);
    if (!existing) {
      throw new NotFoundError('Roster entry not found');
    }
    const updated = await this.scheduleRepository.updateRosterEntry(id, dto);
    if (!updated) {
      throw new NotFoundError('Failed to update roster entry');
    }
    return ScheduleMapper.toRosterEntryResponseDTO(updated);
  }

  async deleteRosterEntry(id: string): Promise<void> {
    const existing = await this.scheduleRepository.findRosterEntryById(id);
    if (!existing) {
      throw new NotFoundError('Roster entry not found');
    }
    await this.scheduleRepository.deleteRosterEntry(id);
  }

  // ===== SHIFT SWAP =====
  async getSwapRequestById(id: string): Promise<SwapRequestResponseDTO> {
    const request = await this.scheduleRepository.findSwapRequestById(id);
    if (!request) {
      throw new NotFoundError('Shift swap request not found');
    }
    return ScheduleMapper.toSwapRequestResponseDTO(request);
  }

  async getPendingSwapRequests(tenantId: string): Promise<SwapRequestResponseDTO[]> {
    const requests = await this.scheduleRepository.findPendingSwapRequests(tenantId);
    return requests.map(ScheduleMapper.toSwapRequestResponseDTO);
  }

  async getEmployeeSwapRequests(employeeId: string): Promise<SwapRequestResponseDTO[]> {
    const requests = await this.scheduleRepository.findSwapRequestsByEmployee(employeeId);
    return requests.map(ScheduleMapper.toSwapRequestResponseDTO);
  }

  async createSwapRequest(
    tenantId: string,
    requesterId: string,
    dto: CreateSwapRequestDTO
  ): Promise<SwapRequestResponseDTO> {
    // Validate the requester owns the source entry
    const requesterEntry = await this.scheduleRepository.findRosterEntryById(dto.requesterRosterEntryId);
    if (!requesterEntry || requesterEntry.employeeId !== requesterId) {
      throw new ForbiddenError('You can only request swaps for your own shifts');
    }

    // Validate target entry exists and belongs to target employee
    const targetEntry = await this.scheduleRepository.findRosterEntryById(dto.targetRosterEntryId);
    if (!targetEntry || targetEntry.employeeId !== dto.targetEmployeeId) {
      throw new ValidationError('Invalid target roster entry');
    }

    const request: Omit<ShiftSwapRequest, 'id'> = {
      tenantId,
      requesterId,
      requesterRosterEntryId: dto.requesterRosterEntryId,
      targetEmployeeId: dto.targetEmployeeId,
      targetRosterEntryId: dto.targetRosterEntryId,
      reason: dto.reason,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await this.scheduleRepository.createSwapRequest(request);
    return ScheduleMapper.toSwapRequestResponseDTO(created);
  }

  async approveSwapRequest(id: string, approverId: string): Promise<SwapRequestResponseDTO> {
    const existing = await this.scheduleRepository.findSwapRequestById(id);
    if (!existing) {
      throw new NotFoundError('Shift swap request not found');
    }
    if (existing.status !== 'PENDING') {
      throw new ValidationError('Can only approve pending swap requests');
    }
    const approved = await this.scheduleRepository.approveSwapRequest(id, approverId);
    if (!approved) {
      throw new NotFoundError('Failed to approve swap request');
    }
    return ScheduleMapper.toSwapRequestResponseDTO(approved);
  }

  async rejectSwapRequest(id: string, reason: string): Promise<SwapRequestResponseDTO> {
    const existing = await this.scheduleRepository.findSwapRequestById(id);
    if (!existing) {
      throw new NotFoundError('Shift swap request not found');
    }
    if (existing.status !== 'PENDING') {
      throw new ValidationError('Can only reject pending swap requests');
    }
    const rejected = await this.scheduleRepository.rejectSwapRequest(id, reason);
    if (!rejected) {
      throw new NotFoundError('Failed to reject swap request');
    }
    return ScheduleMapper.toSwapRequestResponseDTO(rejected);
  }

  // ===== GENERATE ROSTER =====
  async generateRosterFromPattern(
    tenantId: string,
    dto: GenerateRosterDTO
  ): Promise<RosterEntryResponseDTO[]> {
    const entries = await this.scheduleRepository.generateRosterFromPattern(
      tenantId,
      dto.patternId,
      dto.employeeIds,
      new Date(dto.startDate),
      new Date(dto.endDate)
    );
    return entries.map(ScheduleMapper.toRosterEntryResponseDTO);
  }
}
