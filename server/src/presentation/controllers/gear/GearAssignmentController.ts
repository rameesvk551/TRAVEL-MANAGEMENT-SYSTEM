import { Request, Response, NextFunction } from 'express';
import { GearAssignmentService } from '../../../application/services/gear/GearAssignmentService.js';

export class GearAssignmentController {
    constructor(private assignmentService: GearAssignmentService) {}

    getByTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { tripId } = req.params;

            const assignments = await this.assignmentService.getByTrip(tripId, tenantId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };

    getTripManifest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { tripId } = req.params;

            const manifest = await this.assignmentService.getTripManifest(tripId, tenantId);
            res.json({ success: true, data: manifest });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const assignment = await this.assignmentService.createAssignment(
                req.body,
                tenantId,
                userId
            );
            res.status(201).json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    createBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { tripId, assignments } = req.body;

            const result = await this.assignmentService.createBulkAssignments(
                tripId,
                assignments,
                tenantId,
                userId
            );
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    issueGear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            const assignment = await this.assignmentService.issueGear(
                { assignmentId: id, ...req.body },
                tenantId,
                userId
            );
            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    returnGear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            const assignment = await this.assignmentService.returnGear(
                { assignmentId: id, ...req.body },
                tenantId,
                userId
            );
            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            await this.assignmentService.cancelAssignment(id, tenantId, userId);
            res.json({ success: true, message: 'Assignment cancelled' });
        } catch (error) {
            next(error);
        }
    };

    getPendingReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const assignments = await this.assignmentService.getPendingReturns(tenantId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };

    getOverdueReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const assignments = await this.assignmentService.getOverdueReturns(tenantId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };
}
