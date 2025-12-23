import { Request, Response, NextFunction } from 'express';
import { VendorService, CreateVendorDTO, UpdateVendorDTO } from '../../../application/services/vendor/index.js';
import { VendorStatus, VendorType } from '../../../domain/entities/vendor/index.js';
import { parsePagination } from '../../../shared/types/index.js';

export class VendorController {
    constructor(private vendorService: VendorService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const pagination = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                vendorType: req.query.type as VendorType | undefined,
                status: req.query.status as VendorStatus | undefined,
                search: req.query.search as string | undefined,
                city: req.query.city as string | undefined,
            };

            const result = await this.vendorService.getAll(tenantId, filters, pagination);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const vendor = await this.vendorService.getById(id, tenantId);
            res.json({ success: true, data: vendor });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const dto = req.body as CreateVendorDTO;

            const vendor = await this.vendorService.create(dto, tenantId, userId);
            res.status(201).json({ success: true, data: vendor });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const dto = req.body as UpdateVendorDTO;

            const vendor = await this.vendorService.update(id, dto, tenantId);
            res.json({ success: true, data: vendor });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const { status } = req.body as { status: VendorStatus };

            await this.vendorService.updateStatus(id, status, tenantId);
            res.json({ success: true, message: 'Status updated' });
        } catch (error) {
            next(error);
        }
    };

    activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.vendorService.activate(id, tenantId);
            res.json({ success: true, message: 'Vendor activated' });
        } catch (error) {
            next(error);
        }
    };

    deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.vendorService.deactivate(id, tenantId);
            res.json({ success: true, message: 'Vendor deactivated' });
        } catch (error) {
            next(error);
        }
    };

    getByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { type } = req.params;

            const vendors = await this.vendorService.getByType(tenantId, type as VendorType);
            res.json({ success: true, data: vendors });
        } catch (error) {
            next(error);
        }
    };

    getActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;

            const vendors = await this.vendorService.getActive(tenantId);
            res.json({ success: true, data: vendors });
        } catch (error) {
            next(error);
        }
    };

    search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { q } = req.query;

            const vendors = await this.vendorService.search(tenantId, q as string);
            res.json({ success: true, data: vendors });
        } catch (error) {
            next(error);
        }
    };
}
