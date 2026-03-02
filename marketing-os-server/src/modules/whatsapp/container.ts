// infrastructure/whatsapp/container.ts
// Dependency injection container for WhatsApp services

import { Pool } from 'pg';
import { getConfig } from '../../config/index.js';

// Domain interfaces
import {
  IConversationRepository,
  IMessageRepository,
  ITimelineRepository,
  IWhatsAppProvider,
} from './interfaces/whatsapp/index.js';

// Infrastructure implementations
import { createConversationRepository } from './repositories/ConversationRepository.js';
import { createMessageRepository } from './repositories/MessageRepository.js';
import { createTimelineRepository } from './repositories/TimelineRepository.js';
import { createWhatsAppConfigRepository } from './repositories/WhatsAppConfigRepository.js';
import { createWhatsAppAuditLogRepository } from './repositories/WhatsAppAuditLogRepository.js';
import { createMetaCloudProvider } from './providers/MetaCloudProvider.js';

import { createTenantProviderFactory } from './providers/TenantProviderFactory.js';

// Application services
import { emitToTenant, emitToConversation } from '../../sockets/SocketServer.js';
import {
  createConversationService,
  createMessageService,
  createTimelineService,
  createWorkflowOrchestrator,
  createOperationsCommandHandler,
  createNotificationService,
} from './services/index.js';
import { createWhatsAppAdapter } from './WhatsAppAdapter.js';
import { createMetaTemplateSyncService } from './services/MetaTemplateSyncService.js';

// Presentation controllers
import {
  createWebhookController,
  createConversationController,
  createTimelineController,
  createTemplateController,
  createWhatsAppAnalyticsController,
  createAutomationController,
  createSettingsController,
  createEmbeddedSignupController,
  createBroadcastController,
} from './controllers/index.js';

import { createWhatsAppAnalyticsService } from './services/WhatsAppAnalyticsService.js';
import { createAutomationEngine } from './services/AutomationEngine.js';

/**
 * WhatsApp container - holds all WhatsApp-related dependencies
 */
export interface WhatsAppContainer {
  // Repositories
  conversationRepo: IConversationRepository;
  messageRepo: IMessageRepository;
  timelineRepo: ITimelineRepository;
  optInRepo: any;
  templateRepo: any;
  waConfigRepo: ReturnType<typeof createWhatsAppConfigRepository>;
  auditLogRepo: ReturnType<typeof createWhatsAppAuditLogRepository>;

  // Provider
  provider: IWhatsAppProvider;
  tenantProviderFactory: ReturnType<typeof createTenantProviderFactory>;

  // Services
  conversationService: ReturnType<typeof createConversationService>;
  messageService: ReturnType<typeof createMessageService>;
  timelineService: ReturnType<typeof createTimelineService>;
  workflowOrchestrator: ReturnType<typeof createWorkflowOrchestrator>;
  commandHandler: ReturnType<typeof createOperationsCommandHandler>;
  notificationService: ReturnType<typeof createNotificationService>;
  metaTemplateSyncService: ReturnType<typeof createMetaTemplateSyncService>;

  // Controllers
  webhookController: ReturnType<typeof createWebhookController>;
  conversationController: ReturnType<typeof createConversationController>;
  timelineController: ReturnType<typeof createTimelineController>;
  templateController: ReturnType<typeof createTemplateController>;
  analyticsController: ReturnType<typeof createWhatsAppAnalyticsController>;
  analyticsService: ReturnType<typeof createWhatsAppAnalyticsService>;
  automationEngine: ReturnType<typeof createAutomationEngine>;
  automationController: ReturnType<typeof createAutomationController>;
  settingsController: ReturnType<typeof createSettingsController>;
  embeddedSignupController: ReturnType<typeof createEmbeddedSignupController>;
  broadcastController: ReturnType<typeof createBroadcastController>;
  flowEngine: any;
  flowRepository: any;
  instagramWebhookController: any;
  unifiedConversationController: any;
}

/**
 * Create WhatsApp container with all dependencies
 */
export function createWhatsAppContainer(
  pool: Pool,
  existingServices: {
    leadService?: any;
    bookingService?: any;
    inventoryService?: any;
    paymentRepo?: any;
    employeeRepo?: any;
    tripAssignmentRepo?: any;
    holdService?: any;
    contactService?: any;
  } = {}
): WhatsAppContainer {
  const config = getConfig();

  // ============================================
  // REPOSITORIES
  // ============================================

  const conversationRepo = createConversationRepository(pool);
  const messageRepo = createMessageRepository(pool);
  const timelineRepo = createTimelineRepository(pool);

  // Placeholder repositories (would be implemented similarly)
  const optInRepo = createOptInRepository(pool);
  const templateRepo = createTemplateRepository(pool);
  const waConfigRepo = createWhatsAppConfigRepository(pool);
  const auditLogRepo = createWhatsAppAuditLogRepository(pool);

  // ============================================
  // PROVIDER (global fallback + tenant-aware factory)
  // ============================================

  const provider = createProvider(config);
  const tenantProviderFactory = createTenantProviderFactory(waConfigRepo, pool);

  // ============================================
  // META TEMPLATE SYNC
  // ============================================

  const metaTemplateSyncService = createMetaTemplateSyncService(
    tenantProviderFactory,
    config.whatsapp.meta?.apiVersion || 'v21.0'
  );

  // ============================================
  // CHANNEL ADAPTERS
  // ============================================

  // Simple channel factory (inline stub)
  const channelFactory = {
    adapters: new Map<string, any>(),
    registerAdapter(channel: string, adapter: any) { this.adapters.set(channel, adapter); },
    getAdapter(channel: string) {
      const adapter = this.adapters.get(channel);
      if (!adapter) throw new Error(`No adapter registered for channel: ${channel}`);
      return adapter;
    },
  };

  // WhatsApp Adapter
  const whatsAppAdapter = createWhatsAppAdapter(provider);
  channelFactory.registerAdapter('WHATSAPP', whatsAppAdapter);

  // ============================================
  // APPLICATION SERVICES
  // ============================================

  // Simple contact service stub
  const contactService = existingServices.contactService || {
    findOrCreate: async (phone: string, tenantId: string) => ({ id: phone, fullName: phone }),
  };

  const conversationService = createConversationService(
    conversationRepo,
    messageRepo,
    existingServices.leadService,
    existingServices.bookingService,
    contactService
  );

  const timelineService = createTimelineService(timelineRepo);

  // Socket emitter — broadcasts to tenant room AND conversation room
  const socketEmitter = (tenantId: string, conversationId: string, event: string, data: any) => {
    emitToTenant(tenantId, event, data);
    emitToConversation(conversationId, event, data);
  };

  const messageService = createMessageService(
    messageRepo,
    channelFactory,
    conversationService,
    timelineService,
    socketEmitter
  );

  const workflowOrchestrator = createWorkflowOrchestrator(
    conversationService,
    messageService,
    timelineService,
    existingServices.leadService,
    existingServices.bookingService,
    existingServices.inventoryService,
    existingServices.holdService
  );

  const commandHandler = createOperationsCommandHandler(
    messageService,
    timelineService,
    existingServices.leadService,
    existingServices.bookingService,
    existingServices.inventoryService,
    existingServices.holdService
  );

  const notificationService = createNotificationService(
    messageService,
    timelineService,
    conversationRepo
  );

  // ============================================
  // FLOW AUTOMATION (inline stubs)
  // ============================================

  const flowRepository: any = { findById: async () => null, findByTrigger: async () => null, save: async (f: any) => f };
  const flowEngine: any = {
    triggerSystemFlow: async (tenantId: string, flowType: string, contactId: string) => {
      console.log(`[FlowEngine] Triggering ${flowType} flow for ${contactId} (tenant: ${tenantId})`);
    },
  };

  // ============================================
  // CONTROLLERS
  // ============================================

  // Tenant repository stub
  const tenantRepository: any = {
    getSettings: async (tenantId: string) => null,
  };

  const webhookController = createWebhookController(
    provider,
    conversationService,
    messageService,
    workflowOrchestrator,
    flowEngine,
    tenantRepository,
    auditLogRepo
  );

  const conversationController = createConversationController(
    conversationService,
    messageService,
    timelineService,
    conversationRepo,
    optInRepo,
    pool
  );

  const timelineController = createTimelineController(
    timelineService,
    timelineRepo
  );

  const templateController = createTemplateController(templateRepo, metaTemplateSyncService);

  const analyticsService = createWhatsAppAnalyticsService(pool);
  const analyticsController = createWhatsAppAnalyticsController(analyticsService);

  const automationEngine = createAutomationEngine(
    messageService,
    conversationService
  );

  const automationController = createAutomationController(automationEngine);

  // ============================================
  // ISOLATED FEATURE CONTROLLERS
  // ============================================

  const settingsController = createSettingsController(waConfigRepo, tenantProviderFactory, pool);
  const embeddedSignupController = createEmbeddedSignupController(waConfigRepo, pool);
  const broadcastRepo = createBroadcastRepository(pool);
  const broadcastController = createBroadcastController(messageService, optInRepo, broadcastRepo);

  // Instagram & Omnichannel controllers (stubs until modules exist)
  const instagramWebhookController: any = {
    verify: async (req: any, res: any) => res.status(200).send('OK'),
    handle: async (req: any, res: any) => res.status(200).send('OK'),
  };

  const unifiedConversationController: any = {
    list: async (req: any, res: any) => res.json({ data: [] }),
  };

  return {
    // Repositories
    conversationRepo,
    messageRepo,
    timelineRepo,
    optInRepo,
    templateRepo,
    waConfigRepo,
    auditLogRepo,

    // Provider
    provider,
    tenantProviderFactory,

    // Services
    conversationService,
    messageService,
    timelineService,
    workflowOrchestrator,
    commandHandler,
    notificationService,
    metaTemplateSyncService,
    analyticsService,
    automationEngine,

    // Controllers
    webhookController,
    conversationController,
    timelineController,
    templateController,
    analyticsController,
    automationController,
    settingsController,
    embeddedSignupController,
    broadcastController,
    instagramWebhookController,
    unifiedConversationController,

    // New Flow Automation
    flowRepository,
    flowEngine,
  };
}

/**
 * Create WhatsApp provider from global config (Meta Cloud API only)
 */
function createProvider(config: any): IWhatsAppProvider {
  const meta = config.whatsapp?.meta;
  if (!meta?.accessToken || !meta?.phoneNumberId) {
    console.warn('[WhatsApp] Global credentials not set — provider will fail until tenant-level credentials are configured via Settings.');
  }
  return createMetaCloudProvider(meta || {});
}

/**
 * Placeholder opt-in repository
 */
function createOptInRepository(pool: Pool) {
  return {
    async findByPhone(phone: string, tenantId: string) {
      const result = await pool.query(
        `SELECT * FROM whatsapp_opt_ins WHERE phone_number = $1 AND tenant_id = $2`,
        [phone, tenantId]
      );
      return result.rows[0] || null;
    },
    async save(optIn: any) {
      const query = `
        INSERT INTO whatsapp_opt_ins (
          id, tenant_id, phone_number, country_code, status, source, channel,
          permissions, legal_basis, consented_at, opted_out_at, opt_out_reason,
          recorded_by, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (phone_number, tenant_id)
        DO UPDATE SET
          status = EXCLUDED.status,
          permissions = EXCLUDED.permissions,
          opted_out_at = EXCLUDED.opted_out_at,
          opt_out_reason = EXCLUDED.opt_out_reason,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;
      const result = await pool.query(query, [
        optIn.id,
        optIn.tenantId,
        optIn.phoneNumber,
        optIn.countryCode,
        optIn.status,
        optIn.source,
        optIn.channel,
        JSON.stringify(optIn.permissions),
        optIn.legalBasis,
        optIn.consentedAt,
        optIn.optedOutAt,
        optIn.optOutReason,
        optIn.recordedBy,
        JSON.stringify(optIn.metadata),
        optIn.createdAt,
        optIn.updatedAt,
      ]);
      return result.rows[0];
    },
  };
}

/**
 * Placeholder template repository
 */
function createTemplateRepository(pool: Pool) {
  return {
    async findByTenant(tenantId: string, filters: any = {}) {
      let query = `SELECT * FROM whatsapp_templates WHERE tenant_id = $1`;
      const params: any[] = [tenantId];

      if (filters.category) {
        params.push(filters.category);
        query += ` AND category = $${params.length}`;
      }
      if (filters.status) {
        params.push(filters.status);
        query += ` AND status = $${params.length}`;
      }
      if (filters.language) {
        params.push(filters.language);
        query += ` AND language = $${params.length}`;
      }

      query += ` ORDER BY template_name`;
      const result = await pool.query(query, params);
      return result.rows;
    },
    async findById(id: string, tenantId: string) {
      const result = await pool.query(
        `SELECT * FROM whatsapp_templates WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return result.rows[0] || null;
    },
    async findByName(name: string, tenantId: string) {
      const result = await pool.query(
        `SELECT * FROM whatsapp_templates WHERE template_name = $1 AND tenant_id = $2`,
        [name, tenantId]
      );
      return result.rows[0] || null;
    },
    async findByTrigger(triggerEvent: string, tenantId: string) {
      const result = await pool.query(
        `SELECT * FROM whatsapp_templates 
         WHERE tenant_id = $1 
         AND $2 = ANY(trigger_events)
         AND status = 'APPROVED'
         ORDER BY created_at DESC
         LIMIT 1`,
        [tenantId, triggerEvent]
      );
      return result.rows[0] || null;
    },
    async save(template: any) {
      const query = `
        INSERT INTO whatsapp_templates (
          id, tenant_id, template_name, category, use_case, language, status,
          header_type, header_content, body_content, footer_content,
          components, variables, trigger_events, required_role,
          submitted_at, approved_at, rejected_at, rejection_reason,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id)
        DO UPDATE SET
          category = EXCLUDED.category,
          use_case = EXCLUDED.use_case,
          status = EXCLUDED.status,
          header_type = EXCLUDED.header_type,
          header_content = EXCLUDED.header_content,
          body_content = EXCLUDED.body_content,
          footer_content = EXCLUDED.footer_content,
          components = EXCLUDED.components,
          variables = EXCLUDED.variables,
          trigger_events = EXCLUDED.trigger_events,
          required_role = EXCLUDED.required_role,
          submitted_at = EXCLUDED.submitted_at,
          approved_at = EXCLUDED.approved_at,
          rejected_at = EXCLUDED.rejected_at,
          rejection_reason = EXCLUDED.rejection_reason,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;

      let bodyContentStr = template.bodyContent || '';

      // If body content isn't directly on the template but is in components, extract it.
      if (!bodyContentStr && template.components && Array.isArray(template.components)) {
        const bodyComp = template.components.find((c: any) => c.type === 'BODY');
        if (bodyComp && bodyComp.text) {
          bodyContentStr = bodyComp.text;
        }
      }

      const result = await pool.query(query, [
        template.id,
        template.tenantId || template.tenant_id,
        template.template_name || template.templateName || template.name,
        template.category,
        template.useCase || template.use_case || 'CUSTOM',
        template.language,
        template.status,
        template.headerType || template.header_type || null,
        template.headerContent || template.header_content || null,
        bodyContentStr, // body_content is NOT NULL in the database
        template.footerContent || template.footer_content || null,
        JSON.stringify(template.components || []),
        JSON.stringify(template.variables || []),
        template.triggerEvents || template.trigger_events || [],
        template.requiredRole || template.required_role || null,
        template.submittedAt || template.submitted_at || null,
        template.approvedAt || template.approved_at || null,
        template.rejectedAt || template.rejected_at || null,
        template.rejectionReason || template.rejection_reason || null,
        template.createdBy || template.created_by,
        template.createdAt || template.created_at || new Date(),
        template.updatedAt || template.updated_at || new Date(),
      ]);
      return result.rows[0];
    },
    async delete(id: string, tenantId: string) {
      await pool.query(
        `DELETE FROM whatsapp_templates WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
    },
  };
}

/**
 * Broadcast repository — persists broadcast records
 */
function createBroadcastRepository(pool: Pool) {
  return {
    async save(broadcast: any) {
      const query = `
        INSERT INTO whatsapp_broadcasts (
          id, tenant_id, template_name, language, status,
          total_recipients, sent_count, failed_count, blocked_count,
          recipients, blocked_recipients, scheduled_at, started_at, completed_at,
          created_by, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          sent_count = EXCLUDED.sent_count,
          failed_count = EXCLUDED.failed_count,
          completed_at = EXCLUDED.completed_at,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `;
      const result = await pool.query(query, [
        broadcast.id,
        broadcast.tenantId,
        broadcast.templateName,
        broadcast.language || 'en',
        broadcast.status || 'PENDING',
        broadcast.totalRecipients || 0,
        broadcast.sentCount || 0,
        broadcast.failedCount || 0,
        broadcast.blockedCount || 0,
        JSON.stringify(broadcast.recipients || []),
        JSON.stringify(broadcast.blockedRecipients || []),
        broadcast.scheduledAt || null,
        broadcast.startedAt || null,
        broadcast.completedAt || null,
        broadcast.createdBy,
        new Date(),
        new Date(),
      ]);
      return result.rows[0];
    },
    async updateStatus(id: string, tenantId: string, updates: any) {
      const result = await pool.query(
        `UPDATE whatsapp_broadcasts SET status = $1, sent_count = $2, failed_count = $3, completed_at = $4, updated_at = $5 WHERE id = $6 AND tenant_id = $7 RETURNING *`,
        [updates.status, updates.sentCount, updates.failedCount, updates.completedAt, new Date(), id, tenantId]
      );
      return result.rows[0];
    },
    async findByTenant(tenantId: string, filters: any = {}) {
      let query = `SELECT * FROM whatsapp_broadcasts WHERE tenant_id = $1`;
      const params: any[] = [tenantId];
      if (filters.status) {
        params.push(filters.status);
        query += ` AND status = $${params.length}`;
      }
      query += ` ORDER BY created_at DESC`;
      if (filters.limit) {
        params.push(filters.limit);
        query += ` LIMIT $${params.length}`;
      }
      if (filters.offset) {
        params.push(filters.offset);
        query += ` OFFSET $${params.length}`;
      }
      const result = await pool.query(query, params);
      return result.rows;
    },
    async findById(id: string, tenantId: string) {
      const result = await pool.query(
        `SELECT * FROM whatsapp_broadcasts WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      return result.rows[0] || null;
    },
  };
}

export default createWhatsAppContainer;
