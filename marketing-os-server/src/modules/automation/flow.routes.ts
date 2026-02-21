import { Router } from 'express';
import { FlowController } from './flow.controller.js';

export function createFlowRoutes(dependencies: {
    flowController: FlowController;
    authMiddleware: (req: any, res: any, next: any) => void;
    tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
    const router = Router();
    const { flowController, authMiddleware, tenantMiddleware } = dependencies;

    // All routes require authentication
    router.use(authMiddleware);
    router.use(tenantMiddleware);

    // ============================================
    // FLOW CRUD
    // ============================================

    router.get('/', flowController.getFlows.bind(flowController));
    router.get('/:id', flowController.getFlow.bind(flowController));
    router.post('/', flowController.createFlow.bind(flowController));
    router.put('/:id', flowController.updateFlow.bind(flowController));
    router.delete('/:id', flowController.deleteFlow.bind(flowController));

    return router;
}
