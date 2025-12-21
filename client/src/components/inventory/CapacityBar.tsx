import { cn } from '@/utils/cn';
import type { InventoryState, DepartureStatus } from '@/types';

interface CapacityBarProps {
    inventory: InventoryState;
    status: DepartureStatus;
    showLabels?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Visual capacity bar showing inventory breakdown
 * 
 * Shows: Confirmed | Held | Available
 * Color-coded by status
 */
export function CapacityBar({
    inventory,
    status,
    showLabels = false,
    size = 'md',
    className,
}: CapacityBarProps) {
    const { sellableCapacity, confirmedSeats, heldSeats } = inventory;

    // Calculate percentages
    const confirmedPercent = sellableCapacity > 0 
        ? (confirmedSeats / sellableCapacity) * 100 
        : 0;
    const heldPercent = sellableCapacity > 0 
        ? (heldSeats / sellableCapacity) * 100 
        : 0;

    // Status-based colors
    const statusColors: Record<DepartureStatus, string> = {
        SCHEDULED: 'bg-gray-400',
        OPEN: 'bg-emerald-500',
        FEW_LEFT: 'bg-amber-500',
        FULL: 'bg-red-500',
        WAITLIST: 'bg-purple-500',
        CLOSED: 'bg-gray-500',
        CANCELLED: 'bg-gray-300',
        DEPARTED: 'bg-blue-400',
    };

    const heights = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4',
    };

    return (
        <div className={cn('w-full', className)}>
            {/* Bar */}
            <div className={cn('w-full rounded-full bg-gray-100 overflow-hidden', heights[size])}>
                <div className="h-full flex">
                    {/* Confirmed */}
                    {confirmedPercent > 0 && (
                        <div
                            className={cn('h-full transition-all', statusColors[status])}
                            style={{ width: `${confirmedPercent}%` }}
                            title={`Confirmed: ${confirmedSeats}`}
                        />
                    )}
                    {/* Held */}
                    {heldPercent > 0 && (
                        <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{ width: `${heldPercent}%` }}
                            title={`Held: ${heldSeats}`}
                        />
                    )}
                    {/* Available (implicit - gray background) */}
                </div>
            </div>

            {/* Labels */}
            {showLabels && (
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>{confirmedSeats} confirmed</span>
                    {heldSeats > 0 && (
                        <span className="text-yellow-600">{heldSeats} held</span>
                    )}
                    <span>{inventory.availableSeats} available</span>
                </div>
            )}
        </div>
    );
}

interface StatusBadgeProps {
    status: DepartureStatus;
    size?: 'sm' | 'md';
}

/**
 * Status badge with color coding
 */
export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const statusConfig: Record<DepartureStatus, { label: string; className: string }> = {
        SCHEDULED: { label: 'Scheduled', className: 'bg-gray-100 text-gray-700' },
        OPEN: { label: 'Open', className: 'bg-emerald-100 text-emerald-700' },
        FEW_LEFT: { label: 'Few Left', className: 'bg-amber-100 text-amber-700' },
        FULL: { label: 'Full', className: 'bg-red-100 text-red-700' },
        WAITLIST: { label: 'Waitlist', className: 'bg-purple-100 text-purple-700' },
        CLOSED: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
        CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
        DEPARTED: { label: 'Departed', className: 'bg-blue-100 text-blue-700' },
    };

    const config = statusConfig[status];
    const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

    return (
        <span className={cn('rounded-full font-medium', config.className, sizeClasses)}>
            {config.label}
        </span>
    );
}
