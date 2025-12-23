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
} from '../../domain/interfaces/whatsapp/index.js';

// Infrastructure implementations
import { ConversationRepository } from './repositories/ConversationRepository.js';
import { MessageRepository } from './repositories/MessageRepository.js';
import { TimelineRepository } from './repositories/TimelineRepository.js';
import { MetaCloudProvider } from './providers/MetaCloudProvider.js';
import { MockProvider } from './providers/MockProvider.js';

// Application services
import {
  ConversationService,
  MessageService,
  TimelineService,
  WorkflowOrchestrator,
  OperationsCommandHandler,
  NotificationService,
} from '../../application/services/whatsapp/index.js';

// Presentation controllers
import {
  WebhookController,
  ConversationController,
  TimelineController,
  TemplateController,
} from '../../presentation/controllers/whatsapp/index.js';

/**
 * WhatsApp container - holds all WhatsApp-related dependencies
 */
export interface WhatsAppContainer {
  // Repositories
  conversationRepo: IConversationRepository;
  messageRepo: IMessageRepository;
  timelineRepo: ITimelineRepository;
  optInRepo: any; // Placeholder for opt-in repo
  templateRepo: any; // Placeholder for template repo

  // Provider
  provider: IWhatsAppProvider;

  // Services
  conversationService: ConversationService;
  messageService: MessageService;
  timelineService: TimelineService;
  workflowOrchestrator: WorkflowOrchestrator;
  commandHandler: OperationsCommandHandler;
  notificationService: NotificationService;

  // Controllers
  webhookController: WebhookController;
  conversationController: ConversationController;
  timelineController: TimelineController;
  templateController: TemplateController;
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

  // ============================================
  // PROVIDER
  // ============================================

  const provider = createProvider(config);

  // ============================================
  // APPLICATION SERVICES
  // ============================================

  const conversationService = new ConversationService(
    conversationRepo,
    messageRepo
  );

  const messageService = new MessageService(
    provider,
    messageRepo,
    conversationRepo
  );

  const timelineService = new TimelineService(timelineRepo);

  const workflowOrchestrator = new WorkflowOrchestrator(
    conversationService,
    existingServices.leadService,
    existingServices.bookingService,
    existingServices.inventoryService,
    existingServices.paymentRepo
  );

  const commandHandler = new OperationsCommandHandler(
    conversationService,
    existingServices.leadService,
    existingServices.inventoryService,
    existingServices.tripAssignmentRepo,
    existingServices.employeeRepo
  );

  const notificationService = new NotificationService(
    messageService,
    templateRepo,
    conversationRepo,
    timelineService
  );

  // ============================================
  // CONTROLLERS
  // ============================================

  const webhookController = new WebhookController(
    provider,
    conversationService,
    messageService,
    workflowOrchestrator
  );

  const conversationController = new ConversationController(
    conversationService,
    timelineService
  );

  const timelineController = new TimelineController(
    timelineService,
    timelineRepo
  );

  const templateController = new TemplateController(templateRepo);

  return {
    // Repositories
    conversationRepo,
    messageRepo,
    timelineRepo,
    optInRepo,
    templateRepo,

    // Provider
    provider,

    // Services
    conversationService,
    messageService,
    timelineService,
    workflowOrchestrator,
    commandHandler,
    notificationService,

    // Controllers
    webhookController,
    conversationController,
    timelineController,
    templateController,
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

      query += ` ORDER BY name`;
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
        `SELECT * FROM whatsapp_templates WHERE name = $1 AND tenant_id = $2`,
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
          id, tenant_id, name, category, language, status,
          components, variables, trigger_events, required_role,
          submitted_at, approved_at, rejected_at, rejection_reason,
          created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id)
        DO UPDATE SET
          category = EXCLUDED.category,
          status = EXCLUDED.status,
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
      const result = await pool.query(query, [
        template.id,
        template.tenantId,
        template.name,
        template.category,
        template.language,
        template.status,
        JSON.stringify(template.components),
        JSON.stringify(template.variables),
        template.triggerEvents,
        template.requiredRole,
        template.submittedAt,
        template.approvedAt,
        template.rejectedAt,
        template.rejectionReason,
        template.createdBy,
        template.createdAt,
        template.updatedAt,
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
