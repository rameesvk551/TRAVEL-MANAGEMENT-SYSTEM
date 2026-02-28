// presentation/controllers/whatsapp/TimelineController.ts

import { UnifiedTimelineEntry } from '../models/index.js';

export function createTimelineController(timelineService: any, timelineRepo: any) {
    const getLeadTimeline = async (req: any, res: any, next: any) => { try { const tenantId = req.context?.tenantId; const { leadId } = req.params; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const timeline = await timelineService.getTimeline('lead', leadId, tenantId); res.json({ data: timeline }); } catch (error) { next(error); } };
    const getBookingTimeline = async (req: any, res: any, next: any) => { try { const tenantId = req.context?.tenantId; const { bookingId } = req.params; const customerView = req.query.customer === 'true'; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const timeline = await timelineService.getTimeline('booking', bookingId, tenantId, customerView); res.json({ data: timeline }); } catch (error) { next(error); } };
    const getDepartureTimeline = async (req: any, res: any, next: any) => { try { const tenantId = req.context?.tenantId; const { departureId } = req.params; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const timeline = await timelineService.getTimeline('departure', departureId, tenantId); res.json({ data: timeline }); } catch (error) { next(error); } };
    const getTripTimeline = async (req: any, res: any, next: any) => { try { const tenantId = req.context?.tenantId; const { tripId } = req.params; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } const timeline = await timelineService.getTimeline('tripAssignment', tripId, tenantId); res.json({ data: timeline }); } catch (error) { next(error); } };
    const addNote = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId; const userId = req.context?.userId;
            const { entityType, entityId, title, description, visibility } = req.body;
            if (!tenantId || !userId) { res.status(401).json({ error: 'Authentication required' }); return; }
            const entry = UnifiedTimelineEntry.create({
                tenantId, leadId: entityType === 'lead' ? entityId : undefined, bookingId: entityType === 'booking' ? entityId : undefined,
                departureId: entityType === 'departure' ? entityId : undefined, tripAssignmentId: entityType === 'tripAssignment' ? entityId : undefined,
                source: 'MANUAL', entryType: 'STAFF_NOTE', visibility: visibility || 'INTERNAL',
                actorId: userId, actorType: 'USER', actorName: req.context?.userName || 'Staff',
                title, description, occurredAt: new Date(),
            });
            const saved = await timelineRepo.save(entry);
            res.json({ data: saved });
        } catch (error) { next(error); }
    };
    const search = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId; const query = req.query.q as string; if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; } if (!query) { res.status(400).json({ error: 'Search query required' }); return; } const results = await timelineRepo.search(tenantId, query, { limit: parseInt(req.query.limit) || 50 }); res.json({ data: results }); } catch (error) { next(error); }
    };
    return { getLeadTimeline, getBookingTimeline, getDepartureTimeline, getTripTimeline, addNote, search };
}
