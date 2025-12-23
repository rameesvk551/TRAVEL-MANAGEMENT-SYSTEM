// infrastructure/whatsapp/integration.ts
// Integration point for WhatsApp layer with existing TMS

import { Express, json } from 'express';
import { Pool } from 'pg';
import { createWhatsAppContainer, WhatsAppContainer } from './container.js';
import { createWhatsAppRoutes } from '../../presentation/routes/whatsapp.routes.js';
import { captureRawBody } from '../../presentation/middleware/whatsapp/index.js';

/**
 * Integration options for WhatsApp layer
 */
export interface WhatsAppIntegrationOptions {
  /** Base path for WhatsApp routes (default: /api/whatsapp) */
  basePath?: string;

  /** Existing auth middleware */
  authMiddleware: (req: any, res: any, next: any) => void;

  /** Existing tenant middleware */
  tenantMiddleware: (req: any, res: any, next: any) => void;

  /** Existing services to connect to */
  services?: {
    leadService?: any;
    bookingService?: any;
    inventoryService?: any;
    paymentRepo?: any;
    employeeRepo?: any;
    tripAssignmentRepo?: any;
  };

  /** Event emitter for publishing events */
  eventEmitter?: any;
}

/**
 * Initialize WhatsApp integration layer
 *
 * @example
 * ```typescript
 * import { initializeWhatsApp } from './infrastructure/whatsapp/integration';
 *
 * // In your app setup (app.ts)
 * const whatsApp = await initializeWhatsApp(app, pool, {
 *   authMiddleware: authenticate,
 *   tenantMiddleware: tenantContext,
 *   services: {
 *     leadService,
 *     bookingService,
 *     inventoryService,
 *   },
 * });
 * ```
 */
export async function initializeWhatsApp(
  app: Express,
  pool: Pool,
  options: WhatsAppIntegrationOptions
): Promise<WhatsAppContainer> {
  const basePath = options.basePath || '/api/whatsapp';

  // Create dependency container
  const container = createWhatsAppContainer(pool, options.services || {});

  // Create routes with injected dependencies
  const routes = createWhatsAppRoutes({
    webhookController: container.webhookController,
    conversationController: container.conversationController,
    timelineController: container.timelineController,
    templateController: container.templateController,
    optInRepo: container.optInRepo,
    authMiddleware: options.authMiddleware,
    tenantMiddleware: options.tenantMiddleware,
  });

  // Configure raw body parsing for webhook signature validation
  // This must be done BEFORE the routes are mounted
  app.use(
    `${basePath}/webhook*`,
    json({
      verify: captureRawBody,
    })
  );

  // Mount WhatsApp routes
  app.use(basePath, routes);

  console.log(`WhatsApp integration initialized at ${basePath}`);

  // Set up event listeners if event emitter provided
  if (options.eventEmitter) {
    setupEventListeners(container, options.eventEmitter);
  }

  return container;
}

/**
 * Set up event listeners for automatic notifications
 */
function setupEventListeners(
  container: WhatsAppContainer,
  eventEmitter: any
): void {
  const { notificationService, timelineService } = container;

  // Lead events
  eventEmitter.on('lead.created', async (data: any) => {
    await timelineService.recordEvent('lead', data.leadId, {
      entryType: 'STATUS_CHANGE',
      title: 'Lead Created',
      description: `New lead: ${data.name}`,
      visibility: 'INTERNAL',
    });
  });

  eventEmitter.on('lead.stage_changed', async (data: any) => {
    await timelineService.recordEvent('lead', data.leadId, {
      entryType: 'STATUS_CHANGE',
      title: 'Stage Changed',
      description: `Stage: ${data.fromStage} → ${data.toStage}`,
      oldValue: data.fromStage,
      newValue: data.toStage,
      visibility: 'INTERNAL',
    });

    // Send notification if configured
    await notificationService.sendTriggerNotification(
      'lead.stage_changed',
      data.leadId,
      'lead',
      data.tenantId,
      data
    );
  });

  // Booking events
  eventEmitter.on('booking.created', async (data: any) => {
    await timelineService.recordEvent('booking', data.bookingId, {
      entryType: 'STATUS_CHANGE',
      title: 'Booking Created',
      description: `Booking #${data.bookingNumber} created`,
      visibility: 'CUSTOMER',
    });

    await notificationService.sendTriggerNotification(
      'booking.created',
      data.bookingId,
      'booking',
      data.tenantId,
      data
    );
  });

  eventEmitter.on('booking.confirmed', async (data: any) => {
    await timelineService.recordEvent('booking', data.bookingId, {
      entryType: 'STATUS_CHANGE',
      title: 'Booking Confirmed',
      description: 'Your booking has been confirmed!',
      visibility: 'CUSTOMER',
    });

    await notificationService.sendTriggerNotification(
      'booking.confirmed',
      data.bookingId,
      'booking',
      data.tenantId,
      data
    );
  });

  // Payment events
  eventEmitter.on('payment.completed', async (data: any) => {
    await timelineService.recordEvent('booking', data.bookingId, {
      entryType: 'PAYMENT',
      title: 'Payment Received',
      description: `Payment of ${data.amount} ${data.currency} received`,
      visibility: 'CUSTOMER',
    });

    await notificationService.sendTriggerNotification(
      'payment.received',
      data.bookingId,
      'booking',
      data.tenantId,
      data
    );
  });

  // Departure events
  eventEmitter.on('departure.tomorrow', async (data: any) => {
    await notificationService.sendTriggerNotification(
      'departure.tomorrow',
      data.departureId,
      'departure',
      data.tenantId,
      data
    );
  });

  eventEmitter.on('departure.started', async (data: any) => {
    await timelineService.recordEvent('departure', data.departureId, {
      entryType: 'STATUS_CHANGE',
      title: 'Trip Started',
      description: 'Your trip has officially begun!',
      visibility: 'CUSTOMER',
    });
  });

  // Assignment events
  eventEmitter.on('assignment.proposed', async (data: any) => {
    await timelineService.recordEvent('tripAssignment', data.assignmentId, {
      entryType: 'STATUS_CHANGE',
      title: 'Assignment Proposed',
      description: `You've been proposed for ${data.tripName}`,
      visibility: 'INTERNAL',
    });

    await notificationService.sendTriggerNotification(
      'assignment.proposed',
      data.assignmentId,
      'tripAssignment',
      data.tenantId,
      data
    );
  });

  console.log('WhatsApp event listeners registered');
}

/**
 * Get WhatsApp health status
 */
export async function getWhatsAppHealth(container: WhatsAppContainer): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  provider: { name: string; status: string };
  database: { status: string };
}> {
  const providerHealth = await container.provider.healthCheck?.() || { status: 'unknown' };

  return {
    status: 'healthy',
    provider: {
      name: container.provider.constructor.name,
      status: providerHealth.status || 'unknown',
    },
    database: {
      status: 'connected',
    },
  };
}

export default initializeWhatsApp;
