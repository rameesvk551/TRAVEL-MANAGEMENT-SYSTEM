// presentation/controllers/hrms/ScheduleController.ts
// Schedule Controller Implementation

import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../../../application/services/hrms/ScheduleService';
import type {
  CreateShiftDTO,
  UpdateShiftDTO,
  ShiftFiltersDTO,
  CreateWorkPatternDTO,
  UpdateWorkPatternDTO,
  CreateRosterDTO,
  UpdateRosterDTO,
  RosterFiltersDTO,
  CreateRosterEntryDTO,
  BulkRosterEntryDTO,
  UpdateRosterEntryDTO,
  CreateSwapRequestDTO,
  GenerateRosterDTO,
} from '../../../application/dtos/hrms/ScheduleDTO';

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  // ===== SHIFTS =====
  getShiftById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const shift = await this.scheduleService.getShiftById(id);
      res.json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  };

  getAllShifts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const filters: ShiftFiltersDTO = {
        type: req.query.type as ShiftFiltersDTO['type'],
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };
      const shifts = await this.scheduleService.getAllShifts(tenantId, filters);
      res.json({ success: true, data: shifts });
    } catch (error) {
      next(error);
    }
  };

  createShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const dto: CreateShiftDTO = req.body;
      const shift = await this.scheduleService.createShift(tenantId, dto);
      res.status(201).json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  };

  updateShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateShiftDTO = req.body;
      const shift = await this.scheduleService.updateShift(id, dto);
      res.json({ success: true, data: shift });
    } catch (error) {
      next(error);
    }
  };

  deleteShift = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteShift(id);
      res.json({ success: true, message: 'Shift deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ===== WORK PATTERNS =====
  getWorkPatternById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pattern = await this.scheduleService.getWorkPatternById(id);
      res.json({ success: true, data: pattern });
    } catch (error) {
      next(error);
    }
  };

  getAllWorkPatterns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const patterns = await this.scheduleService.getAllWorkPatterns(tenantId);
      res.json({ success: true, data: patterns });
    } catch (error) {
      next(error);
    }
  };

  createWorkPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const dto: CreateWorkPatternDTO = req.body;
      const pattern = await this.scheduleService.createWorkPattern(tenantId, dto);
      res.status(201).json({ success: true, data: pattern });
    } catch (error) {
      next(error);
    }
  };

  updateWorkPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateWorkPatternDTO = req.body;
      const pattern = await this.scheduleService.updateWorkPattern(id, dto);
      res.json({ success: true, data: pattern });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteWorkPattern(id);
      res.json({ success: true, message: 'Work pattern deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ===== ROSTERS =====
  getRosterById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const roster = await this.scheduleService.getRosterById(id);
      res.json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  };

  getAllRosters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const filters: RosterFiltersDTO = {
        status: req.query.status as RosterFiltersDTO['status'],
        branchId: req.query.branchId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      };
      const rosters = await this.scheduleService.getAllRosters(tenantId, filters);
      res.json({ success: true, data: rosters });
    } catch (error) {
      next(error);
    }
  };

  getCurrentRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const branchId = req.query.branchId as string | undefined;
      const roster = await this.scheduleService.getCurrentRoster(tenantId, branchId);
      res.json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  };

  createRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const userId = req.user?.id || '';
      const dto: CreateRosterDTO = req.body;
      const roster = await this.scheduleService.createRoster(tenantId, userId, dto);
      res.status(201).json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  };

  updateRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateRosterDTO = req.body;
      const roster = await this.scheduleService.updateRoster(id, dto);
      res.json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  };

  publishRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const publisherId = req.user?.id || '';
      const roster = await this.scheduleService.publishRoster(id, publisherId);
      res.json({ success: true, data: roster });
    } catch (error) {
      next(error);
    }
  };

  deleteRoster = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteRoster(id);
      res.json({ success: true, message: 'Roster deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ===== ROSTER ENTRIES =====
  getRosterEntryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const entry = await this.scheduleService.getRosterEntryById(id);
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeSchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const entries = await this.scheduleService.getEmployeeSchedule(
        employeeId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  getMySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId || '';
      const { startDate, endDate } = req.query;
      const entries = await this.scheduleService.getEmployeeSchedule(
        employeeId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  getScheduleByDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const { date, branchId } = req.query;
      const entries = await this.scheduleService.getScheduleByDate(
        tenantId,
        date as string,
        branchId as string | undefined
      );
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  createRosterEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const dto: CreateRosterEntryDTO = req.body;
      const entry = await this.scheduleService.createRosterEntry(tenantId, dto);
      res.status(201).json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  createBulkRosterEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const dto: BulkRosterEntryDTO = req.body;
      const entries = await this.scheduleService.createBulkRosterEntries(tenantId, dto);
      res.status(201).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  updateRosterEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateRosterEntryDTO = req.body;
      const entry = await this.scheduleService.updateRosterEntry(id, dto);
      res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };

  deleteRosterEntry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.scheduleService.deleteRosterEntry(id);
      res.json({ success: true, message: 'Roster entry deleted' });
    } catch (error) {
      next(error);
    }
  };

  // ===== SHIFT SWAP =====
  getSwapRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const request = await this.scheduleService.getSwapRequestById(id);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  };

  getPendingSwapRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const requests = await this.scheduleService.getPendingSwapRequests(tenantId);
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  };

  getMySwapRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId || '';
      const requests = await this.scheduleService.getEmployeeSwapRequests(employeeId);
      res.json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  };

  createSwapRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const requesterId = req.user?.employeeId || '';
      const dto: CreateSwapRequestDTO = req.body;
      const request = await this.scheduleService.createSwapRequest(tenantId, requesterId, dto);
      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  };

  approveSwapRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const approverId = req.user?.id || '';
      const request = await this.scheduleService.approveSwapRequest(id, approverId);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  };

  rejectSwapRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const request = await this.scheduleService.rejectSwapRequest(id, reason);
      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  };

  // ===== GENERATE ROSTER =====
  generateRosterFromPattern = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const dto: GenerateRosterDTO = req.body;
      const entries = await this.scheduleService.generateRosterFromPattern(tenantId, dto);
      res.status(201).json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };
}
