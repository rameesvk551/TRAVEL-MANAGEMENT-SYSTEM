import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../../application/services/ResourceService.js';
import { CreateResourceDTO, UpdateResourceDTO } from '../../application/dtos/ResourceDTO.js';
import { parsePagination } from '../../shared/types/index.js';
import { ResourceType } from '../../domain/entities/Resource.js';

/**
 * Resource controller - handles HTTP requests/responses.
 * NO business logic here - only request parsing and response formatting.
 */
export class ResourceController {
    constructor(private resourceService: ResourceService) { }

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const pagination = parsePagination(req.query as { page?: string; limit?: string });
            const filters = {
                type: req.query.type as ResourceType | undefined,
                isActive: req.query.isActive === 'true' ? true : undefined,
                search: req.query.search as string | undefined,
            };

            const result = await this.resourceService.getAll(tenantId, filters, pagination);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            const resource = await this.resourceService.getById(id, tenantId);
            res.json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const dto = req.body as CreateResourceDTO;

            const resource = await this.resourceService.create(dto, tenantId);
            res.status(201).json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;
            const dto = req.body as UpdateResourceDTO;

            const resource = await this.resourceService.update(id, dto, tenantId);
            res.json({ success: true, data: resource });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { tenantId } = req.context;
            const { id } = req.params;

            await this.resourceService.delete(id, tenantId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}
