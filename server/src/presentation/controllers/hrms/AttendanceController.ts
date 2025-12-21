// presentation/controllers/hrms/AttendanceController.ts
// Attendance API controller

import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../../../application/services/hrms/AttendanceService';
import {
  CheckInDTO,
  CheckOutDTO,
  ManualAttendanceDTO,
  ApproveAttendanceDTO,
} from '../../../application/dtos/hrms/AttendanceDTO';

export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  // Employee self-service endpoints
  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const dto: CheckInDTO = req.body;
      const attendance = await this.attendanceService.checkIn(employeeId, dto, tenantId);
      res.json({ data: attendance, message: 'Checked in successfully' });
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const dto: CheckOutDTO = req.body;
      const attendance = await this.attendanceService.checkOut(employeeId, dto, tenantId);
      res.json({ data: attendance, message: 'Checked out successfully' });
    } catch (error) {
      next(error);
    }
  };

  getMyToday = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const attendance = await this.attendanceService.getByDate(
        employeeId,
        new Date(),
        tenantId
      );

      res.json({ data: attendance });
    } catch (error) {
      next(error);
    }
  };

  getMySummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year, month } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const y = parseInt(year as string, 10) || new Date().getFullYear();
      const m = parseInt(month as string, 10) || new Date().getMonth() + 1;

      const dateFrom = new Date(y, m - 1, 1);
      const dateTo = new Date(y, m, 0);

      const summary = await this.attendanceService.getSummary(
        employeeId,
        tenantId,
        dateFrom,
        dateTo
      );

      res.json({ data: summary });
    } catch (error) {
      next(error);
    }
  };

  getMyCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { year, month } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const y = parseInt(year as string, 10) || new Date().getFullYear();
      const m = parseInt(month as string, 10) || new Date().getMonth() + 1;

      const calendar = await this.attendanceService.getCalendar(
        employeeId,
        tenantId,
        y,
        m
      );

      res.json({ data: calendar });
    } catch (error) {
      next(error);
    }
  };

  // Admin/Manager endpoints
  createManual = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.id;
      const dto: ManualAttendanceDTO = req.body;

      const attendance = await this.attendanceService.createManual(
        dto,
        tenantId,
        createdBy
      );

      res.status(201).json({ data: attendance });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const approverId = req.user!.id;
      const dto: ApproveAttendanceDTO = req.body;

      await this.attendanceService.approve(dto, tenantId, approverId);
      res.json({ message: 'Attendance records processed' });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user!.tenantId;
      const { dateFrom, dateTo, type, status } = req.query;

      // Default to current month if no dates provided
      const now = new Date();
      const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const records = await this.attendanceService.list(tenantId, {
        employeeId,
        dateFrom: dateFrom ? new Date(dateFrom as string) : defaultFrom,
        dateTo: dateTo ? new Date(dateTo as string) : defaultTo,
        type: type as any,
        status: status as any,
      });

      res.json({ data: records });
    } catch (error) {
      next(error);
    }
  };

  getEmployeeSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user!.tenantId;
      const { year, month } = req.query;

      const y = parseInt(year as string, 10) || new Date().getFullYear();
      const m = parseInt(month as string, 10) || new Date().getMonth() + 1;

      const dateFrom = new Date(y, m - 1, 1);
      const dateTo = new Date(y, m, 0);

      const summary = await this.attendanceService.getSummary(
        employeeId,
        tenantId,
        dateFrom,
        dateTo
      );

      res.json({ data: summary });
    } catch (error) {
      next(error);
    }
  };

  listAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { branchId, dateFrom, dateTo, type, status, tripId } = req.query;

      // Default to current month if no dates provided
      const now = new Date();
      const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const records = await this.attendanceService.list(tenantId, {
        branchId: branchId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : defaultFrom,
        dateTo: dateTo ? new Date(dateTo as string) : defaultTo,
        type: type as any,
        status: status as any,
        tripId: tripId as string,
      });

      res.json({ data: records });
    } catch (error) {
      next(error);
    }
  };
}
