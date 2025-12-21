/**
 * Mobile Check-In Component
 * GPS-enabled check-in/check-out for field staff
 */
import { useState, useEffect } from 'react';
import { useTodayStatus, useCheckIn, useCheckOut } from '@/hooks/hrms';
import { Button, Card, CardHeader, CardContent } from '@/components/ui';
import type { GeoLocation } from '@/types/hrms.types';

export function MobileCheckIn() {
    const [location, setLocation] = useState<GeoLocation | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const { data: todayStatus, isLoading } = useTodayStatus();
    const checkInMutation = useCheckIn();
    const checkOutMutation = useCheckOut();

    const attendance = todayStatus?.data;
    const isCheckedIn = attendance?.checkInTime && !attendance?.checkOutTime;
    const isCheckedOut = attendance?.checkInTime && attendance?.checkOutTime;

    const getCurrentLocation = (): Promise<GeoLocation> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                },
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    };

    useEffect(() => {
        // Get location on mount
        setIsGettingLocation(true);
        getCurrentLocation()
            .then(setLocation)
            .catch((err) => setLocationError(err.message))
            .finally(() => setIsGettingLocation(false));
    }, []);

    const handleCheckIn = async () => {
        try {
            const loc = await getCurrentLocation();
            await checkInMutation.mutateAsync({ location: loc });
        } catch (error) {
            console.error('Check-in failed:', error);
        }
    };

    const handleCheckOut = async () => {
        try {
            const loc = await getCurrentLocation();
            await checkOutMutation.mutateAsync({ location: loc });
        } catch (error) {
            console.error('Check-out failed:', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    Loading attendance status...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <h2 className="text-xl font-semibold text-center">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </h2>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status Display */}
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                    {isCheckedOut ? (
                        <>
                            <div className="text-green-600 text-lg font-medium">
                                ✓ Day Complete
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                In: {new Date(attendance.checkInTime!).toLocaleTimeString()}
                                {' → '}
                                Out: {new Date(attendance.checkOutTime!).toLocaleTimeString()}
                            </div>
                            <div className="text-sm text-gray-500">
                                Hours: {attendance.workHours?.toFixed(1) || '-'}
                            </div>
                        </>
                    ) : isCheckedIn ? (
                        <>
                            <div className="text-blue-600 text-lg font-medium">
                                Currently Working
                            </div>
                            <div className="text-sm text-gray-500 mt-2">
                                Checked in at:{' '}
                                {new Date(attendance.checkInTime!).toLocaleTimeString()}
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500 text-lg">Not checked in yet</div>
                    )}
                </div>

                {/* Location Status */}
                <div className="text-center text-sm">
                    {isGettingLocation ? (
                        <span className="text-gray-500">📍 Getting location...</span>
                    ) : locationError ? (
                        <span className="text-red-500">⚠️ {locationError}</span>
                    ) : location ? (
                        <span className="text-green-600">
                            📍 Location ready (±{location.accuracy?.toFixed(0)}m)
                        </span>
                    ) : null}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {!isCheckedIn && !isCheckedOut && (
                        <Button
                            onClick={handleCheckIn}
                            disabled={checkInMutation.isPending || !location}
                            className="w-full py-6 text-lg"
                        >
                            {checkInMutation.isPending ? 'Checking in...' : '🕐 Check In'}
                        </Button>
                    )}

                    {isCheckedIn && (
                        <Button
                            onClick={handleCheckOut}
                            disabled={checkOutMutation.isPending}
                            variant="outline"
                            className="w-full py-6 text-lg"
                        >
                            {checkOutMutation.isPending ? 'Checking out...' : '🕐 Check Out'}
                        </Button>
                    )}
                </div>

                {/* Trip Info (if on trip) */}
                {attendance?.tripId && (
                    <div className="p-3 bg-blue-50 rounded text-sm">
                        <span className="font-medium">On Trip:</span> {attendance.tripId}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
