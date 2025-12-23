// domain/interfaces/whatsapp/ITimelineRepository.ts
// Repository interface for unified timeline

import {
  UnifiedTimelineEntry,
  UnifiedTimelineEntryProps,
  TimelineEntryType,
  TimelineEntrySource,
  TimelineVisibility,
} from '../../entities/whatsapp/UnifiedTimeline.js';

export interface TimelineFilters {
  entryType?: TimelineEntryType | TimelineEntryType[];
  source?: TimelineEntrySource;
  visibility?: TimelineVisibility;
  actorId?: string;
  occurredAfter?: Date;
  occurredBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface ITimelineRepository {
  /**
   * Find entry by ID
   */
  findById(id: string, tenantId: string): Promise<UnifiedTimelineEntry | null>;

  /**
   * Find entries for a lead
   */
  findByLead(
    leadId: string,
    tenantId: string,
    filters?: TimelineFilters
  ): Promise<UnifiedTimelineEntry[]>;

  /**
   * Find entries for a booking
   */
  findByBooking(
    bookingId: string,
    tenantId: string,
    filters?: TimelineFilters
  ): Promise<UnifiedTimelineEntry[]>;

  /**
   * Find entries for a departure
   */
  findByDeparture(
    departureId: string,
    tenantId: string,
    filters?: TimelineFilters
  ): Promise<UnifiedTimelineEntry[]>;

  /**
   * Find entries for a trip assignment
   */
  findByTripAssignment(
    tripAssignmentId: string,
    tenantId: string,
    filters?: TimelineFilters
  ): Promise<UnifiedTimelineEntry[]>;

  /**
   * Find entries visible to customer
   */
  findCustomerVisible(
    bookingId: string,
    tenantId: string
  ): Promise<UnifiedTimelineEntry[]>;

  /**
   * Find entries by WhatsApp message ID
   */
  findByWhatsAppMessageId(
    messageId: string,
    tenantId: string
  ): Promise<UnifiedTimelineEntry | null>;

  /**
   * Save timeline entry
   */
  save(entry: UnifiedTimelineEntry): Promise<UnifiedTimelineEntry>;

  /**
   * Bulk save timeline entries
   */
  saveMany(entries: UnifiedTimelineEntry[]): Promise<UnifiedTimelineEntry[]>;

  /**
   * Count entries for entity
   */
  countForEntity(
    entityType: 'lead' | 'booking' | 'departure' | 'tripAssignment',
    entityId: string,
    tenantId: string
  ): Promise<number>;

  /**
   * Get latest entry for entity
   */
  getLatest(
    entityType: 'lead' | 'booking' | 'departure' | 'tripAssignment',
    entityId: string,
    tenantId: string
  ): Promise<UnifiedTimelineEntry | null>;

  /**
   * Search entries by content
   */
  search(
    tenantId: string,
    query: string,
    filters?: TimelineFilters
  ): Promise<UnifiedTimelineEntry[]>;
}
