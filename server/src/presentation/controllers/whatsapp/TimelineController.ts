// presentation/controllers/whatsapp/TimelineController.ts
// REST API for unified timeline

import { Request, Response, NextFunction } from 'express';
import { TimelineService } from '../../../application/services/whatsapp/index.js';
import { ITimelineRepository } from '../../../domain/interfaces/whatsapp/index.js';

/**
 * TimelineController - REST API for unified timeline
 */
export class TimelineController {
  constructor(
    private timelineService: TimelineService,
    private timelineRepo: ITimelineRepository
  ) {}

  /**
   * GET /timeline/lead/:leadId - Get timeline for lead
   */
  getLeadTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { leadId } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const timeline = await this.timelineService.getTimeline('lead', leadId, tenantId);
      res.json({ data: timeline });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /timeline/booking/:bookingId - Get timeline for booking
   */
  getBookingTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { bookingId } = req.params;
      const customerView = req.query.customer === 'true';

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const timeline = await this.timelineService.getTimeline(
        'booking',
        bookingId,
        tenantId,
        customerView
      );
      res.json({ data: timeline });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /timeline/departure/:departureId - Get timeline for departure
   */
  getDepartureTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { departureId } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const timeline = await this.timelineService.getTimeline('departure', departureId, tenantId);
      res.json({ data: timeline });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /timeline/trip/:tripId - Get timeline for trip assignment
   */
  getTripTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { tripId } = req.params;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      const timeline = await this.timelineService.getTimeline('tripAssignment', tripId, tenantId);
      res.json({ data: timeline });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /timeline/note - Add manual note to timeline
   */
  addNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;
      const { entityType, entityId, title, description, visibility } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Import UnifiedTimelineEntry
      const { UnifiedTimelineEntry } = await import('../../../domain/entities/whatsapp/index.js');

      const entry = UnifiedTimelineEntry.create({
        tenantId,
        leadId: entityType === 'lead' ? entityId : undefined,
        bookingId: entityType === 'booking' ? entityId : undefined,
        departureId: entityType === 'departure' ? entityId : undefined,
        tripAssignmentId: entityType === 'tripAssignment' ? entityId : undefined,
        source: 'MANUAL',
        entryType: 'STAFF_NOTE',
        visibility: visibility || 'INTERNAL',
        actorId: userId,
        actorType: 'USER',
        actorName: req.context?.userName || 'Staff',
        title,
        description,
        occurredAt: new Date(),
      });

      const saved = await this.timelineRepo.save(entry);
      res.json({ data: saved });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /timeline/search - Search timeline entries
   */
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const query = req.query.q as string;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      if (!query) {
        res.status(400).json({ error: 'Search query required' });
        return;
      }

      const results = await this.timelineRepo.search(tenantId, query, {
        limit: parseInt(req.query.limit as string) || 50,
      });

      res.json({ data: results });
    } catch (error) {
      next(error);
    }
  };
}
