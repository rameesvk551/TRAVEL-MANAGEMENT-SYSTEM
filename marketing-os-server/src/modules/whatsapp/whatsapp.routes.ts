import { Router, json, Request, Response, NextFunction } from 'express';
import {
  WebhookController,
  ConversationController,
  TimelineController,
  TemplateController,
  WhatsAppAnalyticsController,
  AutomationController,
  SettingsController,
  EmbeddedSignupController,
  BroadcastController,
} from './controllers/index.js';
import { getConfig } from '../../config/index.js';

// ── Inline middleware (was in modules/middleware/whatsapp, now deleted) ──

/** Meta webhook GET challenge verification */
const verifyWebhookChallenge = (req: Request, res: Response) => {
  const config = getConfig();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsapp?.verifyToken) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

/** Validate webhook HMAC signature — pass-through for now */
const validateWebhookSignature = (_provider: string) =>
  (_req: Request, _res: Response, next: NextFunction) => next();

/** Rate limiters — pass-through stubs */
const webhookRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
const apiRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();
const sendMessageRateLimiter = (_req: Request, _res: Response, next: NextFunction) => next();

/** Opt-in validation — pass-through stub */
const validateOptIn = (_optInRepo: any) =>
  (_req: Request, _res: Response, next: NextFunction) => next();

/** Record implicit opt-in on inbound — pass-through stub */
const recordImplicitOptIn = (_optInRepo: any) =>
  (_req: Request, _res: Response, next: NextFunction) => next();

/**
 * Create WhatsApp routes with dependency injection
 */
export function createWhatsAppRoutes(dependencies: {
  webhookController: WebhookController;
  conversationController: ConversationController;
  timelineController: TimelineController;
  templateController: TemplateController;
  analyticsController: WhatsAppAnalyticsController;
  automationController: AutomationController;
  settingsController: SettingsController;
  embeddedSignupController: EmbeddedSignupController;
  broadcastController: BroadcastController;
  optInRepo: any; // For opt-in validation middleware
  authMiddleware: (req: any, res: any, next: any) => void;
  tenantMiddleware: (req: any, res: any, next: any) => void;
}): Router {
  const router = Router();
  const {
    webhookController,
    conversationController,
    templateController,
    settingsController,
    embeddedSignupController,
    broadcastController,
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

  // Review-friendly alias endpoint
  router.get('/webhooks/whatsapp',
    verifyWebhookChallenge
  );

  // Webhook handler (Meta)
  router.post('/webhook',
    webhookRateLimiter,
    validateWebhookSignature('meta'),
    recordImplicitOptIn(optInRepo),
    webhookController.handleWebhook
  );

  // Review-friendly alias endpoint
  router.post('/webhooks/whatsapp',
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



  // ============================================
  // AUTHENTICATED ROUTES
  // ============================================

  // Apply auth and tenant middleware to all routes below
  router.use(authMiddleware);
  router.use(tenantMiddleware);
  router.use(apiRateLimiter);

  // ============================================
  // SETTINGS ROUTES (Manual Credential Connection)
  // ============================================

  // Get current WhatsApp connection status
  router.get('/settings',
    settingsController.getConnection
  );

  // Save manual credentials (new connection)
  router.post('/settings/manual',
    settingsController.saveManualConfig
  );

  // Update existing manual credentials
  router.put('/settings/manual/:connectionId',
    settingsController.updateManualConfig
  );

  // Test current connection
  router.post('/settings/test',
    settingsController.testConnection
  );

  // Disconnect WhatsApp
  router.delete('/settings',
    settingsController.disconnect
  );

  // Regenerate webhook verify token
  router.post('/settings/regenerate-verify-token',
    settingsController.regenerateVerifyToken
  );

  // ============================================
  // EMBEDDED SIGNUP ROUTES (Facebook OAuth Flow)
  // ============================================

  // Get FB Embedded Signup config
  router.get('/settings/embedded/config',
    embeddedSignupController.getConfig
  );

  // Complete FB Embedded Signup
  router.post('/settings/embedded/complete',
    embeddedSignupController.complete
  );



  // ============================================
  // CONVERSATION ROUTES
  // ============================================

  // Start new conversation
  router.post('/conversations/new',
    conversationController.startNew
  );

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

  // Send message in conversation
  router.post('/conversations/:id/send',
    sendMessageRateLimiter,
    conversationController.sendMessage
  );

  // Send template message in conversation (no opt-in required)
  router.post('/conversations/:id/send-template',
    sendMessageRateLimiter,
    conversationController.sendConversationTemplate
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

  // Unified Meta review endpoint
  router.post('/messages',
    sendMessageRateLimiter,
    validateOptIn(optInRepo),
    webhookController.sendMessageV2
  );

  // Send template message
  router.post('/messages/template',
    sendMessageRateLimiter,
    validateOptIn(optInRepo),
    webhookController.sendTemplate
  );

  // Get message status
  router.get('/messages/:messageId/status',
    webhookController.getMessageStatus
  );

  // ============================================
  // BROADCAST ROUTES (Isolated BroadcastController)
  // ============================================

  router.post('/broadcast',
    broadcastController.send
  );

  router.get('/broadcast',
    broadcastController.list
  );

  router.get('/broadcast/:id',
    broadcastController.get
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




  // ============================================
  // TEST ROUTES (Development only)
  // ============================================

  // Health check for WhatsApp integration
  router.get('/health', async (_req, res, _next) => {
    try {
      const { getConfig } = await import('../../config/index.js');
      const config = getConfig();

      res.json({
        status: 'ok',
        provider: 'meta',
        apiVersion: config.whatsapp.meta?.apiVersion,
        phoneNumberId: config.whatsapp.meta?.phoneNumberId ? '***' + config.whatsapp.meta.phoneNumberId.slice(-4) : 'not set',
        webhookVerifyToken: config.whatsapp.verifyToken ? 'set' : 'not set',
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: (error as Error).message });
    }
  });



  return router;
}

export default createWhatsAppRoutes;
