import { Request, Response, NextFunction } from 'express';
import { GearItemService } from '../../../application/services/gear/GearItemService.js';
import { GearCondition, GearOwnershipType, GearSize } from '../../../domain/entities/gear/GearItem.js';
import { parsePagination } from '../../../shared/types/index.js';

export class GearItemController {
    constructor(private itemService: GearItemService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const pagination = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                categoryId: req.query.categoryId as string | undefined,
                condition: req.query.condition as GearCondition | undefined,
                ownershipType: req.query.ownershipType as GearOwnershipType | undefined,
                warehouseId: req.query.warehouseId as string | undefined,
                isSafetyCritical: req.query.isSafetyCritical === 'true' ? true : undefined,
                isRentable: req.query.isRentable === 'true' ? true : undefined,
                isActive: req.query.isActive !== 'false',
                inspectionOverdue: req.query.inspectionOverdue === 'true' ? true : undefined,
                maintenanceOverdue: req.query.maintenanceOverdue === 'true' ? true : undefined,
                search: req.query.search as string | undefined,
            };

            const result = await this.itemService.getAll(tenantId, filters, pagination);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const result = await this.itemService.getById(id, tenantId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    getByBarcode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { barcode } = req.params;

            const result = await this.itemService.getByBarcode(barcode, tenantId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const item = await this.itemService.create(req.body, tenantId, userId);
            res.status(201).json({ success: true, data: item });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            const item = await this.itemService.update(id, req.body, tenantId, userId);
            res.json({ success: true, data: item });
        } catch (error) {
            next(error);
        }
    };

    updateCondition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;
            const { condition, conditionScore } = req.body;

            await this.itemService.updateCondition(id, tenantId, condition, conditionScore, userId);
            res.json({ success: true, message: 'Condition updated' });
        } catch (error) {
            next(error);
        }
    };

    retire = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;

            await this.itemService.retire(id, tenantId, userId);
            res.json({ success: true, message: 'Item retired' });
        } catch (error) {
            next(error);
        }
    };

    getUnsafe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const items = await this.itemService.getUnsafeGear(tenantId);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    };

    getInspectionOverdue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const items = await this.itemService.getInspectionOverdue(tenantId);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    };

    getMaintenanceOverdue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const items = await this.itemService.getMaintenanceOverdue(tenantId);
            res.json({ success: true, data: items });
        } catch (error) {
            next(error);
        }
    };
}
