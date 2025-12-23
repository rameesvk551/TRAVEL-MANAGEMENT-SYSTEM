import { Request, Response, NextFunction } from 'express';
import { VendorSettlementService, CreateSettlementDTO } from '../../../application/services/vendor/index.js';
import { SettlementMethod } from '../../../domain/entities/vendor/index.js';
import { parsePagination } from '../../../shared/types/index.js';

export class VendorSettlementController {
    constructor(private settlementService: VendorSettlementService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { page, limit } = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                vendorId: req.query.vendorId as string | undefined,
                paymentMethod: req.query.paymentMethod as SettlementMethod | undefined,
                isVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
            };

            const result = await this.settlementService.getAll(tenantId, filters, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const settlement = await this.settlementService.getById(id, tenantId);
            res.json({ success: true, data: settlement });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const dto = req.body as CreateSettlementDTO;

            const settlement = await this.settlementService.create(dto, tenantId, userId);
            res.status(201).json({ success: true, data: settlement });
        } catch (error) {
            next(error);
        }
    };

    verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            await this.settlementService.verify(id, tenantId, userId!);
            res.json({ success: true, message: 'Settlement verified' });
        } catch (error) {
            next(error);
        }
    };

    getByVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { vendorId } = req.params;

            const settlements = await this.settlementService.getByVendor(vendorId, tenantId);
            res.json({ success: true, data: settlements });
        } catch (error) {
            next(error);
        }
    };

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
            const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

            const summary = await this.settlementService.getSummary(tenantId, dateFrom, dateTo);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    };

    getVendorSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { vendorId } = req.params;

            const summary = await this.settlementService.getVendorSummary(vendorId, tenantId);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    };
}
