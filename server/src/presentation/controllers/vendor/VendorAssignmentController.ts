import { Request, Response, NextFunction } from 'express';
import { VendorAssignmentService, CreateAssignmentDTO, UpdateAssignmentDTO } from '../../../application/services/vendor/index.js';
import { AssignmentStatus } from '../../../domain/entities/vendor/index.js';
import { parsePagination } from '../../../shared/types/index.js';

export class VendorAssignmentController {
    constructor(private assignmentService: VendorAssignmentService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                vendorId: req.query.vendorId as string | undefined,
                bookingId: req.query.bookingId as string | undefined,
                status: req.query.status as AssignmentStatus | undefined,
            };

            const result = await this.assignmentService.getAll(tenantId, filters, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const assignment = await this.assignmentService.getById(id, tenantId);
            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const dto = req.body as CreateAssignmentDTO;

            const assignment = await this.assignmentService.create(dto, tenantId, userId);
            res.status(201).json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const dto = req.body as UpdateAssignmentDTO;

            const assignment = await this.assignmentService.update(id, dto, tenantId);
            res.json({ success: true, data: assignment });
        } catch (error) {
            next(error);
        }
    };

    accept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.assignmentService.accept(id, tenantId);
            res.json({ success: true, message: 'Assignment accepted' });
        } catch (error) {
            next(error);
        }
    };

    complete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            const payable = await this.assignmentService.complete(id, tenantId, userId);
            res.json({ success: true, message: 'Assignment completed', payable });
        } catch (error) {
            next(error);
        }
    };

    cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const { reason } = req.body as { reason: string };

            await this.assignmentService.cancel(id, tenantId, reason);
            res.json({ success: true, message: 'Assignment cancelled' });
        } catch (error) {
            next(error);
        }
    };

    replace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;
            const { newVendorId } = req.body as { newVendorId: string };

            const replacement = await this.assignmentService.replace(id, newVendorId, tenantId, userId);
            res.json({ success: true, data: replacement });
        } catch (error) {
            next(error);
        }
    };

    getUpcoming = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const daysAhead = parseInt(req.query.days as string) || 7;

            const assignments = await this.assignmentService.getUpcoming(tenantId, daysAhead);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };

    getByVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { vendorId } = req.params;

            const assignments = await this.assignmentService.getByVendor(vendorId, tenantId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };

    getByBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { bookingId } = req.params;

            const assignments = await this.assignmentService.getByBooking(bookingId, tenantId);
            res.json({ success: true, data: assignments });
        } catch (error) {
            next(error);
        }
    };
}
