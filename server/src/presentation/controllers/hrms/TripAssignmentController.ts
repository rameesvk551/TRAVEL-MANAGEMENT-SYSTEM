// presentation/controllers/hrms/TripAssignmentController.ts
// Trip assignment API controller

import { Request, Response, NextFunction } from 'express';
import { TripAssignmentService } from '../../../application/services/hrms/TripAssignmentService';
import {
  CreateTripAssignmentDTO,
  BulkAssignDTO,
  AssignmentActionDTO,
  CompleteAssignmentDTO,
} from '../../../application/dtos/hrms/TripAssignmentDTO';

export class TripAssignmentController {
  constructor(private assignmentService: TripAssignmentService) {}

  // Employee self-service
  getMyUpcoming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const employeeId = req.user!.employeeId;
      const { limit } = req.query;

      if (!employeeId) {
        return res.status(400).json({ error: 'User not linked to employee' });
      }

      const assignments = await this.assignmentService.getEmployeeUpcoming(
        employeeId,
        tenantId,
        limit ? parseInt(limit as string, 10) : 5
      );

      res.json({ data: assignments });
    } catch (error) {
      next(error);
    }
  };

  confirmAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;

      const assignment = await this.assignmentService.confirmOrDecline(
        id,
        { action: 'confirm' },
        tenantId
      );

      res.json({ data: assignment, message: 'Assignment confirmed' });
    } catch (error) {
      next(error);
    }
  };

  declineAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const { reason } = req.body;

      const assignment = await this.assignmentService.confirmOrDecline(
        id,
        { action: 'decline', reason },
        tenantId
      );

      res.json({ data: assignment, message: 'Assignment declined' });
    } catch (error) {
      next(error);
    }
  };

  // Admin/Operations endpoints
  assign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.id;
      const dto: CreateTripAssignmentDTO = req.body;

      const assignment = await this.assignmentService.assign(dto, tenantId, createdBy);
      res.status(201).json({ data: assignment, message: 'Staff assigned to trip' });
    } catch (error) {
      next(error);
    }
  };

  bulkAssign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const createdBy = req.user!.id;
      const dto: BulkAssignDTO = req.body;

      const assignments = await this.assignmentService.bulkAssign(dto, tenantId, createdBy);
      res.status(201).json({ 
        data: assignments, 
        message: `${assignments.length} staff assigned to trip` 
      });
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const dto: CompleteAssignmentDTO = req.body;

      const assignment = await this.assignmentService.complete(id, dto, tenantId);
      res.json({ data: assignment, message: 'Assignment completed' });
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = req.user!.tenantId;
      const { reason } = req.body;

      await this.assignmentService.cancel(id, reason || 'Cancelled', tenantId);
      res.json({ message: 'Assignment cancelled' });
    } catch (error) {
      next(error);
    }
  };

  getTripCrew = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tripId } = req.params;
      const tenantId = req.user!.tenantId;

      const crew = await this.assignmentService.getTripCrew(tripId, tenantId);
      res.json({ data: crew });
    } catch (error) {
      next(error);
    }
  };

  checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId } = req.params;
      const tenantId = req.user!.tenantId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate required' });
      }

      const availability = await this.assignmentService.checkAvailability(
        employeeId,
        new Date(startDate as string),
        new Date(endDate as string),
        tenantId
      );

      res.json({ data: availability });
    } catch (error) {
      next(error);
    }
  };

  getSuggestions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.tenantId;
      const { tripId, startDate, endDate, role } = req.query;

      if (!tripId || !startDate || !endDate || !role) {
        return res.status(400).json({ 
          error: 'tripId, startDate, endDate, and role are required' 
        });
      }

      const suggestions = await this.assignmentService.getStaffSuggestions(
        tripId as string,
        new Date(startDate as string),
        new Date(endDate as string),
        role as string,
        tenantId
      );

      res.json({ data: suggestions });
    } catch (error) {
      next(error);
    }
  };
}
