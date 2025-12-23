// domain/entities/whatsapp/TimelineEntry.ts
// Unified timeline entry for all business objects

import { generateId } from '../../../shared/utils/index.js';

export type TimelineObjectType = 
  | 'LEAD'
  | 'BOOKING'
  | 'TRIP'
  | 'PAYMENT'
  | 'DEPARTURE'
  | 'EMPLOYEE'
  | 'TASK';

export type TimelineEventType = 
  | 'MESSAGE'
  | 'STATUS_CHANGE'
  | 'PAYMENT'
  | 'MEDIA'
  | 'NOTE'
  | 'ASSIGNMENT'
  | 'ISSUE'
  | 'RESOLUTION'
  | 'SYSTEM';

export type TimelineSource = 
  | 'WHATSAPP'
  | 'WEB'
  | 'API'
  | 'SYSTEM'
  | 'EMAIL'
  | 'MOBILE';

export interface TimelineEntryProps {
  id?: string;
  tenantId: string;
  
  objectType: TimelineObjectType;
  objectId: string;
  
  eventType: TimelineEventType;
  source: TimelineSource;
  
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  actorPhone?: string;
  
  content: Record<string, unknown>;
  
  timestamp?: Date;
  
  metadata?: Record<string, unknown>;
  
  createdAt?: Date;
}

export class TimelineEntry {
  public readonly id: string;
  public readonly tenantId: string;
  
  public readonly objectType: TimelineObjectType;
  public readonly objectId: string;
  
  public readonly eventType: TimelineEventType;
  public readonly source: TimelineSource;
  
  public readonly actorId?: string;
  public readonly actorName?: string;
  public readonly actorRole?: string;
  public readonly actorPhone?: string;
  
  public readonly content: Record<string, unknown>;
  
  public readonly timestamp: Date;
  
  public readonly metadata: Record<string, unknown>;
  
  public readonly createdAt: Date;

  private constructor(props: Required<Omit<TimelineEntryProps,
    'actorId' | 'actorName' | 'actorRole' | 'actorPhone'>> &
    Pick<TimelineEntryProps, 'actorId' | 'actorName' | 'actorRole' | 'actorPhone'>
  ) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.objectType = props.objectType;
    this.objectId = props.objectId;
    this.eventType = props.eventType;
    this.source = props.source;
    this.actorId = props.actorId;
    this.actorName = props.actorName;
    this.actorRole = props.actorRole;
    this.actorPhone = props.actorPhone;
    this.content = props.content;
    this.timestamp = props.timestamp;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(props: TimelineEntryProps): TimelineEntry {
    const now = new Date();

    return new TimelineEntry({
      id: props.id ?? generateId(),
      tenantId: props.tenantId,
      objectType: props.objectType,
      objectId: props.objectId,
      eventType: props.eventType,
      source: props.source,
      actorId: props.actorId,
      actorName: props.actorName,
      actorRole: props.actorRole,
      actorPhone: props.actorPhone,
      content: props.content,
      timestamp: props.timestamp ?? now,
      metadata: props.metadata ?? {},
      createdAt: props.createdAt ?? now,
    });
  }

  static fromPersistence(data: Required<Omit<TimelineEntryProps,
    'actorId' | 'actorName' | 'actorRole' | 'actorPhone'>> &
    Pick<TimelineEntryProps, 'actorId' | 'actorName' | 'actorRole' | 'actorPhone'>
  ): TimelineEntry {
    return new TimelineEntry(data);
  }

  get hasActor(): boolean {
    return !!this.actorId;
  }

  get isFromWhatsApp(): boolean {
    return this.source === 'WHATSAPP';
  }

  get displayText(): string {
    if (this.eventType === 'MESSAGE' && this.content.text) {
      return String(this.content.text);
    }
    return '';
  }
}
