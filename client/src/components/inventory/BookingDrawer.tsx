import { useState, useEffect } from 'react';
import { X, Users, Mail, Phone, Globe, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { CapacityBar, StatusBadge } from './CapacityBar';
import { cn } from '@/utils/cn';
import type {
    DepartureWithInventory,
    BookingSource,
    GuestDetails,
    InitiateBookingRequest,
    BookingInitResult,
} from '@/types';

interface BookingDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    departure: DepartureWithInventory | null;
    resourceName: string;
    onSubmit: (data: InitiateBookingRequest) => Promise<BookingInitResult>;
}

type PaymentOption = 'FULL' | 'DEPOSIT' | 'PAYMENT_LINK' | 'MANUAL' | 'OTA_COLLECT';

const SOURCE_OPTIONS: { value: BookingSource; label: string }[] = [
    { value: 'DIRECT', label: 'Website (Direct)' },
    { value: 'MANUAL', label: 'WhatsApp' },
    { value: 'MANUAL', label: 'Phone' },
    { value: 'MANUAL', label: 'Walk-in' },
    { value: 'OTA', label: 'OTA (Viator)' },
    { value: 'OTA', label: 'OTA (GetYourGuide)' },
    { value: 'EMAIL', label: 'Email Inquiry' },
];

/**
 * Unified Booking Drawer - Single form for ALL booking channels
 * 
 * Used by:
 * - Staff creating manual bookings (WhatsApp/Phone/Walk-in)
 * - Admin entering OTA bookings
 * - Processing email inquiries
 * 
 * Key principle: Source is METADATA, not logic
 */
export function BookingDrawer({
    isOpen,
    onClose,
    departure,
    resourceName,
    onSubmit,
}: BookingDrawerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [source, setSource] = useState<BookingSource>('MANUAL');
    const [sourcePlatform, setSourcePlatform] = useState('');
    const [externalRef, setExternalRef] = useState('');
    const [participantCount, setParticipantCount] = useState(1);
    const [primaryGuest, setPrimaryGuest] = useState<GuestDetails>({
        name: '',
        email: '',
        phone: '',
        nationality: '',
    });
    const [specialRequirements, setSpecialRequirements] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentOption, setPaymentOption] = useState<PaymentOption>('FULL');

    // Reset form when drawer opens
    useEffect(() => {
        if (isOpen) {
            setSource('MANUAL');
            setSourcePlatform('');
            setExternalRef('');
            setParticipantCount(1);
            setPrimaryGuest({ name: '', email: '', phone: '', nationality: '' });
            setSpecialRequirements('');
            setNotes('');
            setPaymentOption('FULL');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen || !departure) return null;

    const { inventory, departure: dep } = departure;
    const unitPrice = dep.priceOverride ?? 0;
    const subtotal = unitPrice * participantCount;
    const taxRate = 0.18; // 18% GST
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    const canBook = inventory.availableSeats >= participantCount;
    const requiresOverbooking = !canBook && inventory.bookableSeats >= participantCount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await onSubmit({
                departureId: dep.id,
                resourceId: dep.resourceId,
                participantCount,
                primaryGuest,
                source,
                sourcePlatform: sourcePlatform || undefined,
                externalRef: externalRef || undefined,
                specialRequirements: specialRequirements || undefined,
                notes: notes || undefined,
            });

            if (!result.success) {
                setError(result.errorMessage || 'Failed to create booking');
            } else {
                onClose();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-background z-50 
                          shadow-xl overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">New Booking</h2>
                        <p className="text-sm text-muted-foreground">
                            {resourceName} - {new Date(dep.departureDate).toLocaleDateString()}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Availability Card */}
                    <Card>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Availability</span>
                                <StatusBadge status={dep.status} />
                            </div>
                            <div className="text-2xl font-bold mb-2">
                                {inventory.availableSeats} seats remaining
                            </div>
                            <CapacityBar inventory={inventory} status={dep.status} showLabels />
                            {inventory.heldSeats > 0 && (
                                <p className="text-xs text-yellow-600 mt-2">
                                    {inventory.heldSeats} seats currently held by others
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Booking Source */}
                    <div className="space-y-3">
                        <h3 className="font-medium">Booking Source</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {SOURCE_OPTIONS.map((option, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setSource(option.value);
                                        setSourcePlatform(option.label.includes('OTA') 
                                            ? option.label.replace('OTA (', '').replace(')', '').toLowerCase()
                                            : '');
                                    }}
                                    className={cn(
                                        'p-2 text-sm rounded-md border transition-colors',
                                        source === option.value && sourcePlatform === (
                                            option.label.includes('OTA')
                                                ? option.label.replace('OTA (', '').replace(')', '').toLowerCase()
                                                : ''
                                        )
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-input hover:bg-accent'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {(source === 'OTA' || externalRef) && (
                            <Input
                                placeholder="External Reference (OTA booking ID)"
                                value={externalRef}
                                onChange={e => setExternalRef(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Guest Details */}
                    <div className="space-y-3">
                        <h3 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Guest Details
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-sm">Participants:</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setParticipantCount(Math.max(1, participantCount - 1))}
                                >
                                    -
                                </Button>
                                <span className="w-8 text-center font-semibold">{participantCount}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setParticipantCount(participantCount + 1)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Primary Guest</label>
                            <Input
                                placeholder="Full Name *"
                                value={primaryGuest.name}
                                onChange={e => setPrimaryGuest({ ...primaryGuest, name: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Email"
                                        type="email"
                                        value={primaryGuest.email}
                                        onChange={e => setPrimaryGuest({ ...primaryGuest, email: e.target.value })}
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Phone"
                                        value={primaryGuest.phone}
                                        onChange={e => setPrimaryGuest({ ...primaryGuest, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Nationality"
                                    value={primaryGuest.nationality}
                                    onChange={e => setPrimaryGuest({ ...primaryGuest, nationality: e.target.value })}
                                />
                            </div>
                        </div>

                        <textarea
                            className="w-full p-3 border rounded-md text-sm resize-none"
                            rows={2}
                            placeholder="Special requirements (dietary, medical, etc.)"
                            value={specialRequirements}
                            onChange={e => setSpecialRequirements(e.target.value)}
                        />
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                        <h3 className="font-medium">Pricing</h3>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Unit Price × {participantCount}</span>
                                <span>₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Tax (18% GST)</span>
                                <span>₹{taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold text-base">
                                <span>Total</span>
                                <span>₹{totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div className="space-y-3">
                        <h3 className="font-medium">Payment</h3>
                        <div className="space-y-2">
                            {[
                                { value: 'FULL' as PaymentOption, label: 'Full Payment Now' },
                                { value: 'DEPOSIT' as PaymentOption, label: `Deposit (30%): ₹${(totalAmount * 0.3).toLocaleString()}` },
                                { value: 'PAYMENT_LINK' as PaymentOption, label: 'Send Payment Link (48 hours)' },
                                { value: 'MANUAL' as PaymentOption, label: 'Record Manual Payment (cash/bank)' },
                                { value: 'OTA_COLLECT' as PaymentOption, label: 'Mark as Paid (OTA will collect)' },
                            ].map(option => (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors',
                                        paymentOption === option.value
                                            ? 'border-primary bg-primary/5'
                                            : 'border-input hover:bg-accent'
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value={option.value}
                                        checked={paymentOption === option.value}
                                        onChange={() => setPaymentOption(option.value)}
                                        className="text-primary"
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Staff Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Staff Notes (Internal)</label>
                        <textarea
                            className="w-full p-3 border rounded-md text-sm resize-none"
                            rows={2}
                            placeholder="Internal notes about this booking..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Warnings */}
                    {!canBook && !requiresOverbooking && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Insufficient Availability</p>
                                <p>Only {inventory.availableSeats} seats available. Cannot book {participantCount} participants.</p>
                            </div>
                        </div>
                    )}

                    {requiresOverbooking && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-md text-sm">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Overbooking Required</p>
                                <p>This will use {participantCount - inventory.availableSeats} of {dep.overbookingLimit} overbooking slots.</p>
                            </div>
                        </div>
                    )}

                    {/* Hold Warning */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p>
                            Creating this booking will hold {participantCount} seat{participantCount > 1 ? 's' : ''} for 
                            {source === 'MANUAL' ? ' 24 hours' : ' 30 minutes'}. 
                            Seats will be released if payment is not completed.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isSubmitting || (!canBook && !requiresOverbooking) || !primaryGuest.name}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Booking & Process →'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
