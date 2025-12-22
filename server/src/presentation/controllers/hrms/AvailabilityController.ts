// presentation/controllers/hrms/AvailabilityController.ts
// Availability Controller Implementation

import { Request, Response, NextFunction } from 'express';
import { AvailabilityService } from '../../../application/services/hrms/AvailabilityService';
import type { 
  CreateAvailabilityDTO, 
  UpdateAvailabilityDTO,
  BulkAvailabilityDTO,
  CalendarQueryDTO,
  AvailableStaffQueryDTO 
} from '../../../application/dtos/hrms/AvailabilityDTO';

export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const availability = await this.availabilityService.getById(id);
      res.json({ success: true, data: availability });
    } catch (error) {
      next(error);
    }
  };

  getByEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const records = await this.availabilityService.getByEmployee(
        employeeId,
        startDate as string,
        endDate as string
      );
      res.json({ success: true, data: records });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const userId = req.user?.id || '';
      const dto: CreateAvailabilityDTO = req.body;
      const availability = await this.availabilityService.create(tenantId, userId, dto);
      res.status(201).json({ success: true, data: availability });
    } catch (error) {
      next(error);
    }
  };

  createBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const userId = req.user?.id || '';
      const dto: BulkAvailabilityDTO = req.body;
      const availabilities = await this.availabilityService.createBulk(tenantId, userId, dto);
      res.status(201).json({ success: true, data: availabilities });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: UpdateAvailabilityDTO = req.body;
      const availability = await this.availabilityService.update(id, dto);
      res.json({ success: true, data: availability });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.availabilityService.delete(id);
      res.json({ success: true, message: 'Availability record deleted' });
    } catch (error) {
      next(error);
    }
  };

  getCalendarEntries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const { startDate, endDate, employeeIds, branchId } = req.query;
      
      const query: CalendarQueryDTO = {
        startDate: startDate as string,
        endDate: endDate as string,
        employeeIds: employeeIds ? (employeeIds as string).split(',') : undefined,
        branchId: branchId as string | undefined,
      };
      
      const entries = await this.availabilityService.getCalendarEntries(tenantId, query);
      res.json({ success: true, data: entries });
    } catch (error) {
      next(error);
    }
  };

  getTeamSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const { startDate, endDate, branchId } = req.query;
      
      const query: CalendarQueryDTO = {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string | undefined,
      };
      
      const summary = await this.availabilityService.getTeamSummary(tenantId, query);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  };

  getAvailableStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const { startDate, endDate, branchId, category, excludeEmployeeIds } = req.query;
      
      const query: AvailableStaffQueryDTO = {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string | undefined,
        category: category as string | undefined,
        excludeEmployeeIds: excludeEmployeeIds 
          ? (excludeEmployeeIds as string).split(',') 
          : undefined,
      };
      
      const staff = await this.availabilityService.getAvailableStaff(tenantId, query);
      res.json({ success: true, data: staff });
    } catch (error) {
      next(error);
    }
  };

  checkConflicts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate, excludeId } = req.query;
      
      const hasConflicts = await this.availabilityService.checkConflicts(
        employeeId,
        startDate as string,
        endDate as string,
        excludeId as string | undefined
      );
      
      res.json({ success: true, data: { hasConflicts } });
    } catch (error) {
      next(error);
    }
  };
}
