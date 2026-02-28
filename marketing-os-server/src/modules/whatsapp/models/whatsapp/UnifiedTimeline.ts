// domain/entities/whatsapp/UnifiedTimeline.ts
// Single source of truth for all interactions

import { generateId } from '../../../../shared/utils/index.js';

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
function _createUnifiedTimelineEntry(props: UnifiedTimelineEntryProps) {
    return {
        id: props.id!,
        tenantId: props.tenantId,
        leadId: props.leadId,
        bookingId: props.bookingId,
        departureId: props.departureId,
        tripAssignmentId: props.tripAssignmentId,
        source: props.source,
        entryType: props.entryType,
        visibility: props.visibility,
        actorId: props.actorId,
        actorType: props.actorType,
        actorName: props.actorName,
        actorPhone: props.actorPhone,
        title: props.title,
        description: props.description,
        media: props.media,
        location: props.location,
        whatsappMessageId: props.whatsappMessageId,
        externalRef: props.externalRef,
        metadata: props.metadata ?? {},
        previousValue: props.previousValue,
        newValue: props.newValue,
        occurredAt: props.occurredAt,
        createdAt: props.createdAt!,
        get isCustomerVisible(): boolean { return props.visibility === 'PUBLIC'; },
        get oldValue(): string | undefined { return props.previousValue; },
        get mediaUrls(): string[] { return props.media?.map(m => m.url) || []; },
        get messageId(): string | undefined { return props.whatsappMessageId; },
    };
}

export const UnifiedTimelineEntry = {
    create(props: UnifiedTimelineEntryProps) {
        const now = new Date();
        return _createUnifiedTimelineEntry({
            id: props.id ?? generateId(),
            ...props,
            visibility: props.visibility ?? 'INTERNAL',
            metadata: props.metadata ?? {},
            occurredAt: props.occurredAt ?? now,
            createdAt: props.createdAt ?? now,
        });
    },
    fromPersistence(data: UnifiedTimelineEntryProps) {
        return _createUnifiedTimelineEntry(data);
    },
};

export type UnifiedTimelineEntry = ReturnType<typeof _createUnifiedTimelineEntry>;
