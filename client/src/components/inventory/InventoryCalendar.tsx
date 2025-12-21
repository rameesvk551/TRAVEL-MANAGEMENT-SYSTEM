import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { CapacityBar, StatusBadge } from './CapacityBar';
import { cn } from '@/utils/cn';
import type { DepartureWithInventory } from '@/types';

interface InventoryCalendarProps {
    departures: DepartureWithInventory[];
    resources: { id: string; name: string; type: string }[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onDepartureClick: (departure: DepartureWithInventory) => void;
    onAddDeparture?: (resourceId: string, date: Date) => void;
    isLoading?: boolean;
}

/**
 * Inventory Calendar - Visual calendar showing departure availability
 * 
 * Features:
 * - Week view with resource rows
 * - Capacity bars showing fill status
 * - Color-coded status indicators
 * - Click to view departure details
 */
export function InventoryCalendar({
    departures,
    resources,
    currentDate,
    onDateChange,
    onDepartureClick,
    onAddDeparture,
    isLoading,
}: InventoryCalendarProps) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const goToPreviousWeek = () => onDateChange(addDays(currentDate, -7));
    const goToNextWeek = () => onDateChange(addDays(currentDate, 7));
    const goToToday = () => onDateChange(new Date());

    // Group departures by resource and date
    const getDepartureForCell = (resourceId: string, date: Date) => {
        return departures.find(
            d => d.departure.resourceId === resourceId &&
                isSameDay(new Date(d.departure.departureDate), date)
        );
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Inventory Calendar
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={goToNextWeek}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="w-48 p-2 text-left text-sm font-medium text-muted-foreground border-b">
                                        Resource
                                    </th>
                                    {weekDays.map((day: Date) => (
                                        <th
                                            key={day.toISOString()}
                                            className={cn(
                                                'p-2 text-center text-sm font-medium border-b min-w-[120px]',
                                                isSameDay(day, new Date())
                                                    ? 'bg-primary/5 text-primary'
                                                    : 'text-muted-foreground'
                                            )}
                                        >
                                            <div>{format(day, 'EEE')}</div>
                                            <div className="text-xs">{format(day, 'MMM d')}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map(resource => (
                                    <tr key={resource.id} className="border-b last:border-0">
                                        <td className="p-2">
                                            <div className="font-medium text-sm">{resource.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {resource.type.toLowerCase()}
                                            </div>
                                        </td>
                                        {weekDays.map((day: Date) => {
                                            const departure = getDepartureForCell(resource.id, day);
                                            return (
                                                <td
                                                    key={day.toISOString()}
                                                    className={cn(
                                                        'p-1 border-l',
                                                        isSameDay(day, new Date()) && 'bg-primary/5'
                                                    )}
                                                >
                                                    {departure ? (
                                                        <DepartureCell
                                                            departure={departure}
                                                            onClick={() => onDepartureClick(departure)}
                                                        />
                                                    ) : (
                                                        <EmptyCell
                                                            onAdd={
                                                                onAddDeparture
                                                                    ? () => onAddDeparture(resource.id, day)
                                                                    : undefined
                                                            }
                                                        />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <LegendItem color="bg-emerald-500" label="Open" />
                    <LegendItem color="bg-amber-500" label="Few Left" />
                    <LegendItem color="bg-red-500" label="Full" />
                    <LegendItem color="bg-yellow-400" label="Held" />
                    <LegendItem color="bg-gray-100" label="Available" />
                </div>
            </CardContent>
        </Card>
    );
}

interface DepartureCellProps {
    departure: DepartureWithInventory;
    onClick: () => void;
}

function DepartureCell({ departure, onClick }: DepartureCellProps) {
    const { inventory, departure: dep } = departure;

    return (
        <button
            onClick={onClick}
            className="w-full p-2 rounded-md hover:bg-accent transition-colors text-left"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                    {inventory.confirmedSeats}/{inventory.sellableCapacity}
                </span>
                <StatusBadge status={dep.status} size="sm" />
            </div>
            <CapacityBar inventory={inventory} status={dep.status} size="sm" />
            {inventory.heldSeats > 0 && (
                <div className="text-[10px] text-yellow-600 mt-1">
                    {inventory.heldSeats} held
                </div>
            )}
        </button>
    );
}

interface EmptyCellProps {
    onAdd?: () => void;
}

function EmptyCell({ onAdd }: EmptyCellProps) {
    if (!onAdd) {
        return <div className="h-16 bg-gray-50 rounded-md" />;
    }

    return (
        <button
            onClick={onAdd}
            className="w-full h-16 rounded-md border-2 border-dashed border-gray-200 
                       hover:border-primary hover:bg-primary/5 transition-colors
                       flex items-center justify-center text-gray-400 hover:text-primary"
        >
            <span className="text-lg">+</span>
        </button>
    );
}

interface LegendItemProps {
    color: string;
    label: string;
}

function LegendItem({ color, label }: LegendItemProps) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-sm', color)} />
            <span className="text-muted-foreground">{label}</span>
        </div>
    );
}
