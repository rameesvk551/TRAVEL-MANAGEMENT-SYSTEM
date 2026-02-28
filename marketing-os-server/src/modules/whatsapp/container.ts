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
import { ConversationRepository } from './repositories/ConversationRepository.js';
import { MessageRepository } from './repositories/MessageRepository.js';
import { TimelineRepository } from './repositories/TimelineRepository.js';
import { WhatsAppConfigRepository } from './repositories/WhatsAppConfigRepository.js';
import { WhatsAppAuditLogRepository } from './repositories/WhatsAppAuditLogRepository.js';
import { MetaCloudProvider } from './providers/MetaCloudProvider.js';
import { MockProvider } from './providers/MockProvider.js';
import { TenantProviderFactory } from './providers/TenantProviderFactory.js';

// Application services
import {
  ConversationService,
  MessageService,
  TimelineService,
  WorkflowOrchestrator,
  OperationsCommandHandler,
  NotificationService,
} from './services/index.js';
import { WhatsAppAdapter } from './WhatsAppAdapter.js';
import { MetaTemplateSyncService } from './services/MetaTemplateSyncService.js';

// Presentation controllers
import {
  WebhookController,
  ConversationController,
  TimelineController,
  TemplateController,
  WhatsAppAnalyticsController,
  AutomationController,
} from './controllers/index.js';

import { WhatsAppAnalyticsService } from './services/WhatsAppAnalyticsService.js';
import { AutomationEngine } from './services/AutomationEngine.js';

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
  waConfigRepo: WhatsAppConfigRepository;
  auditLogRepo: WhatsAppAuditLogRepository;

  // Provider
  provider: IWhatsAppProvider;
  tenantProviderFactory: TenantProviderFactory;

  // Services
  conversationService: ConversationService;
  messageService: MessageService;
  timelineService: TimelineService;
  workflowOrchestrator: WorkflowOrchestrator;
  commandHandler: OperationsCommandHandler;
  notificationService: NotificationService;
  metaTemplateSyncService: MetaTemplateSyncService;

  // Controllers
  webhookController: WebhookController;
  conversationController: ConversationController;
  timelineController: TimelineController;
  templateController: TemplateController;
  analyticsController: WhatsAppAnalyticsController;
  analyticsService: WhatsAppAnalyticsService;
  automationEngine: AutomationEngine;
  automationController: AutomationController;
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

  const conversationRepo = new ConversationRepository(pool);
  const messageRepo = new MessageRepository(pool);
  const timelineRepo = new TimelineRepository(pool);

  // Placeholder repositories (would be implemented similarly)
  const optInRepo = createOptInRepository(pool);
  const templateRepo = createTemplateRepository(pool);
  const waConfigRepo = new WhatsAppConfigRepository(pool);
  const auditLogRepo = new WhatsAppAuditLogRepository(pool);

  // ============================================
  // PROVIDER (global fallback + tenant-aware factory)
  // ============================================

  const provider = createProvider(config);
  const tenantProviderFactory = new TenantProviderFactory(waConfigRepo, pool);

  // ============================================
  // META TEMPLATE SYNC
  // ============================================

  const metaTemplateSyncService = new MetaTemplateSyncService(
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
  const whatsAppAdapter = new WhatsAppAdapter(provider);
  channelFactory.registerAdapter('WHATSAPP', whatsAppAdapter);

  // ============================================
  // APPLICATION SERVICES
  // ============================================

  // Simple contact service stub
  const contactService = existingServices.contactService || {
    findOrCreate: async (phone: string, tenantId: string) => ({ id: phone, fullName: phone }),
  };

  const conversationService = new ConversationService(
    conversationRepo,
    messageRepo,
    existingServices.leadService,
    existingServices.bookingService,
    contactService
  );

  const timelineService = new TimelineService(timelineRepo);

  const messageService = new MessageService(
    messageRepo,
    channelFactory,
    conversationService,
    timelineService
  );

  const workflowOrchestrator = new WorkflowOrchestrator(
    conversationService,
    messageService,
    timelineService,
    existingServices.leadService,
    existingServices.bookingService,
    existingServices.inventoryService,
    existingServices.holdService
  );

  const commandHandler = new OperationsCommandHandler(
    messageService,
    timelineService,
    existingServices.leadService,
    existingServices.bookingService,
    existingServices.inventoryService,
    existingServices.holdService
  );

  const notificationService = new NotificationService(
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

  const webhookController = new WebhookController(
    provider,
    conversationService,
    messageService,
    workflowOrchestrator,
    flowEngine,
    tenantRepository,
    auditLogRepo
  );

  const conversationController = new ConversationController(
    conversationService,
    messageService,
    timelineService,
    conversationRepo,
    optInRepo
  );

  const timelineController = new TimelineController(
    timelineService,
    timelineRepo
  );

  const templateController = new TemplateController(templateRepo, metaTemplateSyncService);

  const analyticsService = new WhatsAppAnalyticsService(pool);
  const analyticsController = new WhatsAppAnalyticsController(analyticsService);

  const automationEngine = new AutomationEngine(
    messageService,
    conversationService
  );

  const automationController = new AutomationController(automationEngine);

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
    instagramWebhookController,
    unifiedConversationController,

    // New Flow Automation
    flowRepository,
    flowEngine,
  };
}

/**
 * Create appropriate WhatsApp provider based on config
 */
function createProvider(config: any): IWhatsAppProvider {
  const providerType = config.whatsapp?.provider || 'mock';

  switch (providerType) {
    case 'meta':
      return new MetaCloudProvider(config.whatsapp?.meta || {});
    case 'mock':
    default:
      return new MockProvider();
  }
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

export default createWhatsAppContainer;
