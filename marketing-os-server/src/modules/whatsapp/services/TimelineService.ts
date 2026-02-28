// application/services/whatsapp/TimelineService.ts
// Unified timeline management

import { UnifiedTimelineEntry } from '../models/index.js';

export function createTimelineService(timelineRepo: any) {

    function getMessageTitle(message: any, direction: string) {
        const prefix = direction === 'INBOUND' ? 'Received' : 'Sent';
        switch (message.messageType) {
            case 'TEXT': return `${prefix} message`;
            case 'IMAGE': return `${prefix} image`;
            case 'VIDEO': return `${prefix} video`;
            case 'DOCUMENT': return `${prefix} document`;
            case 'AUDIO': return `${prefix} voice message`;
            case 'LOCATION': return `${prefix} location`;
            case 'TEMPLATE': return `${prefix} template: ${message.templateContent?.templateName}`;
            case 'INTERACTIVE': return `${prefix} interactive message`;
            default: return `${prefix} message`;
        }
    }

    function toDTO(entry: any) {
        return { id: entry.id, entryType: entry.entryType, title: entry.title, description: entry.description, actorName: entry.actorName, timestamp: entry.occurredAt, metadata: entry.metadata };
    }

    async function recordEvent(entityType: string, entityId: string, payload: any) {
        const entry = UnifiedTimelineEntry.create({
            tenantId: payload.tenantId || 'unknown',
            leadId: entityType === 'lead' ? entityId : undefined,
            bookingId: entityType === 'booking' ? entityId : undefined,
            tripAssignmentId: entityType === 'tripAssignment' ? entityId : undefined,
            departureId: entityType === 'departure' ? entityId : undefined,
            source: payload.source || 'SYSTEM', entryType: payload.entryType || 'SYSTEM_EVENT',
            visibility: payload.visibility || 'INTERNAL', actorId: 'SYSTEM', actorType: 'SYSTEM', actorName: 'System',
            title: payload.title || 'System Event', description: payload.description,
            metadata: { ...payload, oldValue: payload.oldValue, newValue: payload.newValue }, occurredAt: new Date(),
        });
        return timelineRepo.save(entry);
    }

    async function recordWhatsAppMessage(message: any, context: any, direction: string) {
        const entryType = direction === 'INBOUND' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT';
        let media;
        if (message.mediaContent) {
            media = [{ type: message.messageType, url: message.mediaContent.downloadUrl || '', thumbnailUrl: message.mediaContent.thumbnailUrl, fileName: message.mediaContent.fileName, fileSize: message.mediaContent.fileSize, mimeType: message.mediaContent.mimeType }];
        }
        let location;
        if (message.locationContent) {
            location = { latitude: message.locationContent.latitude, longitude: message.locationContent.longitude, name: message.locationContent.name, address: message.locationContent.address };
        }
        const entry = UnifiedTimelineEntry.create({
            tenantId: message.tenantId, leadId: message.linkedLeadId, bookingId: message.linkedBookingId,
            tripAssignmentId: message.linkedTripId, source: 'WHATSAPP', entryType,
            visibility: direction === 'OUTBOUND' ? 'PUBLIC' : 'INTERNAL',
            actorId: direction === 'INBOUND' ? context.primaryActor.contactId || context.primaryActor.phoneNumber || 'unknown' : message.handledByUserId || 'SYSTEM',
            actorType: direction === 'INBOUND' ? 'CONTACT' : 'USER',
            actorName: direction === 'INBOUND' ? context.primaryActor.displayName : 'Staff',
            actorPhone: context.primaryActor.phoneNumber || '',
            title: getMessageTitle(message, direction), description: message.textBody, media, location,
            whatsappMessageId: message.id, occurredAt: message.providerTimestamp,
        });
        return timelineRepo.save(entry);
    }

    async function recordStatusChange(tenantId: string, entityType: string, entityId: string, previousStatus: string, newStatus: string, changedByUserId: string, changedByName: string, source: string = 'SYSTEM') {
        const entry = UnifiedTimelineEntry.create({
            tenantId, leadId: entityType === 'lead' ? entityId : undefined,
            bookingId: entityType === 'booking' ? entityId : undefined,
            departureId: entityType === 'departure' ? entityId : undefined,
            source: source as any, entryType: 'STATUS_CHANGE', visibility: 'INTERNAL',
            actorId: changedByUserId, actorType: 'USER', actorName: changedByName,
            title: `Status changed: ${previousStatus} → ${newStatus}`,
            previousValue: previousStatus, newValue: newStatus, occurredAt: new Date(),
        });
        return timelineRepo.save(entry);
    }

    async function recordPaymentEvent(tenantId: string, bookingId: string, eventType: string, amount: number, currency: string, actorName: string, actorId: string) {
        const titles: any = { PAYMENT_LINK_SENT: `Payment link sent: ${currency} ${amount}`, PAYMENT_RECEIVED: `Payment received: ${currency} ${amount}`, PAYMENT_FAILED: `Payment failed: ${currency} ${amount}`, REFUND_ISSUED: `Refund issued: ${currency} ${amount}` };
        const entry = UnifiedTimelineEntry.create({
            tenantId, bookingId, source: 'PAYMENT_GATEWAY', entryType: eventType as any, visibility: 'PUBLIC',
            actorId, actorType: 'USER', actorName, title: titles[eventType], metadata: { amount, currency }, occurredAt: new Date(),
        });
        return timelineRepo.save(entry);
    }

    async function recordTripEvent(tenantId: string, tripAssignmentId: string, departureId: string, eventType: string, employeeId: string, employeeName: string, description: string, media?: any, location?: any) {
        const titles: any = { TRIP_STARTED: 'Trip started', TRIP_CHECKPOINT: 'Checkpoint reached', TRIP_INCIDENT: 'Incident reported', TRIP_ENDED: 'Trip completed' };
        const entry = UnifiedTimelineEntry.create({
            tenantId, tripAssignmentId, departureId, source: 'FIELD_APP', entryType: eventType as any,
            visibility: eventType === 'TRIP_INCIDENT' ? 'INTERNAL' : 'PUBLIC',
            actorId: employeeId, actorType: 'EMPLOYEE', actorName: employeeName,
            title: titles[eventType], description, media, location, occurredAt: new Date(),
        });
        return timelineRepo.save(entry);
    }

    async function recordMediaUpload(tenantId: string, entityType: string, entityId: string, media: any, uploadedByName: string, uploadedById: string) {
        const entryType = media.type === 'IMAGE' ? 'PHOTO_UPLOADED' : 'DOCUMENT_UPLOADED';
        const entry = UnifiedTimelineEntry.create({
            tenantId, leadId: entityType === 'lead' ? entityId : undefined,
            bookingId: entityType === 'booking' ? entityId : undefined,
            tripAssignmentId: entityType === 'tripAssignment' ? entityId : undefined,
            source: 'WHATSAPP', entryType, visibility: 'INTERNAL',
            actorId: uploadedById, actorType: 'USER', actorName: uploadedByName,
            title: `${media.type.toLowerCase()} uploaded${media.fileName ? `: ${media.fileName}` : ''}`,
            media: [media], occurredAt: new Date(),
        });
        return timelineRepo.save(entry);
    }

    async function getTimeline(entityType: string, entityId: string, tenantId: string, customerVisible?: boolean) {
        let entries: any[];
        switch (entityType) {
            case 'lead': entries = await timelineRepo.findByLead(entityId, tenantId); break;
            case 'booking': entries = customerVisible ? await timelineRepo.findCustomerVisible(entityId, tenantId) : await timelineRepo.findByBooking(entityId, tenantId); break;
            case 'departure': entries = await timelineRepo.findByDeparture(entityId, tenantId); break;
            case 'tripAssignment': entries = await timelineRepo.findByTripAssignment(entityId, tenantId); break;
            default: entries = [];
        }
        return entries.map(toDTO);
    }

    async function getTimelineByConversation(conversationId: string, tenantId: string) { return []; }

    return {
        recordEvent, recordWhatsAppMessage, recordStatusChange, recordPaymentEvent,
        recordTripEvent, recordMediaUpload, getTimeline, getTimelineByConversation, toDTO, getMessageTitle,
    };
}
