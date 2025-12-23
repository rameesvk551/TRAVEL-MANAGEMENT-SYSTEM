// application/services/whatsapp/TimelineService.ts
// Unified timeline management

import {
  UnifiedTimelineEntry,
  TimelineEntryType,
  TimelineEntrySource,
  TimelineMedia,
  TimelineLocation,
  WhatsAppMessage,
  ConversationContext,
} from '../../../domain/entities/whatsapp/index.js';
import { ITimelineRepository } from '../../../domain/interfaces/whatsapp/index.js';
import { TimelineEntryDTO } from '../../dtos/whatsapp/index.js';

/**
 * TimelineService - Creates and manages unified timeline entries
 * 
 * This service creates timeline entries from various sources,
 * providing a single view of all interactions.
 */
export class TimelineService {
  constructor(private timelineRepo: ITimelineRepository) {}

  /**
   * Record a WhatsApp message in timeline
   */
  async recordWhatsAppMessage(
    message: WhatsAppMessage,
    context: ConversationContext,
    direction: 'INBOUND' | 'OUTBOUND'
  ): Promise<UnifiedTimelineEntry> {
    const entryType: TimelineEntryType = direction === 'INBOUND' 
      ? 'MESSAGE_RECEIVED' 
      : 'MESSAGE_SENT';

    // Extract media if present
    let media: TimelineMedia[] | undefined;
    if (message.mediaContent) {
      media = [{
        type: message.messageType as 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT',
        url: message.mediaContent.downloadUrl || '',
        thumbnailUrl: message.mediaContent.thumbnailUrl,
        fileName: message.mediaContent.fileName,
        fileSize: message.mediaContent.fileSize,
        mimeType: message.mediaContent.mimeType,
      }];
    }

    // Extract location if present
    let location: TimelineLocation | undefined;
    if (message.locationContent) {
      location = {
        latitude: message.locationContent.latitude,
        longitude: message.locationContent.longitude,
        name: message.locationContent.name,
        address: message.locationContent.address,
      };
    }

    const entry = UnifiedTimelineEntry.create({
      tenantId: message.tenantId,
      leadId: message.linkedLeadId,
      bookingId: message.linkedBookingId,
      tripAssignmentId: message.linkedTripId,
      source: 'WHATSAPP',
      entryType,
      visibility: direction === 'OUTBOUND' ? 'PUBLIC' : 'INTERNAL',
      actorId: direction === 'INBOUND' 
        ? context.primaryActor.contactId || context.primaryActor.phoneNumber
        : message.handledByUserId || 'SYSTEM',
      actorType: direction === 'INBOUND' ? 'CONTACT' : 'USER',
      actorName: direction === 'INBOUND'
        ? context.primaryActor.displayName
        : 'Staff', // Would be resolved from user service
      actorPhone: context.primaryActor.phoneNumber,
      title: this.getMessageTitle(message, direction),
      description: message.textBody,
      media,
      location,
      whatsappMessageId: message.id,
      occurredAt: message.providerTimestamp,
    });

    return this.timelineRepo.save(entry);
  }

  /**
   * Record a status change
   */
  async recordStatusChange(
    tenantId: string,
    entityType: 'lead' | 'booking' | 'departure',
    entityId: string,
    previousStatus: string,
    newStatus: string,
    changedByUserId: string,
    changedByName: string,
    source: TimelineEntrySource = 'SYSTEM'
  ): Promise<UnifiedTimelineEntry> {
    const entry = UnifiedTimelineEntry.create({
      tenantId,
      leadId: entityType === 'lead' ? entityId : undefined,
      bookingId: entityType === 'booking' ? entityId : undefined,
      departureId: entityType === 'departure' ? entityId : undefined,
      source,
      entryType: 'STATUS_CHANGE',
      visibility: 'INTERNAL',
      actorId: changedByUserId,
      actorType: 'USER',
      actorName: changedByName,
      title: `Status changed: ${previousStatus} → ${newStatus}`,
      previousValue: previousStatus,
      newValue: newStatus,
      occurredAt: new Date(),
    });

    return this.timelineRepo.save(entry);
  }

  /**
   * Record payment event
   */
  async recordPaymentEvent(
    tenantId: string,
    bookingId: string,
    eventType: 'PAYMENT_LINK_SENT' | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'REFUND_ISSUED',
    amount: number,
    currency: string,
    actorName: string,
    actorId: string
  ): Promise<UnifiedTimelineEntry> {
    const titles: Record<string, string> = {
      PAYMENT_LINK_SENT: `Payment link sent: ${currency} ${amount}`,
      PAYMENT_RECEIVED: `Payment received: ${currency} ${amount}`,
      PAYMENT_FAILED: `Payment failed: ${currency} ${amount}`,
      REFUND_ISSUED: `Refund issued: ${currency} ${amount}`,
    };

    const entry = UnifiedTimelineEntry.create({
      tenantId,
      bookingId,
      source: 'PAYMENT_GATEWAY',
      entryType: eventType,
      visibility: 'PUBLIC',
      actorId,
      actorType: 'USER',
      actorName,
      title: titles[eventType],
      metadata: { amount, currency },
      occurredAt: new Date(),
    });

    return this.timelineRepo.save(entry);
  }

  /**
   * Record trip event (for field staff)
   */
  async recordTripEvent(
    tenantId: string,
    tripAssignmentId: string,
    departureId: string,
    eventType: 'TRIP_STARTED' | 'TRIP_CHECKPOINT' | 'TRIP_INCIDENT' | 'TRIP_ENDED',
    employeeId: string,
    employeeName: string,
    description?: string,
    media?: TimelineMedia[],
    location?: TimelineLocation
  ): Promise<UnifiedTimelineEntry> {
    const titles: Record<string, string> = {
      TRIP_STARTED: 'Trip started',
      TRIP_CHECKPOINT: 'Checkpoint reached',
      TRIP_INCIDENT: 'Incident reported',
      TRIP_ENDED: 'Trip completed',
    };

    const entry = UnifiedTimelineEntry.create({
      tenantId,
      tripAssignmentId,
      departureId,
      source: 'FIELD_APP',
      entryType: eventType,
      visibility: eventType === 'TRIP_INCIDENT' ? 'INTERNAL' : 'PUBLIC',
      actorId: employeeId,
      actorType: 'EMPLOYEE',
      actorName: employeeName,
      title: titles[eventType],
      description,
      media,
      location,
      occurredAt: new Date(),
    });

    return this.timelineRepo.save(entry);
  }

  /**
   * Record document/media upload
   */
  async recordMediaUpload(
    tenantId: string,
    entityType: 'lead' | 'booking' | 'tripAssignment',
    entityId: string,
    media: TimelineMedia,
    uploadedByName: string,
    uploadedById: string
  ): Promise<UnifiedTimelineEntry> {
    const entryType: TimelineEntryType = media.type === 'IMAGE' 
      ? 'PHOTO_UPLOADED' 
      : 'DOCUMENT_UPLOADED';

    const entry = UnifiedTimelineEntry.create({
      tenantId,
      leadId: entityType === 'lead' ? entityId : undefined,
      bookingId: entityType === 'booking' ? entityId : undefined,
      tripAssignmentId: entityType === 'tripAssignment' ? entityId : undefined,
      source: 'WHATSAPP',
      entryType,
      visibility: 'INTERNAL',
      actorId: uploadedById,
      actorType: 'USER',
      actorName: uploadedByName,
      title: `${media.type.toLowerCase()} uploaded${media.fileName ? `: ${media.fileName}` : ''}`,
      media: [media],
      occurredAt: new Date(),
    });

    return this.timelineRepo.save(entry);
  }

  /**
   * Get timeline for entity
   */
  async getTimeline(
    entityType: 'lead' | 'booking' | 'departure' | 'tripAssignment',
    entityId: string,
    tenantId: string,
    customerVisible?: boolean
  ): Promise<TimelineEntryDTO[]> {
    let entries: UnifiedTimelineEntry[];

    switch (entityType) {
      case 'lead':
        entries = await this.timelineRepo.findByLead(entityId, tenantId);
        break;
      case 'booking':
        entries = customerVisible
          ? await this.timelineRepo.findCustomerVisible(entityId, tenantId)
          : await this.timelineRepo.findByBooking(entityId, tenantId);
        break;
      case 'departure':
        entries = await this.timelineRepo.findByDeparture(entityId, tenantId);
        break;
      case 'tripAssignment':
        entries = await this.timelineRepo.findByTripAssignment(entityId, tenantId);
        break;
    }

    return entries.map(this.toDTO);
  }

  /**
   * Map to DTO
   */
  private toDTO(entry: UnifiedTimelineEntry): TimelineEntryDTO {
    return {
      id: entry.id,
      entryType: entry.entryType,
      title: entry.title,
      description: entry.description,
      actorName: entry.actorName,
      timestamp: entry.occurredAt,
      metadata: entry.metadata,
    };
  }

  /**
   * Generate message title
   */
  private getMessageTitle(message: WhatsAppMessage, direction: 'INBOUND' | 'OUTBOUND'): string {
    const prefix = direction === 'INBOUND' ? 'Received' : 'Sent';
    
    switch (message.messageType) {
      case 'TEXT':
        return `${prefix} message`;
      case 'IMAGE':
        return `${prefix} image`;
      case 'VIDEO':
        return `${prefix} video`;
      case 'DOCUMENT':
        return `${prefix} document`;
      case 'AUDIO':
        return `${prefix} voice message`;
      case 'LOCATION':
        return `${prefix} location`;
      case 'TEMPLATE':
        return `${prefix} template: ${message.templateContent?.templateName}`;
      case 'INTERACTIVE':
        return `${prefix} interactive message`;
      default:
        return `${prefix} message`;
    }
  }
}
