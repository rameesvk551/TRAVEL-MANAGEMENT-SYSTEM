// domain/entities/whatsapp/ConversationContext.ts
// Maps WhatsApp conversations to business objects

import { generateId } from '../../../shared/utils/index.js';

/**
 * Actor types who can participate in WhatsApp conversations
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
 * Active workflow being executed via WhatsApp
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
  phoneNumber: string;    // E.164 format
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
  whatsappThreadId: string;  // Provider's thread/conversation ID
  
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
 * ConversationContext - Links WhatsApp conversation to TMS business objects
 * 
 * KEY PRINCIPLE: This is the bridge between WhatsApp and existing system.
 * All business logic remains in existing services - this only tracks context.
 */
export class ConversationContext {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly whatsappThreadId: string;
  public readonly primaryActor: ConversationActor;
  public readonly participants: ConversationActor[];
  public readonly linkedEntities: LinkedEntity[];
  public readonly primaryEntity?: LinkedEntity;
  public readonly state: ConversationState;
  public readonly workflowProgress?: WorkflowProgress;
  public readonly lastActivityAt: Date;
  public readonly sessionStartedAt: Date;
  public readonly sessionExpiresAt: Date;
  public readonly messageCount: number;
  public readonly isOptedIn: boolean;
  public readonly isEscalated: boolean;
  public readonly requiresHumanReview: boolean;
  public readonly providerMetadata: Record<string, unknown>;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: ConversationContextProps) {
    this.id = props.id!;
    this.tenantId = props.tenantId;
    this.whatsappThreadId = props.whatsappThreadId;
    this.primaryActor = props.primaryActor;
    this.participants = props.participants;
    this.linkedEntities = props.linkedEntities;
    this.primaryEntity = props.primaryEntity;
    this.state = props.state;
    this.workflowProgress = props.workflowProgress;
    this.lastActivityAt = props.lastActivityAt;
    this.sessionStartedAt = props.sessionStartedAt;
    this.sessionExpiresAt = props.sessionExpiresAt;
    this.messageCount = props.messageCount;
    this.isOptedIn = props.isOptedIn;
    this.isEscalated = props.isEscalated;
    this.requiresHumanReview = props.requiresHumanReview;
    this.providerMetadata = props.providerMetadata ?? {};
    this.createdAt = props.createdAt!;
    this.updatedAt = props.updatedAt!;
  }

  static create(props: ConversationContextProps): ConversationContext {
    const now = new Date();
    // Default session: 24 hours
    const sessionExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return new ConversationContext({
      id: props.id ?? generateId(),
      tenantId: props.tenantId,
      whatsappThreadId: props.whatsappThreadId,
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
  }

  static fromPersistence(data: ConversationContextProps): ConversationContext {
    return new ConversationContext(data);
  }

  /**
   * Check if session is still valid
   */
  get isSessionValid(): boolean {
    return new Date() < this.sessionExpiresAt;
  }

  /**
   * Check if conversation has a linked business entity
   */
  get hasLinkedEntity(): boolean {
    return this.linkedEntities.length > 0;
  }
}
