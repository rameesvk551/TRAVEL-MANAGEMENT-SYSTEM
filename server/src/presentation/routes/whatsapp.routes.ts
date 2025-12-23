// presentation/routes/whatsapp.routes.ts
// Routes for WhatsApp integration layer

import { Router, json } from 'express';
import {
  WebhookController,
  ConversationController,
  TimelineController,
  TemplateController,
} from '../controllers/whatsapp/index.js';
import {
  verifyWebhookChallenge,
  validateWebhookSignature,
  webhookRateLimiter,
  apiRateLimiter,
  sendMessageRateLimiter,
  validateOptIn,
  softValidateOptIn,
  recordImplicitOptIn,
} from '../middleware/whatsapp/index.js';

/**
 * Create WhatsApp routes with dependency injection
 */
export function createWhatsAppRoutes(dependencies: {
  webhookController: WebhookController;
  conversationController: ConversationController;
  timelineController: TimelineController;
  templateController: TemplateController;
  optInRepo: any; // For opt-in validation middleware
  authMiddleware: (req: any, res: any, next: any) => void;
  tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
  const router = Router();
  const {
    webhookController,
    conversationController,
    timelineController,
    templateController,
    optInRepo,
    authMiddleware,
    tenantMiddleware,
  } = dependencies;

  // ============================================
  // WEBHOOK ROUTES (No auth - called by providers)
  // ============================================

  // Webhook verification (Meta)
  router.get('/webhook',
    verifyWebhookChallenge
  );

  // Webhook handler (Meta)
  router.post('/webhook',
    webhookRateLimiter,
    validateWebhookSignature('meta'),
    recordImplicitOptIn(optInRepo),
    webhookController.handleWebhook
  );

  // Provider-specific webhooks
  router.post('/webhook/meta',
    webhookRateLimiter,
    validateWebhookSignature('meta'),
    recordImplicitOptIn(optInRepo),
    webhookController.handleWebhook
  );

  router.post('/webhook/twilio',
    webhookRateLimiter,
    validateWebhookSignature('twilio'),
    recordImplicitOptIn(optInRepo),
    webhookController.handleWebhook
  );

  router.post('/webhook/vonage',
    webhookRateLimiter,
    validateWebhookSignature('vonage'),
    recordImplicitOptIn(optInRepo),
    webhookController.handleWebhook
  );

  // ============================================
  // AUTHENTICATED ROUTES
  // ============================================

  // Apply auth and tenant middleware to all routes below
  router.use(authMiddleware);
  router.use(tenantMiddleware);
  router.use(apiRateLimiter);

  // ============================================
  // CONVERSATION ROUTES
  // ============================================

  // List conversations
  router.get('/conversations',
    conversationController.getConversations
  );

  // Get single conversation
  router.get('/conversations/:id',
    conversationController.getConversation
  );

  // Link entity to conversation
  router.post('/conversations/:id/link',
    conversationController.linkEntity
  );

  // Assign operator
  router.post('/conversations/:id/assign',
    conversationController.assignOperator
  );

  // Escalate conversation
  router.post('/conversations/:id/escalate',
    conversationController.escalate
  );

  // Close conversation
  router.post('/conversations/:id/close',
    conversationController.close
  );

  // Get conversation messages
  router.get('/conversations/:id/messages',
    conversationController.getMessages
  );

  // ============================================
  // MESSAGE ROUTES
  // ============================================

  // Send text message
  router.post('/messages/send',
    sendMessageRateLimiter,
    validateOptIn(optInRepo),
    webhookController.sendMessage
  );

  // Send template message
  router.post('/messages/template',
    sendMessageRateLimiter,
    softValidateOptIn(optInRepo), // Softer validation for templates
    webhookController.sendTemplate
  );

  // Get message status
  router.get('/messages/:messageId/status',
    webhookController.getMessageStatus
  );

  // ============================================
  // TIMELINE ROUTES
  // ============================================

  // Lead timeline
  router.get('/timeline/lead/:leadId',
    timelineController.getLeadTimeline
  );

  // Booking timeline
  router.get('/timeline/booking/:bookingId',
    timelineController.getBookingTimeline
  );

  // Departure timeline
  router.get('/timeline/departure/:departureId',
    timelineController.getDepartureTimeline
  );

  // Trip assignment timeline
  router.get('/timeline/trip/:tripId',
    timelineController.getTripTimeline
  );

  // Add note to timeline
  router.post('/timeline/note',
    timelineController.addNote
  );

  // Search timeline
  router.get('/timeline/search',
    timelineController.search
  );

  // ============================================
  // TEMPLATE ROUTES
  // ============================================

  // Get template categories
  router.get('/templates/categories',
    templateController.getCategories
  );

  // Get template triggers
  router.get('/templates/triggers',
    templateController.getTriggers
  );

  // List templates
  router.get('/templates',
    templateController.list
  );

  // Get template
  router.get('/templates/:id',
    templateController.get
  );

  // Create template
  router.post('/templates',
    templateController.create
  );

  // Update template
  router.put('/templates/:id',
    templateController.update
  );

  // Submit template for approval
  router.post('/templates/:id/submit',
    templateController.submit
  );

  // Test template
  router.post('/templates/:id/test',
    templateController.test
  );

  // Delete template
  router.delete('/templates/:id',
    templateController.delete
  );

  // ============================================
  // OPT-IN MANAGEMENT ROUTES
  // ============================================

  // Get opt-in status
  router.get('/opt-in/:phone', async (req, res, next) => {
    try {
      const tenantId = req.context?.tenantId;
      const { phone } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const optIn = await optInRepo.findByPhone(phone, tenantId);
      res.json({ data: optIn || null });
    } catch (error) {
      next(error);
    }
  });

  // Record opt-in
  router.post('/opt-in', async (req, res, next) => {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { WhatsAppOptIn } = await import('../../domain/entities/whatsapp/index.js');

      const optIn = WhatsAppOptIn.create({
        tenantId,
        ...req.body,
        recordedBy: userId,
      });

      const saved = await optInRepo.save(optIn);
      res.status(201).json({ data: saved });
    } catch (error) {
      next(error);
    }
  });

  // Update opt-in
  router.put('/opt-in/:phone', async (req, res, next) => {
    try {
      const tenantId = req.context?.tenantId;
      const { phone } = req.params;
      const { status, permissions } = req.body;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const optIn = await optInRepo.findByPhone(phone, tenantId);

      if (!optIn) {
        res.status(404).json({ error: 'Opt-in record not found' });
        return;
      }

      if (status) {
        if (status === 'OPTED_OUT') {
          optIn.optOut('USER_REQUEST');
        } else if (status === 'OPTED_IN') {
          optIn.reOptIn(req.body.source || 'DASHBOARD');
        }
      }

      if (permissions) {
        optIn.updatePermissions(permissions);
      }

      const saved = await optInRepo.save(optIn);
      res.json({ data: saved });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default createWhatsAppRoutes;
