// domain/interfaces/whatsapp/ITimelineRepository.ts

import { TimelineEntry } from '../../entities/whatsapp/TimelineEntry.js';

export interface ITimelineRepository {
  save(entry: TimelineEntry): Promise<TimelineEntry>;
  
  findById(id: string, tenantId: string): Promise<TimelineEntry | null>;
  
  findByObject(objectType: string, objectId: string, tenantId: string): Promise<TimelineEntry[]>;
  
  findByObjectWithPagination(
    objectType: string,
    objectId: string,
    tenantId: string,
    limit: number,
    offset: number
  ): Promise<TimelineEntry[]>;
  
  findByActor(actorId: string, tenantId: string): Promise<TimelineEntry[]>;
  
  findBySource(source: string, tenantId: string, limit?: number): Promise<TimelineEntry[]>;
  
  findRecent(tenantId: string, limit: number): Promise<TimelineEntry[]>;
}
