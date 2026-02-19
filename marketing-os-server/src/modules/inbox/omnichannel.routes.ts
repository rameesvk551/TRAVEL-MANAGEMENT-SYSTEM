import { Router, RequestHandler } from 'express';
import { UnifiedConversationController } from '../controllers/omnichannel/UnifiedConversationController.js';

export function createOmnichannelRoutes(
    authMiddleware: RequestHandler,
    controller: UnifiedConversationController
): Router {
    const router = Router();

    // Unified Inbox
    router.get('/inbox', authMiddleware, (req, res) => controller.getInbox(req, res));

    return router;
}
