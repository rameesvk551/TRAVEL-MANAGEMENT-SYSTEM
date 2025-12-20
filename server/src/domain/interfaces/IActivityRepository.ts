import { Activity } from '../entities/Activity.js';
import { Pagination } from '../../shared/types/Pagination.js';

export interface ActivityFilters extends Pagination {
    leadId?: string;
    contactId?: string;
    bookingId?: string;
    assignedToId?: string;
    type?: string;
    status?: string; // PENDING for tasks
    dateRange?: { start: Date; end: Date };
}

export interface IActivityRepository {
    save(activity: Activity): Promise<Activity>;
    findById(id: string, tenantId: string): Promise<Activity | null>;
    findAll(tenantId: string, filters: ActivityFilters): Promise<{ activities: Activity[]; total: number }>;
    findOverdue(tenantId: string, assignedToId?: string): Promise<Activity[]>;
    delete(id: string, tenantId: string): Promise<void>;
}
