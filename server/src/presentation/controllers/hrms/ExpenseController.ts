// presentation/controllers/hrms/ExpenseController.ts
// Expense Controller Implementation

import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../../../application/services/hrms/ExpenseService';
import type {
  CreateExpenseClaimDTO,
  UpdateExpenseClaimDTO,
  ExpenseFiltersDTO,
  ApproveExpenseDTO,
  RejectExpenseDTO,
  MarkPaidDTO,
} from '../../../application/dtos/hrms/ExpenseDTO';

export class ExpenseController {
  constructor(private expenseService: ExpenseService) {}

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const expense = await this.expenseService.getById(id);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  getByClaimNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { claimNumber } = req.params;
      const expense = await this.expenseService.getByClaimNumber(claimNumber);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const filters: ExpenseFiltersDTO = {
        employeeId: req.query.employeeId as string | undefined,
        status: req.query.status as ExpenseFiltersDTO['status'],
        tripId: req.query.tripId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const expenses = await this.expenseService.getAll(tenantId, filters);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  };

  getByEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user?.tenantId || '';
      const expenses = await this.expenseService.getByEmployee(employeeId, tenantId);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  };

  getMyExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId || '';
      const tenantId = req.user?.tenantId || '';
      const expenses = await this.expenseService.getByEmployee(employeeId, tenantId);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  };

  getPendingApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const approverId = req.query.approverId as string | undefined;
      const expenses = await this.expenseService.getPendingApproval(tenantId, approverId);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const employeeId = req.user?.employeeId || '';
      const userId = req.user?.id || '';
      const dto: CreateExpenseClaimDTO = req.body;
      const expense = await this.expenseService.create(tenantId, employeeId, userId, dto);
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';
      const dto: UpdateExpenseClaimDTO = req.body;
      const expense = await this.expenseService.update(id, userId, dto);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';
      await this.expenseService.delete(id, userId);
      res.json({ success: true, message: 'Expense claim deleted' });
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';
      const expense = await this.expenseService.submit(id, userId);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const approverId = req.user?.id || '';
      const dto: ApproveExpenseDTO = req.body;
      const expense = await this.expenseService.approve(id, approverId, dto);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const rejectorId = req.user?.id || '';
      const dto: RejectExpenseDTO = req.body;
      const expense = await this.expenseService.reject(id, rejectorId, dto);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  markAsPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const dto: MarkPaidDTO = req.body;
      const expense = await this.expenseService.markAsPaid(id, dto);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.user?.tenantId || '';
      const { startDate, endDate } = req.query;
      const stats = await this.expenseService.getStats(
        tenantId,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
