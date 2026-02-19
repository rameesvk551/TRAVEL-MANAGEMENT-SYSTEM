import { Request, Response, Router } from 'express';
import { DripOrchestrator } from './DripOrchestrator.js';
import { EmailService } from './EmailService.js';

/**
 * DripController – REST endpoints for managing drip sequences and
 * manually triggering / cancelling drip enrollments.
 */
export class DripController {
    constructor(
        private orchestrator: DripOrchestrator,
        private emailService: EmailService
    ) { }

    /** POST /trigger – enroll a recipient in matching drip sequences */
    trigger = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const { triggerType, recipientEmail, recipientData } = req.body;

            if (!triggerType || !recipientEmail) {
                res.status(400).json({ error: 'triggerType and recipientEmail are required' });
                return;
            }

            await this.orchestrator.handleTrigger(tenantId, triggerType, recipientEmail, recipientData || {});
            res.json({ success: true, message: `Drip sequences triggered for ${recipientEmail}` });
        } catch (e: any) {
            console.error('Error triggering drip:', e);
            res.status(500).json({ error: e.message });
        }
    };

    /** POST /cancel – cancel a recipient's remaining drip steps */
    cancel = async (req: Request, res: Response) => {
        try {
            const { sequenceId, recipientEmail } = req.body;

            if (!sequenceId || !recipientEmail) {
                res.status(400).json({ error: 'sequenceId and recipientEmail are required' });
                return;
            }

            await this.orchestrator.cancelForRecipient(sequenceId, recipientEmail);
            res.json({ success: true, message: `Drip cancelled for ${recipientEmail}` });
        } catch (e: any) {
            console.error('Error cancelling drip:', e);
            res.status(500).json({ error: e.message });
        }
    };

    /** GET /sequences – list drip sequences for the tenant */
    listSequences = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const sequences = await this.emailService.getDripSequences(tenantId);
            res.json(sequences);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    };

    /** POST /sequences – create a new drip sequence */
    createSequence = async (req: Request, res: Response) => {
        try {
            const tenantId = (req.headers['x-tenant-id'] as string) || 'default-tenant-id';
            const sequence = await this.emailService.createDripSequence(tenantId, req.body);
            res.status(201).json(sequence);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    };
}

export function createDripRoutes(authMiddleware: any, controller: DripController): Router {
    const router = Router();
    router.use(authMiddleware);

    router.post('/trigger', controller.trigger);
    router.post('/cancel', controller.cancel);
    router.get('/sequences', controller.listSequences);
    router.post('/sequences', controller.createSequence);

    return router;
}
