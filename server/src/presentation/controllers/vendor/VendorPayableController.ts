import { Request, Response, NextFunction } from 'express';
import { VendorPayableService, CreatePayableDTO, UpdatePayableDTO } from '../../../application/services/vendor/index.js';
import { PayableStatus } from '../../../domain/entities/vendor/index.js';
import { parsePagination } from '../../../shared/types/index.js';

export class VendorPayableController {
    constructor(private payableService: VendorPayableService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                vendorId: req.query.vendorId as string | undefined,
                status: req.query.status as PayableStatus | undefined,
            };

            const result = await this.payableService.getAll(tenantId, filters, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const payable = await this.payableService.getById(id, tenantId);
            res.json({ success: true, data: payable });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const dto = req.body as CreatePayableDTO;

            const payable = await this.payableService.create(dto, tenantId, userId);
            res.status(201).json({ success: true, data: payable });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const dto = req.body as UpdatePayableDTO;

            const payable = await this.payableService.update(id, dto, tenantId);
            res.json({ success: true, data: payable });
        } catch (error) {
            next(error);
        }
    };

    submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.payableService.submit(id, tenantId);
            res.json({ success: true, message: 'Payable submitted for approval' });
        } catch (error) {
            next(error);
        }
    };

    approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            await this.payableService.approve(id, tenantId, userId!);
            res.json({ success: true, message: 'Payable approved' });
        } catch (error) {
            next(error);
        }
    };

    hold = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.payableService.hold(id, tenantId);
            res.json({ success: true, message: 'Payable put on hold' });
        } catch (error) {
            next(error);
        }
    };

    dispute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.payableService.dispute(id, tenantId);
            res.json({ success: true, message: 'Payable marked as disputed' });
        } catch (error) {
            next(error);
        }
    };

    getOverdue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;

            const payables = await this.payableService.getOverdue(tenantId);
            res.json({ success: true, data: payables });
        } catch (error) {
            next(error);
        }
    };

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;

            const summary = await this.payableService.getSummary(tenantId);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    };

    getVendorSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { vendorId } = req.params;

            const summary = await this.payableService.getVendorSummary(vendorId, tenantId);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    };

    getByVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { vendorId } = req.params;

            const payables = await this.payableService.getByVendor(vendorId, tenantId);
            res.json({ success: true, data: payables });
        } catch (error) {
            next(error);
        }
    };
}
