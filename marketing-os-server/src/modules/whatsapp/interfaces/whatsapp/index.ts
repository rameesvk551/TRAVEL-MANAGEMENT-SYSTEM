export * from './IConversationRepository.js';
export * from './IWhatsAppProvider.js';
export * from './IMessageRepository.js';
export * from './ITimelineRepository.js';

export interface TimelineFilters {
  entryType?: string | string[] | any;
  source?: string | string[] | any;
  visibility?: string;
  limit?: number;
  offset?: number;
  occurredAfter?: Date;
  occurredBefore?: Date;
}

export interface TimelineQuery extends TimelineFilters {
  startDate?: Date;
  endDate?: Date;
  entryTypes?: string[];
  sources?: string[];
}
