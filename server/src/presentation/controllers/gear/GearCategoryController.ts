import { Request, Response, NextFunction } from 'express';
import { GearCategoryService } from '../../../application/services/gear/GearCategoryService.js';
import { GearCategoryType } from '../../../domain/entities/gear/GearCategory.js';

export class GearCategoryController {
    constructor(private categoryService: GearCategoryService) {}

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const filters = {
                type: req.query.type as GearCategoryType | undefined,
                parentId: req.query.parentId as string | undefined,
                isSafetyCritical: req.query.isSafetyCritical === 'true' ? true : undefined,
                isActive: req.query.isActive !== 'false',
                search: req.query.search as string | undefined,
            };

            const categories = await this.categoryService.getAll(tenantId, filters);
            res.json({ success: true, data: categories });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const category = await this.categoryService.getById(id, tenantId);
            res.json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const category = await this.categoryService.create(req.body, tenantId);
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const category = await this.categoryService.update(id, req.body, tenantId);
            res.json({ success: true, data: category });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.categoryService.delete(id, tenantId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}
