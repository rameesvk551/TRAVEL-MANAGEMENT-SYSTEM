// presentation/routes/whatsapp.routes.ts
// Routes for WhatsApp integration layer

import { Router, json } from 'express';
import {
  WebhookController,
  ConversationController,
  TimelineController,
  TemplateController,
  WhatsAppAnalyticsController,
  AutomationController, // Added
} from './controllers/index.js';
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
  analyticsController: WhatsAppAnalyticsController;
  automationController: AutomationController; // Added
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
    analyticsController,
    automationController, // Added
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
  // BROADCAST ROUTES
  // ============================================

  router.post('/broadcast',
    conversationController.broadcast
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

  // Sync templates from Meta
  router.post('/templates/sync',
    templateController.syncFromMeta
  );

  // Test template
  router.post('/templates/:id/test',
    templateController.test
  );

  // Delete template
  router.delete('/templates/:id',
    templateController.delete
  );

  // Delete template
  router.delete('/templates/:id',
    templateController.delete
  );

  // ============================================
  // ANALYTICS ROUTES
  // ============================================

  router.get('/analytics/campaigns',
    analyticsController.getCampaignStats
  );

  router.get('/analytics/response-time',
    analyticsController.getResponseStats
  );

  // ============================================
  // AUTOMATION ROUTES
  // ============================================

  router.get('/automation/rules',
    automationController.getRules
  );

  router.post('/automation/rules',
    automationController.createRule
  );

  router.put('/automation/rules/:id',
    automationController.updateRule
  );

  router.delete('/automation/rules/:id',
    automationController.deleteRule
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

      const { WhatsAppOptIn } = await import('./models/index.js');

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

  // ============================================
  // TEST ROUTES (Development only)
  // ============================================

  // Quick test endpoint - bypasses opt-in for testing
  router.post('/test/send', async (req, res, next) => {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        res.status(400).json({
          error: 'Missing required fields',
          required: { to: 'phone number', message: 'text message' }
        });
        return;
      }

      // Get the provider directly from container dependencies
      const { createWhatsAppContainer } = await import('../../infrastructure/whatsapp/container.js');
      const { getPool } = await import('../../infrastructure/database/index.js');
      const container = createWhatsAppContainer(getPool(), {});

      const result = await container.provider.sendMessage({
        recipientPhone: to.replace(/\s/g, ''), // Remove spaces
        messageType: 'TEXT',
        textContent: { body: message },
      });

      if (result.success) {
        res.json({
          success: true,
          messageId: result.providerMessageId,
          message: 'Message sent successfully! 🚀'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage,
          errorCode: result.errorCode
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Health check for WhatsApp integration
  router.get('/health', async (_req, res, _next) => {
    try {
      const { getConfig } = await import('../../config/index.js');
      const config = getConfig();

      res.json({
        status: 'ok',
        provider: config.whatsapp.provider,
        apiVersion: config.whatsapp.meta?.apiVersion,
        phoneNumberId: config.whatsapp.meta?.phoneNumberId ? '***' + config.whatsapp.meta.phoneNumberId.slice(-4) : 'not set',
        webhookVerifyToken: config.whatsapp.verifyToken ? 'set' : 'not set',
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });

  // ============================================
  // DEMO FLOW ROUTES
  // ============================================

  // Start demo flow - sends welcome message with options
  router.post('/demo/start', async (req, res, next) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({
          error: 'Missing phone number',
          usage: { phone: '919605734995' }
        });
        return;
      }

      const { demoFlow } = await import('../../infrastructure/whatsapp/flows/index.js');

      // Reset state and start fresh
      demoFlow.resetState(phone);
      await demoFlow.processMessage(phone, 'hi');

      res.json({
        success: true,
        message: `Demo flow started for ${phone}`,
        instructions: 'Check WhatsApp for the welcome message with options!'
      });
    } catch (error) {
      next(error);
    }
  });

  // Simulate user response in demo flow
  router.post('/demo/respond', async (req, res, next) => {
    try {
      const { phone, message, buttonId, listId } = req.body;

      if (!phone) {
        res.status(400).json({
          error: 'Missing phone number',
          usage: { phone: '919605734995', message: 'or buttonId/listId' }
        });
        return;
      }

      const { demoFlow } = await import('../../infrastructure/whatsapp/flows/index.js');
      await demoFlow.processMessage(phone, message || '', buttonId, listId);

      res.json({
        success: true,
        message: 'Response processed',
        currentState: demoFlow.getState(phone)
      });
    } catch (error) {
      next(error);
    }
  });

  // Get demo flow state
  router.get('/demo/state/:phone', async (req, res, _next) => {
    const { phone } = req.params;
    const { demoFlow } = await import('../../infrastructure/whatsapp/flows/index.js');

    res.json({
      phone,
      state: demoFlow.getState(phone) || { step: 'not_started', data: {} }
    });
  });

  // Reset demo flow
  router.post('/demo/reset', async (req, res, _next) => {
    const { phone } = req.body;
    const { demoFlow } = await import('../../infrastructure/whatsapp/flows/index.js');

    if (phone) {
      demoFlow.resetState(phone);
      res.json({ success: true, message: `State reset for ${phone}` });
    } else {
      res.status(400).json({ error: 'Phone number required' });
    }
  });

  // Full demo - runs through entire booking flow automatically
  router.post('/demo/full', async (req, res, next) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        res.status(400).json({
          error: 'Missing phone number',
          usage: { phone: '919605734995' }
        });
        return;
      }

      const { demoFlow } = await import('../../infrastructure/whatsapp/flows/index.js');

      // Reset and run full demo with delays
      demoFlow.resetState(phone);

      const steps = [
        { delay: 0, action: () => demoFlow.processMessage(phone, 'hi') },
        { delay: 3000, action: () => demoFlow.processMessage(phone, '', 'book_trip') },
        { delay: 3000, action: () => demoFlow.processMessage(phone, '', undefined, 'dest_goa') },
        { delay: 3000, action: () => demoFlow.processMessage(phone, '', undefined, 'date_0') },
        { delay: 3000, action: () => demoFlow.processMessage(phone, '', 'travelers_2') },
        { delay: 3000, action: () => demoFlow.processMessage(phone, '', 'confirm_booking') },
      ];

      // Execute steps with delays
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        await step.action();
      }

      res.json({
        success: true,
        message: `Full demo completed for ${phone}`,
        note: 'Check WhatsApp for the complete booking flow!'
      });
    } catch (error) {
      next(error);
    }
  });

  // ============================================
  // Onboarding Routes (Embedded Signup / QR Code)
  // ============================================
  // Import and mount onboarding routes
  import('./routes/onboarding.routes.js').then(({ default: onboardingRoutes }) => {
    router.use('/onboard', onboardingRoutes);
  }).catch(err => {
    console.warn('Failed to load onboarding routes:', err.message);
  });

  return router;
}

export default createWhatsAppRoutes;
