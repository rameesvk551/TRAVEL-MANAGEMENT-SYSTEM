import { Router } from 'express';
import { InstagramWebhookController } from '../controllers/instagram/InstagramWebhookController.js';

export function createInstagramRoutes(webhookController: InstagramWebhookController): Router {
    const router = Router();

    // Webhook verification
    router.get('/webhook', (req, res) => webhookController.verifyWebhook(req, res));

    // Webhook events
    router.post('/webhook', (req, res) => webhookController.handleWebhook(req, res));

    return router;
}
