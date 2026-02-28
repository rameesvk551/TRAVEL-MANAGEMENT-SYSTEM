// presentation/routes/whatsapp.routes.ts
// Routes for WhatsApp integration layer

import { Router, json } from 'express';
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
import {
  verifyWebhookChallenge,
  validateWebhookSignature,
  webhookRateLimiter,
  apiRateLimiter,
  sendMessageRateLimiter,
  validateOptIn,
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
    timelineController,
    templateController,
    analyticsController,
    automationController,
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
  // SEED DEMO DATA
  // ============================================
  router.post('/seed-demo', async (req: any, res: any, next: any) => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }

      const { getPool } = await import('../../config/database.js');
      const pool = getPool();

      // Check if conversations already exist
      const existing = await pool.query('SELECT COUNT(*) as count FROM whatsapp_conversations WHERE tenant_id = $1', [tenantId]);
      if (parseInt(existing.rows[0].count) > 0) {
        res.json({ success: true, message: 'Demo data already exists', count: parseInt(existing.rows[0].count) });
        return;
      }

      const { v4: uuidv4 } = await import('uuid');
      const now = new Date();

      const contacts = [
        {
          name: 'Rahul Sharma', phone: '919876543210', msgs: [
            { dir: 'INBOUND', text: 'Hi, I am looking for a Goa trip package for 4 people', time: -3600000 * 5 },
            { dir: 'OUTBOUND', text: 'Hello Rahul! Welcome to TripPlanner. We have amazing Goa packages starting from ₹15,000 per person.', time: -3600000 * 4.5 },
            { dir: 'INBOUND', text: 'That sounds great! Can you share more details?', time: -3600000 * 4 },
            { dir: 'OUTBOUND', text: 'Sure! Our popular 4N/5D Goa package includes:\n🏨 4-star hotel stay\n🚗 Airport transfers\n🎡 North & South Goa sightseeing\n🍽️ Breakfast included\n\nPrice: ₹18,500/person', time: -3600000 * 3.5 },
            { dir: 'INBOUND', text: 'This looks perfect. Can we book for March 15-19?', time: -3600000 * 2 },
          ]
        },
        {
          name: 'Priya Patel', phone: '919812345678', msgs: [
            { dir: 'INBOUND', text: 'Hello! I want to book a honeymoon package to Maldives', time: -3600000 * 24 },
            { dir: 'OUTBOUND', text: 'Hi Priya! Congratulations! 🎉 We have exclusive honeymoon packages to Maldives.', time: -3600000 * 23 },
            { dir: 'INBOUND', text: 'Thank you! What all is included?', time: -3600000 * 22 },
            { dir: 'OUTBOUND', text: 'Our Maldives Honeymoon Special includes:\n🏝️ 5N/6D Water Villa stay\n✈️ Return flights\n🍷 Romantic dinner\n🤿 Snorkeling trip\n💆 Couples spa\n\nStarting from ₹1,25,000/couple', time: -3600000 * 21 },
          ]
        },
        {
          name: 'Amit Kumar', phone: '919898765432', msgs: [
            { dir: 'INBOUND', text: 'My booking ID is TRP-2024-0847. Need to reschedule.', time: -3600000 * 48 },
            { dir: 'OUTBOUND', text: 'Hi Amit! Let me check your booking. One moment please...', time: -3600000 * 47.5 },
            { dir: 'OUTBOUND', text: 'I found your booking for Kerala (Feb 25 - Mar 1). What dates would you like to reschedule to?', time: -3600000 * 47 },
            { dir: 'INBOUND', text: 'Can we move it to March 10-15?', time: -3600000 * 46 },
            { dir: 'OUTBOUND', text: 'Let me check availability for those dates...', time: -3600000 * 45 },
            { dir: 'OUTBOUND', text: '✅ Great news! March 10-15 is available. Same hotel and itinerary. No extra charges for rescheduling. Shall I confirm?', time: -3600000 * 44 },
            { dir: 'INBOUND', text: 'Yes please, confirm it!', time: -3600000 * 43 },
          ]
        },
        {
          name: 'Sneha Reddy', phone: '919845671234', msgs: [
            { dir: 'INBOUND', text: 'Hi! Do you have any weekend getaway options from Bangalore?', time: -3600000 * 8 },
            { dir: 'OUTBOUND', text: 'Hey Sneha! Yes, we have several weekend getaways from Bangalore:\n\n1. Coorg - Coffee plantations 🌿\n2. Chikmagalur - Hill station ⛰️\n3. Wayanad - Nature retreat 🌳\n4. Ooty - Colonial charm 🏔️\n5. Pondicherry - Beach vibes 🏖️\n\nWhich interests you?', time: -3600000 * 7 },
            { dir: 'INBOUND', text: 'Coorg sounds amazing! For 2 people this Saturday', time: -3600000 * 6 },
          ]
        },
        {
          name: 'Mohammed Ali', phone: '919723456789', msgs: [
            { dir: 'INBOUND', text: 'I need a refund for cancelled trip', time: -3600000 * 72 },
            { dir: 'OUTBOUND', text: 'Hi Mohammed, I\'m sorry to hear about the cancellation. Could you please share your booking ID?', time: -3600000 * 71 },
            { dir: 'INBOUND', text: 'TRP-2024-0612', time: -3600000 * 70 },
            { dir: 'OUTBOUND', text: 'I see the booking was cancelled within the free cancellation period. Your refund of ₹32,000 has been initiated. It will be credited to your original payment method within 5-7 business days. 💰', time: -3600000 * 69 },
            { dir: 'INBOUND', text: 'Thank you for the quick response!', time: -3600000 * 68 },
          ]
        },
        {
          name: 'Ananya Singh', phone: '919654321098', msgs: [
            { dir: 'INBOUND', text: 'Hi, can I get a group discount for 12 people going to Manali?', time: -3600000 * 1 },
            { dir: 'OUTBOUND', text: 'Hello Ananya! Yes, we offer special group discounts. For 12 people, you can get up to 20% off! 🎉\n\nOur Manali group packages:\n- 3N/4D from ₹8,500/person\n- 5N/6D from ₹14,000/person\n\nIncludes Solang Valley, Rohtang Pass, and more!', time: -3600000 * 0.5 },
          ]
        },
      ];

      for (const contact of contacts) {
        const convId = uuidv4();
        const lastMsgTime = new Date(now.getTime() + contact.msgs[contact.msgs.length - 1].time);

        await pool.query(
          `INSERT INTO whatsapp_conversations (
            id, tenant_id, channel, external_id, whatsapp_thread_id,
            primary_actor_type, primary_actor_phone, primary_actor_name,
            state, last_activity_at, session_started_at, session_expires_at,
            message_count, is_opted_in, is_escalated, requires_human_review,
            provider_metadata, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [
            convId, tenantId, 'WHATSAPP', contact.phone, contact.phone,
            'CUSTOMER', contact.phone, contact.name,
            'IDLE', lastMsgTime, new Date(now.getTime() + contact.msgs[0].time),
            new Date(now.getTime() + 86400000),
            contact.msgs.length, true, false, false,
            '{}', new Date(now.getTime() + contact.msgs[0].time), lastMsgTime,
          ]
        );

        for (const msg of contact.msgs) {
          const msgId = uuidv4();
          const msgTime = new Date(now.getTime() + msg.time);
          await pool.query(
            `INSERT INTO whatsapp_messages (
              id, tenant_id, conversation_id, provider_message_id, provider_timestamp,
              direction, sender_phone, recipient_phone, message_type,
              text_content, status, status_timestamps,
              is_processed, requires_response, idempotency_key, created_at, updated_at
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              msgId, tenantId, convId, `demo_${msgId}`, msgTime,
              msg.dir, msg.dir === 'INBOUND' ? contact.phone : 'business',
              msg.dir === 'INBOUND' ? 'business' : contact.phone,
              'TEXT', JSON.stringify({ body: msg.text }),
              msg.dir === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
              JSON.stringify({ [msg.dir === 'OUTBOUND' ? 'sent' : 'delivered']: msgTime }),
              true, msg.dir === 'INBOUND', `demo_${msgId}_${tenantId}`, msgTime, msgTime,
            ]
          );
        }
      }

      res.json({ success: true, message: `Seeded ${contacts.length} demo conversations`, count: contacts.length });
    } catch (error: any) {
      console.error('Seed demo error:', error);
      next(error);
    }
  });

  // ============================================
  // DEBUG: DB State (remove in production)
  // ============================================
  router.get('/debug/db-state', async (req: any, res: any, next: any) => {
    try {
      const tenantId = req.context?.tenantId;
      const { getPool } = await import('../../config/database.js');
      const pool = getPool();

      const [convCount, convAllCount, msgCount, msgAllCount, configs, convSample] = await Promise.all([
        pool.query('SELECT COUNT(*) as c FROM whatsapp_conversations WHERE tenant_id = $1', [tenantId]),
        pool.query('SELECT tenant_id, COUNT(*) as c FROM whatsapp_conversations GROUP BY tenant_id'),
        pool.query('SELECT COUNT(*) as c FROM whatsapp_messages WHERE tenant_id = $1', [tenantId]),
        pool.query('SELECT tenant_id, COUNT(*) as c FROM whatsapp_messages GROUP BY tenant_id'),
        pool.query('SELECT tenant_id, phone_number_id, phone_display, status, verified_name FROM whatsapp_business_configs'),
        pool.query('SELECT id, tenant_id, primary_actor_phone, primary_actor_name, state, channel FROM whatsapp_conversations ORDER BY last_activity_at DESC LIMIT 5'),
      ]);

      res.json({
        currentTenantId: tenantId,
        forCurrentTenant: {
          conversations: parseInt(convCount.rows[0].c),
          messages: parseInt(msgCount.rows[0].c),
        },
        allTenants: {
          conversations: convAllCount.rows,
          messages: msgAllCount.rows,
        },
        whatsappConfigs: configs.rows,
        recentConversations: convSample.rows,
      });
    } catch (error) { next(error); }
  });

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

  // Send message in conversation
  router.post('/conversations/:id/send',
    sendMessageRateLimiter,
    conversationController.sendMessage
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
      const { createWhatsAppContainer } = await import('./container.js');
      const { getPool } = await import('../../config/database.js');
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

      const { demoFlow } = await import('./flows/index.js');

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

      const { demoFlow } = await import('./flows/index.js');
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
    const { demoFlow } = await import('./flows/index.js');

    res.json({
      phone,
      state: demoFlow.getState(phone) || { step: 'not_started', data: {} }
    });
  });

  // Reset demo flow
  router.post('/demo/reset', async (req, res, _next) => {
    const { phone } = req.body;
    const { demoFlow } = await import('./flows/index.js');

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

      const { demoFlow } = await import('./flows/index.js');

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

  return router;
}

export default createWhatsAppRoutes;
