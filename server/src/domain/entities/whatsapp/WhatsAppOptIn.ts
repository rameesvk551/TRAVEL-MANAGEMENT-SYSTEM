// domain/entities/whatsapp/WhatsAppOptIn.ts
// GDPR/TCPA compliant opt-in tracking

import { generateId } from '../../../shared/utils/index.js';

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
  | 'QR_CODE';          // Scanned QR code

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
export class WhatsAppOptIn {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly phoneNumber: string;
  public readonly contactId?: string;
  public readonly leadId?: string;
  public readonly status: OptInStatus;
  public readonly optInDate: Date;
  public readonly optOutDate?: Date;
  public readonly expiresAt?: Date;
  public readonly source: OptInSource;
  public readonly consentText: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly allowUtilityMessages: boolean;
  public readonly allowMarketingMessages: boolean;
  public readonly auditLog: OptInAuditEntry[];
  public readonly lastMessageSentAt?: Date;
  public readonly lastMessageReceivedAt?: Date;
  public readonly totalMessagesSent: number;
  public readonly totalMessagesReceived: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: WhatsAppOptInProps) {
    this.id = props.id!;
    this.tenantId = props.tenantId;
    this.phoneNumber = props.phoneNumber;
    this.contactId = props.contactId;
    this.leadId = props.leadId;
    this.status = props.status;
    this.optInDate = props.optInDate;
    this.optOutDate = props.optOutDate;
    this.expiresAt = props.expiresAt;
    this.source = props.source;
    this.consentText = props.consentText;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.allowUtilityMessages = props.allowUtilityMessages;
    this.allowMarketingMessages = props.allowMarketingMessages;
    this.auditLog = props.auditLog;
    this.lastMessageSentAt = props.lastMessageSentAt;
    this.lastMessageReceivedAt = props.lastMessageReceivedAt;
    this.totalMessagesSent = props.totalMessagesSent;
    this.totalMessagesReceived = props.totalMessagesReceived;
    this.createdAt = props.createdAt!;
    this.updatedAt = props.updatedAt!;
  }

  static create(props: WhatsAppOptInProps): WhatsAppOptIn {
    const now = new Date();
    // Default expiry: 12 months
    const defaultExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    return new WhatsAppOptIn({
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
  }

  static fromPersistence(data: WhatsAppOptInProps): WhatsAppOptIn {
    return new WhatsAppOptIn(data);
  }

  /**
   * Check if user can receive utility messages
   */
  get canReceiveUtility(): boolean {
    return this.status === 'OPTED_IN' && 
           this.allowUtilityMessages &&
           (!this.expiresAt || new Date() < this.expiresAt);
  }

  /**
   * Check if user can receive marketing messages
   */
  get canReceiveMarketing(): boolean {
    return this.status === 'OPTED_IN' && 
           this.allowMarketingMessages &&
           (!this.expiresAt || new Date() < this.expiresAt);
  }
}
