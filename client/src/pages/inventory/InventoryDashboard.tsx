import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Calendar, Filter, Plus, RefreshCw } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import {
    InventoryCalendar,
    BookingDrawer,
    DepartureDetail,
} from '@/components/inventory';
import { AddDepartureModal, type CreateDepartureData } from '@/components/inventory/AddDepartureModal';
import {
    useInventoryCalendar,
    useActiveHolds,
    useInitiateBooking,
    useResources,
    useCreateDeparture,
} from '@/hooks';
import type { DepartureWithInventory, InitiateBookingRequest, Resource } from '@/types';

/**
 * Inventory Dashboard Page
 * 
 * Main view for managing departure inventory:
 * - Calendar view of all departures
 * - Capacity visualization
 * - Quick booking creation
 * - Departure detail view
 */
export default function InventoryDashboard() {
    // State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>();
    const [selectedDeparture, setSelectedDeparture] = useState<DepartureWithInventory | null>(null);
    const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'detail'>('calendar');
    
    // Add departure modal state
    const [addDepartureModal, setAddDepartureModal] = useState<{
        isOpen: boolean;
        resourceId: string;
        resourceName: string;
        date: Date;
    } | null>(null);

    // Date range for calendar
    const dateFrom = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const dateTo = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    // Queries
    const { data: resourcesData } = useResources();
    const resourcesList = resourcesData?.data ?? [];
    const {
        data: calendarData,
        isLoading: isCalendarLoading,
        refetch: refetchCalendar,
    } = useInventoryCalendar(dateFrom, dateTo, selectedResourceId);

    // Get active holds for selected departure
    const { data: activeHolds = [] } = useActiveHolds(selectedDeparture?.departure.id ?? '');

    // Mutations
    const initiateBooking = useInitiateBooking();
    const createDeparture = useCreateDeparture();

    // Transform calendar data for InventoryCalendar component
    const calendarDepartures = useMemo(() => {
        if (!calendarData) return [];
        return calendarData.departures.map(d => ({
            departure: {
                id: d.id,
                tenantId: '',
                resourceId: d.resourceId,
                departureDate: d.date,
                totalCapacity: d.totalCapacity,
                blockedSeats: 0,
                overbookingLimit: 0,
                minParticipants: 0,
                status: d.status,
                isGuaranteed: false,
                currency: 'INR',
                attributes: {},
                version: 1,
                createdAt: '',
                updatedAt: '',
            },
            inventory: {
                departureId: d.id,
                totalCapacity: d.totalCapacity,
                blockedSeats: 0,
                sellableCapacity: d.totalCapacity,
                heldSeats: d.heldSeats,
                confirmedSeats: d.confirmedSeats,
                availableSeats: d.availableSeats,
                bookableSeats: d.availableSeats,
                waitlistCount: 0,
                websiteBookings: 0,
                otaBookings: 0,
                manualBookings: 0,
            },
        })) as DepartureWithInventory[];
    }, [calendarData]);

    const calendarResources = useMemo(() => {
        return resourcesList.map((r: Resource) => ({
            id: r.id,
            name: r.name,
            type: r.type,
        }));
    }, [resourcesList]);

    // Handlers
    const handleDepartureClick = (departure: DepartureWithInventory) => {
        setSelectedDeparture(departure);
        setViewMode('detail');
    };

    const handleAddDeparture = (resourceId: string, date: Date) => {
        const resource = resourcesList.find((r: Resource) => r.id === resourceId);
        setAddDepartureModal({
            isOpen: true,
            resourceId,
            resourceName: resource?.name ?? 'Unknown Resource',
            date,
        });
    };

    const handleCreateDeparture = async (data: CreateDepartureData) => {
        try {
            await createDeparture.mutateAsync({
                resourceId: data.resourceId,
                departureDate: data.departureDate,
                departureTime: data.departureTime,
                totalCapacity: data.totalCapacity,
                blockedSeats: data.blockedSeats,
                minParticipants: data.minParticipants,
                overbookingLimit: data.overbookingLimit,
                priceOverride: data.priceOverride,
            });
            // After creating, refresh the calendar
            refetchCalendar();
        } catch (error) {
            console.error('Failed to create departure:', error);
        }
    };

    const handleOpenBookingDrawer = () => {
        setIsBookingDrawerOpen(true);
    };

    const handleBookingSubmit = async (data: InitiateBookingRequest) => {
        return initiateBooking.mutateAsync(data);
    };

    const handleBackToCalendar = () => {
        setSelectedDeparture(null);
        setViewMode('calendar');
    };

    // Get resource name for selected departure
    const selectedResourceName = useMemo(() => {
        if (!selectedDeparture) return '';
        const resource = resourcesList.find((r: Resource) => r.id === selectedDeparture.departure.resourceId);
        return resource?.name ?? 'Unknown Resource';
    }, [selectedDeparture, resourcesList]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6" />
                        Inventory Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage departure capacity, holds, and availability
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchCalendar()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Departure
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <select
                            className="border rounded-md px-3 py-1.5 text-sm"
                            value={selectedResourceId ?? ''}
                            onChange={e => setSelectedResourceId(e.target.value || undefined)}
                        >
                            <option value="">All Resources</option>
                            {resourcesList.map((r: Resource) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-muted-foreground">
                            {calendarDepartures.length} departures shown
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            {viewMode === 'calendar' ? (
                <InventoryCalendar
                    departures={calendarDepartures}
                    resources={calendarResources}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    onDepartureClick={handleDepartureClick}
                    onAddDeparture={handleAddDeparture}
                    isLoading={isCalendarLoading}
                />
            ) : selectedDeparture ? (
                <div>
                    <Button variant="ghost" className="mb-4" onClick={handleBackToCalendar}>
                        ← Back to Calendar
                    </Button>
                    <DepartureDetail
                        departure={selectedDeparture}
                        resourceName={selectedResourceName}
                        activeHolds={activeHolds}
                        onAddBooking={handleOpenBookingDrawer}
                        onBlockSeats={() => {}}
                        onEditDeparture={() => {}}
                        onCloseBooking={() => {}}
                    />
                </div>
            ) : null}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    title="Total Departures"
                    value={calendarDepartures.length}
                    subtitle="This month"
                />
                <StatCard
                    title="Open for Booking"
                    value={calendarDepartures.filter(d => d.departure.status === 'OPEN').length}
                    subtitle="Active"
                    highlight="green"
                />
                <StatCard
                    title="Near Full"
                    value={calendarDepartures.filter(d => d.departure.status === 'FEW_LEFT').length}
                    subtitle="< 20% available"
                    highlight="amber"
                />
                <StatCard
                    title="Fully Booked"
                    value={calendarDepartures.filter(d => d.departure.status === 'FULL').length}
                    subtitle="No availability"
                    highlight="red"
                />
            </div>

            {/* Booking Drawer */}
            <BookingDrawer
                isOpen={isBookingDrawerOpen}
                onClose={() => setIsBookingDrawerOpen(false)}
                departure={selectedDeparture}
                resourceName={selectedResourceName}
                onSubmit={handleBookingSubmit}
            />

            {/* Add Departure Modal */}
            {addDepartureModal && (
                <AddDepartureModal
                    isOpen={addDepartureModal.isOpen}
                    onClose={() => setAddDepartureModal(null)}
                    resourceId={addDepartureModal.resourceId}
                    resourceName={addDepartureModal.resourceName}
                    date={addDepartureModal.date}
                    onSubmit={handleCreateDeparture}
                />
            )}
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    subtitle: string;
    highlight?: 'green' | 'amber' | 'red';
}

function StatCard({ title, value, subtitle, highlight }: StatCardProps) {
    const highlightColors = {
        green: 'text-emerald-600',
        amber: 'text-amber-600',
        red: 'text-red-600',
    };

    return (
        <Card>
            <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className={`text-3xl font-bold ${highlight ? highlightColors[highlight] : ''}`}>
                    {value}
                </p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </CardContent>
        </Card>
    );
}
