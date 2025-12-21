/**
 * Team Dashboard Page
 * Manager view of team attendance and status
 */
import { TeamAttendanceDashboard, LeaveApprovals } from '@/components/hrms';

export default function TeamDashboardPage() {
    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Team Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamAttendanceDashboard />
                <LeaveApprovals />
            </div>
        </div>
    );
}
