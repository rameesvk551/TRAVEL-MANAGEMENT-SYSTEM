// domain/entities/whatsapp/WhatsAppConversation.ts
// Represents an active WhatsApp conversation session

import { generateId } from '../../../shared/utils/index.js';

export type ConversationState = 
  | 'IDLE'
  | 'AWAITING_INPUT'
  | 'PROCESSING'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'ERROR';

export type BoundObjectType = 
  | 'LEAD'
  | 'BOOKING'
  | 'TRIP'
  | 'PAYMENT'
  | 'TASK'
  | 'DEPARTURE';

export interface WhatsAppConversationProps {
  id?: string;
  tenantId: string;
  phoneNumber: string;
  userId?: string;
  
  boundObjectType?: BoundObjectType;
  boundObjectId?: string;
  
  currentState: ConversationState;
  stateData: Record<string, unknown>;
  
  startedAt?: Date;
  lastMessageAt?: Date;
  expiresAt: Date;
  isActive?: boolean;
  
  metadata?: Record<string, unknown>;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export class WhatsAppConversation {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly phoneNumber: string;
  public readonly userId?: string;
  
  public readonly boundObjectType?: BoundObjectType;
  public readonly boundObjectId?: string;
  
  public readonly currentState: ConversationState;
  public readonly stateData: Record<string, unknown>;
  
  public readonly startedAt: Date;
  public readonly lastMessageAt: Date;
  public readonly expiresAt: Date;
  public readonly isActive: boolean;
  
  public readonly metadata: Record<string, unknown>;
  
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: Required<Omit<WhatsAppConversationProps, 
    'userId' | 'boundObjectType' | 'boundObjectId'>> & 
    Pick<WhatsAppConversationProps, 'userId' | 'boundObjectType' | 'boundObjectId'>
  ) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.phoneNumber = props.phoneNumber;
    this.userId = props.userId;
    this.boundObjectType = props.boundObjectType;
    this.boundObjectId = props.boundObjectId;
    this.currentState = props.currentState;
    this.stateData = props.stateData;
    this.startedAt = props.startedAt;
    this.lastMessageAt = props.lastMessageAt;
    this.expiresAt = props.expiresAt;
    this.isActive = props.isActive;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: WhatsAppConversationProps): WhatsAppConversation {
    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return new WhatsAppConversation({
      id: props.id ?? generateId(),
      tenantId: props.tenantId,
      phoneNumber: props.phoneNumber,
      userId: props.userId,
      boundObjectType: props.boundObjectType,
      boundObjectId: props.boundObjectId,
      currentState: props.currentState ?? 'IDLE',
      stateData: props.stateData ?? {},
      startedAt: props.startedAt ?? now,
      lastMessageAt: props.lastMessageAt ?? now,
      expiresAt: props.expiresAt ?? defaultExpiry,
      isActive: props.isActive ?? true,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    });
  }

  static fromPersistence(data: Required<Omit<WhatsAppConversationProps,
    'userId' | 'boundObjectType' | 'boundObjectId'>> &
    Pick<WhatsAppConversationProps, 'userId' | 'boundObjectType' | 'boundObjectId'>
  ): WhatsAppConversation {
    return new WhatsAppConversation(data);
  }

  get isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  get isBound(): boolean {
    return !!(this.boundObjectType && this.boundObjectId);
  }

  get canAcceptMessages(): boolean {
    return this.isActive && !this.isExpired;
  }
}
