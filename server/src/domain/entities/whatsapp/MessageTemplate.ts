// domain/entities/whatsapp/MessageTemplate.ts
// Pre-approved WhatsApp Business templates

import { generateId } from '../../../shared/utils/index.js';

/**
 * Template category per WhatsApp Business requirements
 */
export type TemplateCategory = 
  | 'UTILITY'         // Order updates, booking confirmations
  | 'AUTHENTICATION'  // OTP, verification
  | 'MARKETING';      // Promotional (requires opt-in)

/**
 * Template status in approval workflow
 */
export type TemplateStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'  // Submitted to WhatsApp
  | 'APPROVED'
  | 'REJECTED'
  | 'PAUSED'           // Temporarily disabled
  | 'DISABLED';

/**
 * Business operations this template is used for
 */
export type TemplateUseCase = 
  | 'BOOKING_CONFIRMATION'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_RECEIVED'
  | 'TRIP_REMINDER'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'QUOTE_SENT'
  | 'LEAD_FOLLOWUP'
  | 'DOCUMENT_REQUESTED'
  | 'STAFF_ASSIGNMENT'
  | 'EMERGENCY_ALERT'
  | 'FEEDBACK_REQUEST'
  | 'CUSTOM';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  example: string;
  maxLength?: number;
  required: boolean;
  sourceField?: string;  // Maps to entity field (e.g., 'booking.guestName')
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
  payload?: string;  // For quick reply callbacks
}

export interface MessageTemplateProps {
  id?: string;
  tenantId: string;
  
  // WhatsApp template identifiers
  templateName: string;           // Unique name (snake_case)
  providerTemplateId?: string;    // ID from WhatsApp after approval
  language: string;               // BCP 47 format (en, hi, ne)
  
  // Categorization
  category: TemplateCategory;
  useCase: TemplateUseCase;
  
  // Content
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerContent?: string;
  bodyContent: string;  // Template body with {{1}}, {{2}} placeholders
  footerContent?: string;
  
  // Dynamic parts
  variables: TemplateVariable[];
  buttons: TemplateButton[];
  
  // Status
  status: TemplateStatus;
  rejectionReason?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: Date;
  
  // Governance
  requiresOptIn: boolean;
  minIntervalMinutes: number;  // Prevent spam
  
  createdAt?: Date;
  updatedAt?: Date;
  createdBy: string;
}

/**
 * MessageTemplate - Pre-approved WhatsApp Business templates
 * 
 * WhatsApp requires template approval for proactive messages.
 * This entity tracks templates and their approval status.
 */
export class MessageTemplate {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly templateName: string;
  public readonly providerTemplateId?: string;
  public readonly language: string;
  public readonly category: TemplateCategory;
  public readonly useCase: TemplateUseCase;
  public readonly headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  public readonly headerContent?: string;
  public readonly bodyContent: string;
  public readonly footerContent?: string;
  public readonly variables: TemplateVariable[];
  public readonly buttons: TemplateButton[];
  public readonly status: TemplateStatus;
  public readonly rejectionReason?: string;
  public readonly submittedAt?: Date;
  public readonly approvedAt?: Date;
  public readonly usageCount: number;
  public readonly lastUsedAt?: Date;
  public readonly requiresOptIn: boolean;
  public readonly minIntervalMinutes: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly createdBy: string;

  private constructor(props: MessageTemplateProps) {
    this.id = props.id!;
    this.tenantId = props.tenantId;
    this.templateName = props.templateName;
    this.providerTemplateId = props.providerTemplateId;
    this.language = props.language;
    this.category = props.category;
    this.useCase = props.useCase;
    this.headerType = props.headerType;
    this.headerContent = props.headerContent;
    this.bodyContent = props.bodyContent;
    this.footerContent = props.footerContent;
    this.variables = props.variables;
    this.buttons = props.buttons;
    this.status = props.status;
    this.rejectionReason = props.rejectionReason;
    this.submittedAt = props.submittedAt;
    this.approvedAt = props.approvedAt;
    this.usageCount = props.usageCount;
    this.lastUsedAt = props.lastUsedAt;
    this.requiresOptIn = props.requiresOptIn;
    this.minIntervalMinutes = props.minIntervalMinutes;
    this.createdAt = props.createdAt!;
    this.updatedAt = props.updatedAt!;
    this.createdBy = props.createdBy;
  }

  static create(props: MessageTemplateProps): MessageTemplate {
    const now = new Date();
    return new MessageTemplate({
      id: props.id ?? generateId(),
      ...props,
      variables: props.variables ?? [],
      buttons: props.buttons ?? [],
      status: props.status ?? 'DRAFT',
      usageCount: props.usageCount ?? 0,
      requiresOptIn: props.requiresOptIn ?? (props.category === 'MARKETING'),
      minIntervalMinutes: props.minIntervalMinutes ?? 60,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static fromPersistence(data: MessageTemplateProps): MessageTemplate {
    return new MessageTemplate(data);
  }

  /**
   * Check if template can be used for sending
   */
  get isUsable(): boolean {
    return this.status === 'APPROVED';
  }
}
