import { Activity, ActivityProps } from '../../domain/entities/Activity.js';
import { ActivityRepository } from '../../infrastructure/repositories/ActivityRepository.js';
import { ActivityFilters } from '../../domain/interfaces/IActivityRepository.js';

export class ActivityService {
    constructor(private activityRepository: ActivityRepository) { }

    async logActivity(props: ActivityProps): Promise<Activity> {
        const activity = Activity.create(props);
        return this.activityRepository.save(activity);
    }

    async getActivities(tenantId: string, filters: ActivityFilters) {
        return this.activityRepository.findAll(tenantId, filters);
    }

    async completeActivity(id: string, tenantId: string, outcome: any): Promise<Activity> {
        const activity = await this.activityRepository.findById(id, tenantId);
        if (!activity) throw new Error('Activity not found');

        const completed = activity.markComplete(outcome);
        return this.activityRepository.save(completed);
    }
}
