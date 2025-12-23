// domain/entities/whatsapp/UnifiedTimeline.ts
// Single source of truth for all interactions

import { generateId } from '../../../shared/utils/index.js';

/**
 * Entry source - where did this timeline entry originate
 */
export type TimelineEntrySource = 
  | 'WHATSAPP'
  | 'SYSTEM'
  | 'CRM'
  | 'BOOKING_ENGINE'
  | 'PAYMENT_GATEWAY'
  | 'HRMS'
  | 'FIELD_APP'
  | 'MANUAL';

/**
 * Entry type categorization
 */
export type TimelineEntryType = 
  // Communication
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'CALL_MADE'
  | 'EMAIL_SENT'
  
  // Status changes
  | 'STATUS_CHANGE'
  | 'STAGE_CHANGE'
  
  // Booking lifecycle
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_MODIFIED'
  
  // Payment events
  | 'PAYMENT_LINK_SENT'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REFUND_ISSUED'
  
  // Trip events
  | 'TRIP_STARTED'
  | 'TRIP_CHECKPOINT'
  | 'TRIP_INCIDENT'
  | 'TRIP_ENDED'
  
  // Media
  | 'PHOTO_UPLOADED'
  | 'DOCUMENT_UPLOADED'
  | 'LOCATION_SHARED'
  
  // Staff actions
  | 'STAFF_ASSIGNED'
  | 'STAFF_CHECKIN'
  | 'STAFF_NOTE'
  
  // System
  | 'SYSTEM_NOTE'
  | 'REMINDER_SENT'
  | 'ESCALATION';

/**
 * Visibility control
 */
export type TimelineVisibility = 
  | 'PUBLIC'     // Customer can see
  | 'INTERNAL'   // Staff only
  | 'PRIVATE';   // Creator only

export interface TimelineMedia {
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface TimelineLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  accuracy?: number;
}

export interface UnifiedTimelineEntryProps {
  id?: string;
  tenantId: string;
  
  // Parent entity (one of these must be set)
  leadId?: string;
  bookingId?: string;
  departureId?: string;
  tripAssignmentId?: string;
  
  // Entry details
  source: TimelineEntrySource;
  entryType: TimelineEntryType;
  visibility: TimelineVisibility;
  
  // Actor
  actorId: string;          // User/Employee/Contact ID
  actorType: 'USER' | 'EMPLOYEE' | 'CONTACT' | 'SYSTEM';
  actorName: string;
  actorPhone?: string;
  
  // Content
  title: string;
  description?: string;
  
  // Rich content
  media?: TimelineMedia[];
  location?: TimelineLocation;
  
  // Reference to original message/event
  whatsappMessageId?: string;
  externalRef?: string;
  
  // Metadata for entry-type specific data
  metadata?: Record<string, unknown>;
  
  // Change tracking (for status changes)
  previousValue?: string;
  newValue?: string;
  
  // Timestamps
  occurredAt: Date;
  createdAt?: Date;
}

/**
 * UnifiedTimelineEntry - Single timeline for all business objects
 * 
 * CRITICAL: This is the source of truth for "what happened".
 * All WhatsApp messages, payments, status changes flow here.
 */
export class UnifiedTimelineEntry {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly leadId?: string;
  public readonly bookingId?: string;
  public readonly departureId?: string;
  public readonly tripAssignmentId?: string;
  public readonly source: TimelineEntrySource;
  public readonly entryType: TimelineEntryType;
  public readonly visibility: TimelineVisibility;
  public readonly actorId: string;
  public readonly actorType: 'USER' | 'EMPLOYEE' | 'CONTACT' | 'SYSTEM';
  public readonly actorName: string;
  public readonly actorPhone?: string;
  public readonly title: string;
  public readonly description?: string;
  public readonly media?: TimelineMedia[];
  public readonly location?: TimelineLocation;
  public readonly whatsappMessageId?: string;
  public readonly externalRef?: string;
  public readonly metadata: Record<string, unknown>;
  public readonly previousValue?: string;
  public readonly newValue?: string;
  public readonly occurredAt: Date;
  public readonly createdAt: Date;

  private constructor(props: UnifiedTimelineEntryProps) {
    this.id = props.id!;
    this.tenantId = props.tenantId;
    this.leadId = props.leadId;
    this.bookingId = props.bookingId;
    this.departureId = props.departureId;
    this.tripAssignmentId = props.tripAssignmentId;
    this.source = props.source;
    this.entryType = props.entryType;
    this.visibility = props.visibility;
    this.actorId = props.actorId;
    this.actorType = props.actorType;
    this.actorName = props.actorName;
    this.actorPhone = props.actorPhone;
    this.title = props.title;
    this.description = props.description;
    this.media = props.media;
    this.location = props.location;
    this.whatsappMessageId = props.whatsappMessageId;
    this.externalRef = props.externalRef;
    this.metadata = props.metadata ?? {};
    this.previousValue = props.previousValue;
    this.newValue = props.newValue;
    this.occurredAt = props.occurredAt;
    this.createdAt = props.createdAt!;
  }

  static create(props: UnifiedTimelineEntryProps): UnifiedTimelineEntry {
    const now = new Date();
    return new UnifiedTimelineEntry({
      id: props.id ?? generateId(),
      ...props,
      visibility: props.visibility ?? 'INTERNAL',
      occurredAt: props.occurredAt ?? now,
      createdAt: props.createdAt ?? now,
    });
  }

  static fromPersistence(data: UnifiedTimelineEntryProps): UnifiedTimelineEntry {
    return new UnifiedTimelineEntry(data);
  }

  /**
   * Check if customer can see this entry
   */
  get isCustomerVisible(): boolean {
    return this.visibility === 'PUBLIC';
  }
}
