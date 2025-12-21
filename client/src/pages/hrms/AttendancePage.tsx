/**
 * Attendance Page
 * Mobile check-in and attendance history
 */
import { useState } from 'react';
import { MobileCheckIn } from '@/components/hrms';
import { useMyAttendance } from '@/hooks/hrms';
import { Badge, Card, CardHeader, CardContent } from '@/components/ui';

export default function AttendancePage() {
    const [view, setView] = useState<'checkin' | 'history'>('checkin');

    // Get current month attendance
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    const { data: historyData, isLoading } = useMyAttendance({
        startDate: startOfMonth,
        endDate: endOfMonth,
    });

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setView('checkin')}
                    className={`px-4 py-2 rounded-lg ${
                        view === 'checkin'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    Check In
                </button>
                <button
                    onClick={() => setView('history')}
                    className={`px-4 py-2 rounded-lg ${
                        view === 'history'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                    History
                </button>
            </div>

            {view === 'checkin' ? (
                <MobileCheckIn />
            ) : (
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">
                            Attendance History - {now.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </h2>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div>Loading...</div>
                        ) : (
                            <div className="space-y-2">
                                {historyData?.data?.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-3 border rounded"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {new Date(record.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {record.checkInTime
                                                    ? new Date(record.checkInTime).toLocaleTimeString(
                                                          [],
                                                          { hour: '2-digit', minute: '2-digit' }
                                                      )
                                                    : '-'}
                                                {record.checkOutTime && (
                                                    <>
                                                        {' → '}
                                                        {new Date(record.checkOutTime).toLocaleTimeString(
                                                            [],
                                                            { hour: '2-digit', minute: '2-digit' }
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {record.workHours && (
                                                <span className="text-sm">{record.workHours.toFixed(1)}h</span>
                                            )}
                                            <Badge>{record.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
