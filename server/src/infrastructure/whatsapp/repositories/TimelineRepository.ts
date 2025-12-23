// infrastructure/whatsapp/repositories/TimelineRepository.ts
// PostgreSQL implementation of ITimelineRepository

import { Pool } from 'pg';
import {
  ITimelineRepository,
  TimelineQuery,
} from '../../../domain/interfaces/whatsapp/index.js';
import { UnifiedTimelineEntry } from '../../../domain/entities/whatsapp/index.js';

export class TimelineRepository implements ITimelineRepository {
  constructor(private pool: Pool) {}

  async save(entry: UnifiedTimelineEntry): Promise<UnifiedTimelineEntry> {
    const query = `
      INSERT INTO whatsapp_timeline_entries (
        id, tenant_id, lead_id, booking_id, departure_id, trip_assignment_id,
        source, entry_type, visibility, actor_id, actor_type, actor_name,
        title, description, old_value, new_value, metadata, media_urls,
        message_id, occurred_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        metadata = EXCLUDED.metadata,
        media_urls = EXCLUDED.media_urls
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      entry.id,
      entry.tenantId,
      entry.leadId,
      entry.bookingId,
      entry.departureId,
      entry.tripAssignmentId,
      entry.source,
      entry.entryType,
      entry.visibility,
      entry.actorId,
      entry.actorType,
      entry.actorName,
      entry.title,
      entry.description,
      entry.oldValue,
      entry.newValue,
      JSON.stringify(entry.metadata),
      entry.mediaUrls,
      entry.messageId,
      entry.occurredAt,
      entry.createdAt,
    ]);

    return this.rowToEntry(result.rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<UnifiedTimelineEntry | null> {
    const result = await this.pool.query(
      `SELECT * FROM whatsapp_timeline_entries WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    return result.rows[0] ? this.rowToEntry(result.rows[0]) : null;
  }

  async findByLead(leadId: string, tenantId: string, query?: TimelineQuery): Promise<UnifiedTimelineEntry[]> {
    return this.findByEntity('lead_id', leadId, tenantId, query);
  }

  async findByBooking(bookingId: string, tenantId: string, query?: TimelineQuery): Promise<UnifiedTimelineEntry[]> {
    return this.findByEntity('booking_id', bookingId, tenantId, query);
  }

  async findByDeparture(departureId: string, tenantId: string, query?: TimelineQuery): Promise<UnifiedTimelineEntry[]> {
    return this.findByEntity('departure_id', departureId, tenantId, query);
  }

  async findByTripAssignment(tripAssignmentId: string, tenantId: string, query?: TimelineQuery): Promise<UnifiedTimelineEntry[]> {
    return this.findByEntity('trip_assignment_id', tripAssignmentId, tenantId, query);
  }

  private async findByEntity(
    column: string,
    entityId: string,
    tenantId: string,
    query?: TimelineQuery
  ): Promise<UnifiedTimelineEntry[]> {
    let sql = `SELECT * FROM whatsapp_timeline_entries WHERE ${column} = $1 AND tenant_id = $2`;
    const params: any[] = [entityId, tenantId];

    if (query?.entryTypes?.length) {
      params.push(query.entryTypes);
      sql += ` AND entry_type = ANY($${params.length})`;
    }

    if (query?.sources?.length) {
      params.push(query.sources);
      sql += ` AND source = ANY($${params.length})`;
    }

    if (query?.visibility) {
      params.push(query.visibility);
      sql += ` AND visibility = $${params.length}`;
    }

    if (query?.startDate) {
      params.push(query.startDate);
      sql += ` AND occurred_at >= $${params.length}`;
    }

    if (query?.endDate) {
      params.push(query.endDate);
      sql += ` AND occurred_at <= $${params.length}`;
    }

    sql += ` ORDER BY occurred_at DESC`;

    if (query?.limit) {
      params.push(query.limit);
      sql += ` LIMIT $${params.length}`;
    }

    if (query?.offset) {
      params.push(query.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(row => this.rowToEntry(row));
  }

  async search(tenantId: string, searchText: string, options?: { limit?: number }): Promise<UnifiedTimelineEntry[]> {
    const query = `
      SELECT * FROM whatsapp_timeline_entries
      WHERE tenant_id = $1
        AND (
          title ILIKE $2
          OR description ILIKE $2
          OR actor_name ILIKE $2
        )
      ORDER BY occurred_at DESC
      LIMIT $3
    `;

    const result = await this.pool.query(query, [
      tenantId,
      `%${searchText}%`,
      options?.limit || 50,
    ]);

    return result.rows.map(row => this.rowToEntry(row));
  }

  async getUnifiedTimeline(
    tenantId: string,
    entityIds: { leadId?: string; bookingId?: string; departureId?: string; tripAssignmentId?: string },
    query?: TimelineQuery
  ): Promise<UnifiedTimelineEntry[]> {
    const conditions: string[] = ['tenant_id = $1'];
    const params: any[] = [tenantId];

    const entityConditions: string[] = [];
    if (entityIds.leadId) {
      params.push(entityIds.leadId);
      entityConditions.push(`lead_id = $${params.length}`);
    }
    if (entityIds.bookingId) {
      params.push(entityIds.bookingId);
      entityConditions.push(`booking_id = $${params.length}`);
    }
    if (entityIds.departureId) {
      params.push(entityIds.departureId);
      entityConditions.push(`departure_id = $${params.length}`);
    }
    if (entityIds.tripAssignmentId) {
      params.push(entityIds.tripAssignmentId);
      entityConditions.push(`trip_assignment_id = $${params.length}`);
    }

    if (entityConditions.length > 0) {
      conditions.push(`(${entityConditions.join(' OR ')})`);
    }

    if (query?.visibility) {
      params.push(query.visibility);
      conditions.push(`visibility = $${params.length}`);
    }

    let sql = `SELECT * FROM whatsapp_timeline_entries WHERE ${conditions.join(' AND ')} ORDER BY occurred_at DESC`;

    if (query?.limit) {
      params.push(query.limit);
      sql += ` LIMIT $${params.length}`;
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(row => this.rowToEntry(row));
  }

  async countByEntity(entityType: string, entityId: string, tenantId: string): Promise<number> {
    const columnMap: Record<string, string> = {
      lead: 'lead_id',
      booking: 'booking_id',
      departure: 'departure_id',
      tripAssignment: 'trip_assignment_id',
    };

    const column = columnMap[entityType];
    if (!column) return 0;

    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM whatsapp_timeline_entries WHERE ${column} = $1 AND tenant_id = $2`,
      [entityId, tenantId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  async deleteByEntity(entityType: string, entityId: string, tenantId: string): Promise<void> {
    const columnMap: Record<string, string> = {
      lead: 'lead_id',
      booking: 'booking_id',
      departure: 'departure_id',
      tripAssignment: 'trip_assignment_id',
    };

    const column = columnMap[entityType];
    if (!column) return;

    await this.pool.query(
      `DELETE FROM whatsapp_timeline_entries WHERE ${column} = $1 AND tenant_id = $2`,
      [entityId, tenantId]
    );
  }

  private rowToEntry(row: any): UnifiedTimelineEntry {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      leadId: row.lead_id,
      bookingId: row.booking_id,
      departureId: row.departure_id,
      tripAssignmentId: row.trip_assignment_id,
      source: row.source,
      entryType: row.entry_type,
      visibility: row.visibility,
      actorId: row.actor_id,
      actorType: row.actor_type,
      actorName: row.actor_name,
      title: row.title,
      description: row.description,
      oldValue: row.old_value,
      newValue: row.new_value,
      metadata: row.metadata || {},
      mediaUrls: row.media_urls || [],
      messageId: row.message_id,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    } as UnifiedTimelineEntry;
  }
}
