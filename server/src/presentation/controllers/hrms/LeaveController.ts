// presentation/controllers/hrms/LeaveController.ts
// Leave management API controller

import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../../../application/services/hrms/LeaveService';
import {
  CreateLeaveRequestDTO,
  LeaveActionDTO,
} from '../../../application/dtos/hrms/LeaveDTO';

export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  // Employee self-service
  createRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const dto: CreateLeaveRequestDTO = req.body;
      const request = await this.leaveService.createRequest(employeeId, dto, tenantId);
      res.status(201).json({ data: request, message: 'Leave request submitted' });
    } catch (error) {
      next(error);
    }
  };

  cancelRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const { reason } = req.body;

      await this.leaveService.cancelRequest(id, reason || 'Cancelled by employee', tenantId);
      res.json({ message: 'Leave request cancelled' });
    } catch (error) {
      next(error);
    }
  };

  getMyRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const requests = await this.leaveService.getEmployeeRequests(
        employeeId,
        tenantId,
        year ? parseInt(year as string, 10) : undefined
      );

      res.json({ data: requests });
    } catch (error) {
      next(error);
    }
  };

  getMyBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      const balances = await this.leaveService.getBalances(employeeId, y, tenantId);

      res.json({ data: balances });
    } catch (error) {
      next(error);
    }
  };

  getMySummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      const summary = await this.leaveService.getSummary(employeeId, y, tenantId);

      res.json({ data: summary });
    } catch (error) {
      next(error);
    }
  };

  // Manager/Admin endpoints
  processAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const approverId = req.user!.id;
      const dto: LeaveActionDTO = req.body;

      const request = await this.leaveService.processAction(id, dto, approverId, tenantId);
      res.json({ 
        data: request, 
        message: dto.action === 'approve' ? 'Leave approved' : 'Leave rejected' 
      });
    } catch (error) {
      next(error);
    }
  };

  getPendingApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const approverId = req.user!.id;

      const requests = await this.leaveService.getPendingApprovals(approverId, tenantId);
      res.json({ data: requests });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user!.tenantId;
      const { year } = req.query;

      const requests = await this.leaveService.getEmployeeRequests(
        employeeId,
        tenantId,
        year ? parseInt(year as string, 10) : undefined
      );

      res.json({ data: requests });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeBalances = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user!.tenantId;
      const { year } = req.query;

      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      const balances = await this.leaveService.getBalances(employeeId, y, tenantId);

      res.json({ data: balances });
    } catch (error) {
      next(error);
    }
  };
}
