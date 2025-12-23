import { Request, Response, NextFunction } from 'express';
import { GearInventoryService } from '../../../application/services/gear/GearInventoryService.js';

export class GearInventoryController {
    constructor(private inventoryService: GearInventoryService) {}

    getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const warehouseId = req.query.warehouseId as string | undefined;

            const summary = await this.inventoryService.getSummary(tenantId, warehouseId);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    };

    checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { categoryId, warehouseId, size, startDate, endDate, quantity } = req.query;

            const result = await this.inventoryService.checkAvailability(tenantId, {
                categoryId: categoryId as string | undefined,
                warehouseId: warehouseId as string | undefined,
                size: size as string | undefined,
                startDate: new Date(startDate as string),
                endDate: new Date(endDate as string),
                quantity: parseInt(quantity as string) || 1,
            });
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    getHeatmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const warehouseId = req.query.warehouseId as string | undefined;

            const result = await this.inventoryService.getInventoryHeatmap(tenantId, warehouseId);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    };

    transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { gearItemId, toWarehouseId, reason } = req.body;

            await this.inventoryService.transferGear(gearItemId, toWarehouseId, tenantId, userId, reason);
            res.json({ success: true, message: 'Transfer initiated' });
        } catch (error) {
            next(error);
        }
    };

    releaseFromQuarantine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId, userId } = req.context;
            const { id } = req.params;
            const { inspectionPassed, notes } = req.body;

            await this.inventoryService.releaseFromQuarantine(id, tenantId, userId, inspectionPassed, notes);
            res.json({ success: true, message: 'Released from quarantine' });
        } catch (error) {
            next(error);
        }
    };

    releaseExpiredReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const count = await this.inventoryService.releaseExpiredReservations(tenantId);
            res.json({ success: true, data: { released: count } });
        } catch (error) {
            next(error);
        }
    };
}
