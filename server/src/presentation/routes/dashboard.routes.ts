import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';

export function createDashboardRoutes(controller: DashboardController): Router {
    const router = Router();

    router.get('/stats', controller.getStats);

    return router;
}
