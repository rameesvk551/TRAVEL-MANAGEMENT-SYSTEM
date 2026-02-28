// domain/entities/whatsapp/ConversationContext.ts
// Maps Omnichannel conversations to business objects

import { generateId } from '../../../../shared/utils/index.js';

/**
 * Supported communication channels
 */
export type CommunicationChannel =
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'MESSENGER';

/**
 * Actor types who can participate in conversations
 */
export type ConversationActorType =
  | 'CUSTOMER'
  | 'SALES_AGENT'
  | 'OPS_MANAGER'
  | 'FIELD_GUIDE'
  | 'DRIVER'
  | 'SUPPORT_AGENT'
  | 'SYSTEM';

/**
 * Business object types a conversation can be linked to
 */
export type LinkedEntityType =
  | 'LEAD'
  | 'BOOKING'
  | 'DEPARTURE'
  | 'TRIP_ASSIGNMENT'
  | 'PAYMENT'
  | 'SUPPORT_TICKET'
  | 'NONE';

/**
 * Conversation state for multi-step flows
 */
export type ConversationState =
  | 'IDLE'              // Waiting for input
  | 'COLLECTING_INFO'   // Multi-step data collection
  | 'AWAITING_CONFIRM'  // User confirmation needed
  | 'PENDING_ACTION'    // Backend action in progress
  | 'COMPLETED'         // Flow completed
  | 'EXPIRED'           // Session timed out
  | 'ESCALATED';        // Handed off to human

/**
 * Active workflow being executed via Chat
 */
export type ActiveWorkflow =
  | 'NONE'
  | 'NEW_INQUIRY'
  | 'QUOTE_REQUEST'
  | 'BOOKING_CREATION'
  | 'PAYMENT_COLLECTION'
  | 'TRIP_CHECKIN'
  | 'TRIP_UPDATE'
  | 'INCIDENT_REPORT'
  | 'STATUS_CHECK'
  | 'FEEDBACK_COLLECTION';

export interface ConversationActor {
  actorType: ConversationActorType;
  userId?: string;        // System user ID (staff/guide)
  employeeId?: string;    // HRMS employee ID
  contactId?: string;     // CRM contact ID
  phoneNumber?: string;   // E.164 format (WhatsApp)
  socialId?: string;      // IG/FB User ID
  displayName: string;
}

export interface LinkedEntity {
  type: LinkedEntityType;
  entityId: string;
  linkedAt: Date;
  linkedBy: 'SYSTEM' | 'MANUAL';
}

export interface WorkflowProgress {
  workflow: ActiveWorkflow;
  currentStep: string;
  totalSteps: number;
  stepIndex: number;
  collectedData: Record<string, unknown>;
  startedAt: Date;
  expiresAt: Date;
}

export interface ConversationContextProps {
  id?: string;
  tenantId: string;

  channel: CommunicationChannel;
  externalId: string;  // Provider's thread/conversation ID (was whatsappThreadId)

  // Primary actor (who initiated)
  primaryActor: ConversationActor;

  // All participants in this conversation
  participants: ConversationActor[];

  // Business object linking
  linkedEntities: LinkedEntity[];
  primaryEntity?: LinkedEntity;

  // State machine
  state: ConversationState;
  workflowProgress?: WorkflowProgress;

  // Session management
  lastActivityAt: Date;
  sessionStartedAt: Date;
  sessionExpiresAt: Date;
  messageCount: number;

  // Flags
  isOptedIn: boolean;
  isEscalated: boolean;
  requiresHumanReview: boolean;

  // Metadata
  providerMetadata?: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ConversationContext - Links Omnichannel conversation to TMS business objects
 * 
 * KEY PRINCIPLE: This is the bridge between channels (WA/IG/FB) and existing system.
 * All business logic remains in existing services - this only tracks context.
 */
function _createConversationContext(props: ConversationContextProps) {
    return {
        id: props.id!,
        tenantId: props.tenantId,
        channel: props.channel,
        externalId: props.externalId,
        primaryActor: props.primaryActor,
        participants: props.participants,
        linkedEntities: props.linkedEntities,
        primaryEntity: props.primaryEntity,
        state: props.state,
        workflowProgress: props.workflowProgress,
        lastActivityAt: props.lastActivityAt,
        sessionStartedAt: props.sessionStartedAt,
        sessionExpiresAt: props.sessionExpiresAt,
        messageCount: props.messageCount,
        isOptedIn: props.isOptedIn,
        isEscalated: props.isEscalated,
        requiresHumanReview: props.requiresHumanReview,
        providerMetadata: props.providerMetadata ?? {},
        createdAt: props.createdAt!,
        updatedAt: props.updatedAt!,
        get isSessionValid(): boolean { return new Date() < props.sessionExpiresAt; },
        get hasLinkedEntity(): boolean { return (props.linkedEntities ?? []).length > 0; },
    };
}

export const ConversationContext = {
    create(props: ConversationContextProps) {
        const now = new Date();
        const sessionExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return _createConversationContext({
            id: props.id ?? generateId(),
            tenantId: props.tenantId,
            channel: props.channel,
            externalId: props.externalId,
            primaryActor: props.primaryActor,
            participants: props.participants ?? [props.primaryActor],
            linkedEntities: props.linkedEntities ?? [],
            primaryEntity: props.primaryEntity,
            state: props.state ?? 'IDLE',
            workflowProgress: props.workflowProgress,
            lastActivityAt: props.lastActivityAt ?? now,
            sessionStartedAt: props.sessionStartedAt ?? now,
            sessionExpiresAt: props.sessionExpiresAt ?? sessionExpiry,
            messageCount: props.messageCount ?? 0,
            isOptedIn: props.isOptedIn ?? true,
            isEscalated: props.isEscalated ?? false,
            requiresHumanReview: props.requiresHumanReview ?? false,
            providerMetadata: props.providerMetadata ?? {},
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now,
        });
    },
    fromPersistence(data: ConversationContextProps) {
        return _createConversationContext(data);
    },
};

export type ConversationContext = ReturnType<typeof _createConversationContext>;
