/**
 * Lead Note Service — Internal team collaboration notes on leads.
 */

import { LeadNoteModel } from './lead.model.js';
import type { LeadNote, CreateLeadNoteDTO, UpdateLeadNoteDTO } from './lead.types.js';

export class LeadNoteService {

    async getNotes(tenantId: string, leadId: string): Promise<LeadNote[]> {
        const notes = await LeadNoteModel.findAll({
            where: { tenant_id: tenantId, lead_id: leadId },
            order: [['created_at', 'DESC']],
        });
        return notes.map(n => n.toJSON() as LeadNote);
    }

    async addNote(tenantId: string, data: CreateLeadNoteDTO): Promise<LeadNote> {
        const note = await LeadNoteModel.create({
            tenant_id: tenantId,
            lead_id: data.lead_id,
            content: data.content,
            is_internal: data.is_internal || false,
            created_by: data.created_by,
        });
        return note.toJSON() as LeadNote;
    }

    async updateNote(tenantId: string, noteId: string, data: UpdateLeadNoteDTO): Promise<LeadNote | null> {
        const note = await LeadNoteModel.findOne({ where: { id: noteId, tenant_id: tenantId } });
        if (!note) return null;
        await note.update({ content: data.content });
        return note.toJSON() as LeadNote;
    }

    async deleteNote(tenantId: string, noteId: string): Promise<boolean> {
        const count = await LeadNoteModel.destroy({ where: { id: noteId, tenant_id: tenantId } });
        return count > 0;
    }
}
