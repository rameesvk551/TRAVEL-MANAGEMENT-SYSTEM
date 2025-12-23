// presentation/controllers/whatsapp/TemplateController.ts
// REST API for managing message templates

import { Request, Response, NextFunction } from 'express';
import { MessageTemplate } from '../../../domain/entities/whatsapp/index.js';

/**
 * TemplateController - Manage WhatsApp message templates
 */
export class TemplateController {
  constructor(private templateRepo: any) {} // Will be injected

  /**
   * GET /templates - List all templates for tenant
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { category, status, language } = req.query;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const templates = await this.templateRepo.findByTenant(tenantId, {
        category: category as string,
        status: status as string,
        language: language as string,
      });

      res.json({ data: templates });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /templates/:id - Get template by ID
   */
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const template = await this.templateRepo.findById(id, tenantId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json({ data: template });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /templates - Create new template
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const {
        name,
        category,
        language,
        components,
        variables,
        triggerEvents,
        requiredRole,
        testPhone,
      } = req.body;

      const template = MessageTemplate.create({
        tenantId,
        name,
        category,
        language: language || 'en',
        components,
        variables: variables || [],
        triggerEvents: triggerEvents || [],
        requiredRole,
        createdBy: userId,
      });

      const saved = await this.templateRepo.save(template);
      res.status(201).json({ data: saved });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /templates/:id - Update template
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const template = await this.templateRepo.findById(id, tenantId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      // Update allowed fields
      const { components, variables, triggerEvents, requiredRole } = req.body;

      if (components) template.components = components;
      if (variables) template.variables = variables;
      if (triggerEvents) template.triggerEvents = triggerEvents;
      if (requiredRole !== undefined) template.requiredRole = requiredRole;

      // If template was approved, mark as pending for re-review
      if (template.status === 'APPROVED' && components) {
        template.status = 'PENDING';
      }

      const saved = await this.templateRepo.save(template);
      res.json({ data: saved });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /templates/:id/submit - Submit template for approval
   */
  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const template = await this.templateRepo.findById(id, tenantId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      template.status = 'PENDING';
      template.submittedAt = new Date();

      // TODO: Call WhatsApp Business API to submit template
      // For now, just update local status

      const saved = await this.templateRepo.save(template);
      res.json({ data: saved, message: 'Template submitted for approval' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /templates/:id/test - Send test message with template
   */
  test = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { phone, variables } = req.body;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const template = await this.templateRepo.findById(id, tenantId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      // TODO: Send test message via WhatsApp provider
      // This should use MessageService.sendTemplate

      res.json({ 
        success: true, 
        message: `Test message would be sent to ${phone}`,
        preview: template.render(variables || {}),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /templates/:id - Delete template
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const template = await this.templateRepo.findById(id, tenantId);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      // Don't delete if approved and in use
      if (template.status === 'APPROVED') {
        // Soft delete - mark as inactive
        template.status = 'DRAFT';
        template.isActive = false;
        await this.templateRepo.save(template);
      } else {
        await this.templateRepo.delete(id, tenantId);
      }

      res.json({ success: true, message: 'Template deleted' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /templates/categories - Get available template categories
   */
  getCategories = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      data: [
        { value: 'MARKETING', label: 'Marketing', description: 'Promotional messages' },
        { value: 'UTILITY', label: 'Utility', description: 'Transactional updates' },
        { value: 'AUTHENTICATION', label: 'Authentication', description: 'OTP and login' },
        { value: 'SERVICE', label: 'Service', description: 'Customer service' },
      ],
    });
  };

  /**
   * GET /templates/triggers - Get available trigger events
   */
  getTriggers = async (_req: Request, res: Response): Promise<void> => {
    res.json({
      data: [
        // Lead triggers
        { value: 'lead.created', label: 'Lead Created', entity: 'lead' },
        { value: 'lead.stage_changed', label: 'Lead Stage Changed', entity: 'lead' },
        { value: 'lead.quote_sent', label: 'Quote Sent', entity: 'lead' },
        // Booking triggers
        { value: 'booking.created', label: 'Booking Created', entity: 'booking' },
        { value: 'booking.confirmed', label: 'Booking Confirmed', entity: 'booking' },
        { value: 'booking.payment_received', label: 'Payment Received', entity: 'booking' },
        { value: 'booking.cancelled', label: 'Booking Cancelled', entity: 'booking' },
        { value: 'booking.reminder', label: 'Trip Reminder', entity: 'booking' },
        // Departure triggers
        { value: 'departure.opened', label: 'Departure Opened', entity: 'departure' },
        { value: 'departure.few_left', label: 'Few Spots Left', entity: 'departure' },
        { value: 'departure.full', label: 'Departure Full', entity: 'departure' },
        { value: 'departure.tomorrow', label: 'Departure Tomorrow', entity: 'departure' },
        { value: 'departure.started', label: 'Trip Started', entity: 'departure' },
        { value: 'departure.ended', label: 'Trip Ended', entity: 'departure' },
        // Payment triggers
        { value: 'payment.due', label: 'Payment Due', entity: 'payment' },
        { value: 'payment.overdue', label: 'Payment Overdue', entity: 'payment' },
        { value: 'payment.refunded', label: 'Payment Refunded', entity: 'payment' },
        // Staff triggers
        { value: 'assignment.proposed', label: 'Assignment Proposed', entity: 'tripAssignment' },
        { value: 'assignment.confirmed', label: 'Assignment Confirmed', entity: 'tripAssignment' },
        // Issue triggers
        { value: 'issue.reported', label: 'Issue Reported', entity: 'issue' },
        { value: 'issue.escalated', label: 'Issue Escalated', entity: 'issue' },
        { value: 'issue.resolved', label: 'Issue Resolved', entity: 'issue' },
      ],
    });
  };
}
