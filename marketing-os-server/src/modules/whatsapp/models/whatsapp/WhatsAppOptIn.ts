// domain/entities/whatsapp/WhatsAppOptIn.ts
// GDPR/TCPA compliant opt-in tracking

import { generateId } from '../../../../shared/utils/index.js';

/**
 * Opt-in status
 */
export type OptInStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING' | 'EXPIRED';

/**
 * How the opt-in was obtained
 */
export type OptInSource =
  | 'BOOKING_FORM'      // During booking
  | 'WEBSITE_WIDGET'    // Website WhatsApp widget
  | 'MANUAL_IMPORT'     // CSV import (must have consent proof)
  | 'FIRST_MESSAGE'     // User initiated conversation
  | 'EXPLICIT_REQUEST'  // User explicitly requested
  | 'QR_CODE'           // Scanned QR code
  | 'CUSTOMER_INITIATED'; // Implicit opt-in

export interface OptInAuditEntry {
  action: 'OPTED_IN' | 'OPTED_OUT' | 'RENEWED' | 'EXPIRED';
  timestamp: Date;
  source: OptInSource;
  ipAddress?: string;
  userAgent?: string;
  consentText?: string;
  actionBy: 'USER' | 'SYSTEM' | 'ADMIN';
  notes?: string;
}

export interface WhatsAppOptInProps {
  id?: string;
  tenantId: string;

  // Contact info
  phoneNumber: string;      // E.164 format
  contactId?: string;       // CRM contact link
  leadId?: string;          // Lead link

  // Current status
  status: OptInStatus;
  optInDate: Date;
  optOutDate?: Date;
  expiresAt?: Date;         // Auto-expire after X months

  // Consent tracking
  source: OptInSource;
  consentText: string;      // The actual text user agreed to
  ipAddress?: string;
  userAgent?: string;

  // Template type permissions
  allowUtilityMessages: boolean;
  allowMarketingMessages: boolean;

  // Audit trail
  auditLog: OptInAuditEntry[];

  // Engagement metrics
  lastMessageSentAt?: Date;
  lastMessageReceivedAt?: Date;
  totalMessagesSent: number;
  totalMessagesReceived: number;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * WhatsAppOptIn - GDPR/TCPA compliant consent tracking
 *
 * CRITICAL: Without proper opt-in, WhatsApp will block the business.
 * This entity maintains auditable consent records.
 */
function _createWhatsAppOptIn(props: WhatsAppOptInProps) {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    phoneNumber: props.phoneNumber,
    contactId: props.contactId,
    leadId: props.leadId,
    status: props.status,
    optInDate: props.optInDate,
    optOutDate: props.optOutDate,
    expiresAt: props.expiresAt,
    source: props.source,
    consentText: props.consentText,
    ipAddress: props.ipAddress,
    userAgent: props.userAgent,
    allowUtilityMessages: props.allowUtilityMessages,
    allowMarketingMessages: props.allowMarketingMessages,
    auditLog: props.auditLog,
    lastMessageSentAt: props.lastMessageSentAt,
    lastMessageReceivedAt: props.lastMessageReceivedAt,
    totalMessagesSent: props.totalMessagesSent,
    totalMessagesReceived: props.totalMessagesReceived,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,

    /** Check if user can receive utility messages */
    get canReceiveUtility(): boolean {
      return this.status === 'OPTED_IN' &&
        this.allowUtilityMessages &&
        (!this.expiresAt || new Date() < this.expiresAt);
    },

    /** Check if user can receive marketing messages */
    get canReceiveMarketing(): boolean {
      return this.status === 'OPTED_IN' &&
        this.allowMarketingMessages &&
        (!this.expiresAt || new Date() < this.expiresAt);
    },
  };
}

export const WhatsAppOptIn = {
  create(props: WhatsAppOptInProps): WhatsAppOptIn {
    const now = new Date();
    // Default expiry: 12 months
    const defaultExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    return _createWhatsAppOptIn({
      id: props.id ?? generateId(),
      ...props,
      optInDate: props.optInDate ?? now,
      expiresAt: props.expiresAt ?? defaultExpiry,
      allowUtilityMessages: props.allowUtilityMessages ?? true,
      allowMarketingMessages: props.allowMarketingMessages ?? false,
      auditLog: props.auditLog ?? [{
        action: 'OPTED_IN',
        timestamp: now,
        source: props.source,
        ipAddress: props.ipAddress,
        userAgent: props.userAgent,
        consentText: props.consentText,
        actionBy: 'USER',
      }],
      totalMessagesSent: props.totalMessagesSent ?? 0,
      totalMessagesReceived: props.totalMessagesReceived ?? 0,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  },

  fromPersistence(data: WhatsAppOptInProps): WhatsAppOptIn {
    return _createWhatsAppOptIn(data);
  },
};
export type WhatsAppOptIn = ReturnType<typeof _createWhatsAppOptIn>;
