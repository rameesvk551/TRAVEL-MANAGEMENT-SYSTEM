/**
 * Team Attendance Dashboard Component
 * Manager view of team attendance for today
 */
import { useState } from 'react';
import { useTeamAttendance } from '@/hooks/hrms';
import { Badge, Card, CardHeader, CardContent } from '@/components/ui';
import type { AttendanceStatus } from '@/types/hrms.types';

const STATUS_ICONS: Record<AttendanceStatus, string> = {
    present: '✅',
    absent: '❌',
    half_day: '🌓',
    on_trip: '🚌',
    remote: '🏠',
    holiday: '🎉',
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    half_day: 'bg-yellow-100 text-yellow-800',
    on_trip: 'bg-blue-100 text-blue-800',
    remote: 'bg-purple-100 text-purple-800',
    holiday: 'bg-gray-100 text-gray-800',
};

export function TeamAttendanceDashboard() {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const { data, isLoading } = useTeamAttendance(selectedDate);
    const attendanceList = data?.data || [];

    // Calculate stats
    const stats = attendanceList.reduce(
        (acc, a) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            acc.total++;
            return acc;
        },
        { total: 0 } as Record<string, number>
    );

    if (isLoading) {
        return <div className="p-4">Loading team attendance...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-semibold">Team Attendance</h2>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border rounded px-3 py-1"
                />
            </CardHeader>
            <CardContent>
                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-gray-500">Total</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                        <div className="text-2xl font-bold text-green-600">
                            {stats.present || 0}
                        </div>
                        <div className="text-xs text-gray-500">Present</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.on_trip || 0}
                        </div>
                        <div className="text-xs text-gray-500">On Trip</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded">
                        <div className="text-2xl font-bold text-red-600">
                            {stats.absent || 0}
                        </div>
                        <div className="text-xs text-gray-500">Absent</div>
                    </div>
                </div>

                {/* Attendance List */}
                {attendanceList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No attendance records for this date
                    </div>
                ) : (
                    <div className="space-y-2">
                        {attendanceList.map((attendance) => (
                            <div
                                key={attendance.id}
                                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">
                                        {STATUS_ICONS[attendance.status]}
                                    </span>
                                    <div>
                                        <div className="font-medium">
                                            Employee #{attendance.employeeId.slice(0, 8)}
                                        </div>
                                        {attendance.checkInTime && (
                                            <div className="text-xs text-gray-500">
                                                In:{' '}
                                                {new Date(
                                                    attendance.checkInTime
                                                ).toLocaleTimeString()}
                                                {attendance.checkOutTime && (
                                                    <>
                                                        {' → Out: '}
                                                        {new Date(
                                                            attendance.checkOutTime
                                                        ).toLocaleTimeString()}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {attendance.workHours && (
                                        <span className="text-sm text-gray-500">
                                            {attendance.workHours.toFixed(1)}h
                                        </span>
                                    )}
                                    <Badge className={STATUS_COLORS[attendance.status]}>
                                        {attendance.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
