// application/services/whatsapp/TimelineService.ts
// Unified timeline service for all business objects

import { ITimelineRepository } from '../../../domain/interfaces/whatsapp/ITimelineRepository.js';
import { TimelineEntry, TimelineObjectType, TimelineEventType, TimelineSource } from '../../../domain/entities/whatsapp/TimelineEntry.js';

export interface CreateTimelineEntryInput {
  objectType: TimelineObjectType;
  objectId: string;
  eventType: TimelineEventType;
  source: TimelineSource;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  actorPhone?: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class TimelineService {
  constructor(
    private timelineRepo: ITimelineRepository
  ) {}

  /**
   * Add entry to timeline
   */
  async addEntry(
    input: CreateTimelineEntryInput,
    tenantId: string
  ): Promise<TimelineEntry> {
    const entry = TimelineEntry.create({
      tenantId,
      objectType: input.objectType,
      objectId: input.objectId,
      eventType: input.eventType,
      source: input.source,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      actorPhone: input.actorPhone,
      content: input.content,
      metadata: input.metadata,
    });

    return await this.timelineRepo.save(entry);
  }

  /**
   * Add WhatsApp message to timeline
   */
  async addWhatsAppMessage(
    objectType: TimelineObjectType,
    objectId: string,
    messageText: string,
    direction: 'inbound' | 'outbound',
    actorPhone: string,
    tenantId: string,
    actorName?: string
  ): Promise<TimelineEntry> {
    return await this.addEntry({
      objectType,
      objectId,
      eventType: 'MESSAGE',
      source: 'WHATSAPP',
      actorName,
      actorPhone,
      content: {
        text: messageText,
        direction,
      },
    }, tenantId);
  }

  /**
   * Add status change to timeline
   */
  async addStatusChange(
    objectType: TimelineObjectType,
    objectId: string,
    oldStatus: string,
    newStatus: string,
    actorId: string,
    tenantId: string,
    source: TimelineSource = 'WEB'
  ): Promise<TimelineEntry> {
    return await this.addEntry({
      objectType,
      objectId,
      eventType: 'STATUS_CHANGE',
      source,
      actorId,
      content: {
        oldStatus,
        newStatus,
      },
    }, tenantId);
  }

  /**
   * Add media upload to timeline
   */
  async addMediaUpload(
    objectType: TimelineObjectType,
    objectId: string,
    mediaUrl: string,
    mediaType: string,
    actorPhone: string,
    tenantId: string
  ): Promise<TimelineEntry> {
    return await this.addEntry({
      objectType,
      objectId,
      eventType: 'MEDIA',
      source: 'WHATSAPP',
      actorPhone,
      content: {
        mediaUrl,
        mediaType,
      },
    }, tenantId);
  }

  /**
   * Add issue report to timeline
   */
  async addIssueReport(
    objectType: TimelineObjectType,
    objectId: string,
    issueDescription: string,
    actorId: string,
    tenantId: string
  ): Promise<TimelineEntry> {
    return await this.addEntry({
      objectType,
      objectId,
      eventType: 'ISSUE',
      source: 'WHATSAPP',
      actorId,
      content: {
        description: issueDescription,
        reportedAt: new Date(),
      },
    }, tenantId);
  }

  /**
   * Get timeline for an object
   */
  async getTimeline(
    objectType: string,
    objectId: string,
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TimelineEntry[]> {
    return await this.timelineRepo.findByObjectWithPagination(
      objectType,
      objectId,
      tenantId,
      limit,
      offset
    );
  }

  /**
   * Get recent timeline entries
   */
  async getRecent(
    tenantId: string,
    limit: number = 20
  ): Promise<TimelineEntry[]> {
    return await this.timelineRepo.findRecent(tenantId, limit);
  }

  /**
   * Get timeline by actor
   */
  async getByActor(
    actorId: string,
    tenantId: string
  ): Promise<TimelineEntry[]> {
    return await this.timelineRepo.findByActor(actorId, tenantId);
  }
}
