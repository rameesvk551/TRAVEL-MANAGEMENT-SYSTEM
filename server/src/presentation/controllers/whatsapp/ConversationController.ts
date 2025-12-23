// presentation/controllers/whatsapp/ConversationController.ts
// REST API for conversation management

import { Request, Response, NextFunction } from 'express';
import {
  ConversationService,
  MessageService,
  TimelineService,
} from '../../../application/services/whatsapp/index.js';
import { IConversationRepository } from '../../../domain/interfaces/whatsapp/index.js';

/**
 * ConversationController - REST API for conversations
 */
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
    private timelineService: TimelineService,
    private conversationRepo: IConversationRepository
  ) {}

  /**
   * GET /conversations - List conversations
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const filters = {
        state: req.query.state as any,
        isEscalated: req.query.escalated === 'true' ? true : undefined,
        phoneNumber: req.query.phone as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const conversations = await this.conversationService.getConversations(tenantId, filters);
      
      res.json({
        data: conversations,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /conversations/:id - Get conversation detail
   */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const conversation = await this.conversationRepo.findById(id, tenantId);
      if (!conversation) {
        res.status(404).json({ error: 'Conversation not found' });
        return;
      }

      // Get messages and timeline
      const [messages, timeline] = await Promise.all([
        this.messageService.getMessagesByConversation(id, tenantId),
        this.timelineService.getTimelineByConversation(id, tenantId),
      ]);

      res.json({
        data: {
          conversation,
          messages,
          timeline,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/send - Send message
   */
  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;
      const { id } = req.params;
      const { text, recipientPhone } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await this.messageService.sendText({
        tenantId,
        recipientPhone,
        text,
        senderUserId: userId,
        linkTo: id ? { type: 'LEAD', entityId: id } : undefined,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/template - Send template message
   */
  sendTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;
      const { recipientPhone, templateName, language, variables } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const result = await this.messageService.sendTemplate({
        tenantId,
        recipientPhone,
        templateName,
        language,
        variables,
        senderUserId: userId,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/link - Link to business entity
   */
  linkEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { entityType, entityId, makePrimary } = req.body;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const updated = await this.conversationService.linkToEntity(
        id,
        tenantId,
        entityType,
        entityId,
        makePrimary
      );

      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /conversations/:id/escalate - Escalate to human
   */
  escalate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { id } = req.params;
      const { reason } = req.body;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const updated = await this.conversationService.escalate(id, tenantId, reason);
      res.json({ data: updated });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /conversations/escalated - Get escalated conversations
   */
  getEscalated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const conversations = await this.conversationRepo.findPendingReview(tenantId);
      res.json({ data: conversations });
    } catch (error) {
      next(error);
    }
  };
}
