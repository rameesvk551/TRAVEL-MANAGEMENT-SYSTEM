/**
 * Lead Follow-Up Reminder Service — Schedule and manage follow-up reminders.
 */

import { Op } from 'sequelize';
import { LeadFollowUpReminderModel } from './lead.model.js';
import type { LeadFollowUpReminder, CreateFollowUpReminderDTO } from './lead.types.js';

export class LeadFollowUpService {

    async createReminder(tenantId: string, data: CreateFollowUpReminderDTO, createdBy?: string): Promise<LeadFollowUpReminder> {
        const reminder = await LeadFollowUpReminderModel.create({
            tenant_id: tenantId,
            lead_id: data.lead_id,
            assigned_to: data.assigned_to,
            due_date: data.due_date,
            note: data.note,
            status: 'pending',
            created_by: createdBy,
        });
        return reminder.toJSON() as LeadFollowUpReminder;
    }

    async getReminders(tenantId: string, filters: {
        lead_id?: string; assigned_to?: string; status?: string; limit?: number;
    } = {}): Promise<LeadFollowUpReminder[]> {
        const where: any = { tenant_id: tenantId };
        if (filters.lead_id) where.lead_id = filters.lead_id;
        if (filters.assigned_to) where.assigned_to = filters.assigned_to;
        if (filters.status) where.status = filters.status;

        const reminders = await LeadFollowUpReminderModel.findAll({
            where, order: [['due_date', 'ASC']], limit: filters.limit || 100,
        });
        return reminders.map(r => r.toJSON() as LeadFollowUpReminder);
    }

    async getUpcoming(tenantId: string, userId?: string): Promise<LeadFollowUpReminder[]> {
        const where: any = { tenant_id: tenantId, status: 'pending' };
        if (userId) where.assigned_to = userId;

        return this.getReminders(tenantId, { ...where });
    }

    async getOverdue(tenantId: string): Promise<LeadFollowUpReminder[]> {
        const reminders = await LeadFollowUpReminderModel.findAll({
            where: {
                tenant_id: tenantId,
                status: 'pending',
                due_date: { [Op.lt]: new Date() },
            },
            order: [['due_date', 'ASC']],
        });
        return reminders.map(r => r.toJSON() as LeadFollowUpReminder);
    }

    async completeReminder(tenantId: string, reminderId: string): Promise<boolean> {
        const reminder = await LeadFollowUpReminderModel.findOne({
            where: { id: reminderId, tenant_id: tenantId },
        });
        if (!reminder) return false;
        await reminder.update({ status: 'completed', completed_at: new Date() });
        return true;
    }

    async cancelReminder(tenantId: string, reminderId: string): Promise<boolean> {
        const reminder = await LeadFollowUpReminderModel.findOne({
            where: { id: reminderId, tenant_id: tenantId },
        });
        if (!reminder) return false;
        await reminder.update({ status: 'cancelled' });
        return true;
    }
}
