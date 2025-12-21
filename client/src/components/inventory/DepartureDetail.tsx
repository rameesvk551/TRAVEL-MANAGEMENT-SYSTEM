import { format } from 'date-fns';
import { Calendar, Users, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { CapacityBar, StatusBadge } from './CapacityBar';
import type { DepartureWithInventory, ActiveHold } from '@/types';

interface DepartureDetailProps {
    departure: DepartureWithInventory;
    resourceName: string;
    activeHolds: ActiveHold[];
    onAddBooking: () => void;
    onBlockSeats: () => void;
    onEditDeparture: () => void;
    onCloseBooking: () => void;
}

/**
 * Departure Detail View - Full inventory breakdown for a single departure
 */
export function DepartureDetail({
    departure,
    resourceName,
    activeHolds,
    onAddBooking,
    onBlockSeats,
    onEditDeparture,
    onCloseBooking,
}: DepartureDetailProps) {
    const { inventory, departure: dep } = departure;

    const overbookingUsed = Math.max(0, inventory.confirmedSeats - inventory.sellableCapacity);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{resourceName}</h1>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(dep.departureDate), 'EEEE, MMMM d, yyyy')}
                        {dep.departureTime && ` at ${dep.departureTime}`}
                    </p>
                </div>
                <StatusBadge status={dep.status} size="md" />
            </div>

            {/* Capacity Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Capacity Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Main capacity bar */}
                    <CapacityBar inventory={inventory} status={dep.status} size="lg" showLabels />

                    {/* Capacity flow */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Total: {inventory.totalCapacity}</span>
                        <span>→</span>
                        <span>Blocked: {inventory.blockedSeats}</span>
                        <span>→</span>
                        <span>Sellable: {inventory.sellableCapacity}</span>
                        <span>→</span>
                        <span className="font-semibold text-foreground">
                            Available: {inventory.availableSeats}
                        </span>
                    </div>

                    {/* Channel breakdown */}
                    <div className="grid grid-cols-4 gap-4">
                        <ChannelStat
                            label="Website"
                            value={inventory.websiteBookings}
                            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                        />
                        <ChannelStat
                            label="OTA"
                            value={inventory.otaBookings}
                            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                        />
                        <ChannelStat
                            label="Manual"
                            value={inventory.manualBookings}
                            icon={<Users className="h-4 w-4 text-purple-500" />}
                        />
                        <ChannelStat
                            label="Waitlist"
                            value={inventory.waitlistCount}
                            icon={<Clock className="h-4 w-4 text-amber-500" />}
                        />
                    </div>

                    {/* Overbooking status */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm">Overbooking Limit</span>
                        <span className="font-medium">
                            {overbookingUsed} / {dep.overbookingLimit} used
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Active Holds */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Active Holds ({activeHolds.length})</CardTitle>
                    <Button variant="ghost" size="sm">
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {activeHolds.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No active holds
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {activeHolds.map(hold => (
                                <HoldRow key={hold.id} hold={hold} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button onClick={onAddBooking} className="w-full">
                            + Add Booking
                        </Button>
                        <Button variant="outline" onClick={onBlockSeats} className="w-full">
                            🔒 Block Seats
                        </Button>
                        <Button variant="outline" onClick={onEditDeparture} className="w-full">
                            ⚙️ Edit Departure
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onCloseBooking}
                            className="w-full text-red-600 hover:text-red-700"
                        >
                            🚫 Close Booking
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Warnings */}
            {dep.minParticipants > 0 && inventory.confirmedSeats < dep.minParticipants && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-amber-800">Minimum Not Reached</p>
                        <p className="text-sm text-amber-700">
                            Need {dep.minParticipants - inventory.confirmedSeats} more participants 
                            for guaranteed departure (minimum: {dep.minParticipants}).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ChannelStatProps {
    label: string;
    value: number;
    icon: React.ReactNode;
}

function ChannelStat({ label, value, icon }: ChannelStatProps) {
    return (
        <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
                {icon}
                <span className="text-2xl font-bold">{value}</span>
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}

interface HoldRowProps {
    hold: ActiveHold;
}

function HoldRow({ hold }: HoldRowProps) {
    const isExpiringSoon = hold.remainingMinutes <= 5;

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <p className="font-medium">{hold.guestName || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                    {hold.seatCount} seat{hold.seatCount > 1 ? 's' : ''} • {hold.source}
                </p>
            </div>
            <div className="text-right">
                <p className={`text-sm font-medium ${isExpiringSoon ? 'text-red-600' : 'text-amber-600'}`}>
                    {hold.remainingMinutes} min remaining
                </p>
                <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${isExpiringSoon ? 'bg-red-500' : 'bg-amber-500'}`}
                        style={{
                            width: `${Math.min(100, (hold.remainingMinutes / 30) * 100)}%`,
                        }}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm">
                    Extend
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                    Cancel
                </Button>
            </div>
        </div>
    );
}
