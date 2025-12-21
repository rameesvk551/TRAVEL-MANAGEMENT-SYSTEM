// presentation/controllers/hrms/PayrollController.ts
// Payroll API controller - simplified version

import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../../../application/services/hrms/PayrollService.js';
import {
  GeneratePayrollDTO,
  MarkPaidDTO,
  PayrollActionDTO,
} from '../../../application/dtos/hrms/PayrollDTO.js';

export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  // Employee self-service: Get my payslips
  getMyPayslips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year, month } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const payslips = await this.payrollService.listPayslips(tenantId, {
        year: year ? parseInt(year as string, 10) : undefined,
        month: month ? parseInt(month as string, 10) : undefined,
      });

      // Filter for current employee only
      const myPayslips = payslips.filter((p) => p.employeeId === employeeId);
      res.json({ data: myPayslips });
    } catch (error) {
      next(error);
    }
  };

  // Get single payslip
  getPayslip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const payslip = await this.payrollService.getPayslip(id, tenantId);
      if (!payslip) {
        return res.status(404).json({ error: 'Payslip not found' });
      }

      res.json({ data: payslip });
    } catch (error) {
      next(error);
    }
  };

  // Admin: Generate payslips for a period
  generatePayslips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const generatedBy = req.user!.id;
      const dto: GeneratePayrollDTO = req.body;

      const result = await this.payrollService.generatePayslips(
        dto,
        tenantId,
        generatedBy
      );

      res.status(201).json({
        data: result,
        message: `Generated ${result.generated} payslips`,
      });
    } catch (error) {
      next(error);
    }
  };

  // Admin: Approve payslips
  approvePayslips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const approvedBy = req.user!.id;
      const dto: PayrollActionDTO = { ...req.body, action: 'approve' };

      await this.payrollService.approvePayslips(dto, tenantId, approvedBy);
      res.json({ message: 'Payslips approved' });
    } catch (error) {
      next(error);
    }
  };

  // Admin: Mark payslips as paid
  markAsPaid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const dto: MarkPaidDTO = req.body;

      await this.payrollService.markAsPaid(dto, tenantId);
      res.json({ message: 'Payslips marked as paid' });
    } catch (error) {
      next(error);
    }
  };

  // Admin: List all payslips (with filters)
  listPayslips = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { year, month, status } = req.query;

      const payslips = await this.payrollService.listPayslips(tenantId, {
        year: year ? parseInt(year as string, 10) : undefined,
        month: month ? parseInt(month as string, 10) : undefined,
        status: status as any,
      });

      res.json({ data: payslips });
    } catch (error) {
      next(error);
    }
  };

  // Admin: Get payroll summary
  getSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { year, month } = req.query;

      const y = year ? parseInt(year as string, 10) : new Date().getFullYear();
      const m = month ? parseInt(month as string, 10) : new Date().getMonth() + 1;

      const summary = await this.payrollService.getPayrollSummary(tenantId, y, m);
      res.json({ data: summary });
    } catch (error) {
      next(error);
    }
  };
}
