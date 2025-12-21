// presentation/controllers/hrms/EmployeeController.ts
// Employee API controller

import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../../../application/services/hrms/EmployeeService';
import { 
  CreateEmployeeDTO, 
  UpdateEmployeeDTO,
  TransitionLifecycleDTO 
} from '../../../application/dtos/hrms/EmployeeDTO';

export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const employee = await this.employeeService.getById(id, tenantId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  getByCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code } = req.params;
      const tenantId = req.user!.tenantId;

      const employee = await this.employeeService.getByCode(code, tenantId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      res.json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { 
        type, category, branchId, departmentId, 
        lifecycleStage, isActive, search,
        page = 1, limit = 20, sortBy, sortOrder 
      } = req.query;

      const result = await this.employeeService.list(
        tenantId,
        {
          type: type as any,
          category: category as any,
          branchId: branchId as string,
          departmentId: departmentId as string,
          lifecycleStage: lifecycleStage as any,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
          search: search as string,
        },
        {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const userId = req.user!.id;
      const dto: CreateEmployeeDTO = req.body;

      const employee = await this.employeeService.create(dto, tenantId, userId);
      res.status(201).json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const dto: UpdateEmployeeDTO = req.body;

      const employee = await this.employeeService.update(id, dto, tenantId);
      res.json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  transitionLifecycle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const actorId = req.user!.id;
      const dto: TransitionLifecycleDTO = req.body;

      const employee = await this.employeeService.transitionLifecycle(
        id, dto, tenantId, actorId
      );
      res.json({ data: employee });
    } catch (error) {
      next(error);
    }
  };

  getAvailable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { startDate, endDate, skills } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const employees = await this.employeeService.getAvailable(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        skills ? (skills as string).split(',') : undefined
      );

      res.json({ data: employees });
    } catch (error) {
      next(error);
    }
  };

  getTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { managerId } = req.params;
      const tenantId = req.user!.tenantId;

      const employees = await this.employeeService.getTeamByManager(managerId, tenantId);
      res.json({ data: employees });
    } catch (error) {
      next(error);
    }
  };

  getMyTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const managerId = req.user!.employeeId;

      if (!managerId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const employees = await this.employeeService.getTeamByManager(managerId, tenantId);
      res.json({ data: employees });
    } catch (error) {
      next(error);
    }
  };
}
