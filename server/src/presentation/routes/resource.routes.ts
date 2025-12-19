import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController.js';
import { validateBody } from '../middleware/index.js';
import {
    createResourceSchema,
    updateResourceSchema,
} from '../validators/index.js';

export function createResourceRoutes(controller: ResourceController): Router {
    const router = Router();

    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', validateBody(createResourceSchema), controller.create);
    router.put('/:id', validateBody(updateResourceSchema), controller.update);
    router.delete('/:id', controller.delete);

    return router;
}
