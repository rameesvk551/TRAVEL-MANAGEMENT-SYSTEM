// domain/entities/whatsapp/MessageTemplate.ts
// Pre-approved WhatsApp Business templates

import { generateId } from '../../../../shared/utils/index.js';

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
  useCase?: TemplateUseCase;

  // Content
  headerType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  headerContent?: string;
  bodyContent?: string;  // Template body with {{1}}, {{2}} placeholders
  footerContent?: string;
  components?: any[];    // Raw Meta components structure

  // Dynamic parts
  variables?: TemplateVariable[];
  buttons?: TemplateButton[];

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
function _createMessageTemplate(props: MessageTemplateProps) {
  return {
    id: props.id!,
    tenantId: props.tenantId,
    templateName: props.templateName,
    providerTemplateId: props.providerTemplateId,
    language: props.language,
    category: props.category,
    useCase: (props.useCase || 'CUSTOM') as TemplateUseCase,
    headerType: props.headerType,
    headerContent: props.headerContent,
    bodyContent: props.bodyContent || '',
    footerContent: props.footerContent,
    components: props.components,
    variables: props.variables || [],
    buttons: props.buttons || [],
    status: props.status,
    rejectionReason: props.rejectionReason,
    submittedAt: props.submittedAt,
    approvedAt: props.approvedAt,
    usageCount: props.usageCount,
    lastUsedAt: props.lastUsedAt,
    requiresOptIn: props.requiresOptIn,
    minIntervalMinutes: props.minIntervalMinutes,
    createdAt: props.createdAt!,
    updatedAt: props.updatedAt!,
    createdBy: props.createdBy,

    /** Check if template can be used for sending */
    get isUsable(): boolean {
      return this.status === 'APPROVED';
    },
  };
}

export const MessageTemplate = {
  create(props: Partial<MessageTemplateProps> & { tenantId: string; templateName: string; category: TemplateCategory; language: string; createdBy: string }): MessageTemplate {
    const now = new Date();
    return _createMessageTemplate({
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
    } as MessageTemplateProps);
  },

  fromPersistence(data: MessageTemplateProps): MessageTemplate {
    return _createMessageTemplate(data);
  },
};
export type MessageTemplate = ReturnType<typeof _createMessageTemplate>;
