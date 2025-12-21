import { useState } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Users, DollarSign } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@/components/ui';

interface AddDepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceName: string;
  date: Date;
  onSubmit: (data: CreateDepartureData) => Promise<void>;
}

export interface CreateDepartureData {
  resourceId: string;
  departureDate: string;
  departureTime?: string;
  totalCapacity: number;
  blockedSeats: number;
  overbookingLimit: number;
  minParticipants: number;
  priceOverride?: number;
  notes?: string;
}

export function AddDepartureModal({
  isOpen,
  onClose,
  resourceId,
  resourceName,
  date,
  onSubmit,
}: AddDepartureModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateDepartureData>({
    resourceId,
    departureDate: format(date, 'yyyy-MM-dd'),
    departureTime: '09:00',
    totalCapacity: 20,
    blockedSeats: 0,
    overbookingLimit: 0,
    minParticipants: 1,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create departure:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sellableCapacity = formData.totalCapacity - formData.blockedSeats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Add Departure</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resource & Date Info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{resourceName}</span>
              </div>
              <div className="text-lg font-semibold mt-1">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>

            {/* Departure Time */}
            <div>
              <label className="text-sm font-medium">Departure Time</label>
              <Input
                type="time"
                value={formData.departureTime}
                onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
              />
            </div>

            {/* Capacity Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" /> Total Capacity
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.totalCapacity}
                  onChange={e => setFormData({ 
                    ...formData, 
                    totalCapacity: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Blocked Seats</label>
                <Input
                  type="number"
                  min={0}
                  max={formData.totalCapacity - 1}
                  value={formData.blockedSeats}
                  onChange={e => setFormData({ 
                    ...formData, 
                    blockedSeats: parseInt(e.target.value) || 0 
                  })}
                />
              </div>
            </div>

            {/* Sellable Capacity Display */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-700">Sellable Capacity</div>
              <div className="text-2xl font-bold text-green-800">
                {sellableCapacity} seats
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Min Participants</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.minParticipants}
                  onChange={e => setFormData({ 
                    ...formData, 
                    minParticipants: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Overbooking Limit</label>
                <Input
                  type="number"
                  min={0}
                  value={formData.overbookingLimit}
                  onChange={e => setFormData({ 
                    ...formData, 
                    overbookingLimit: parseInt(e.target.value) || 0 
                  })}
                />
              </div>
            </div>

            {/* Price Override */}
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Price Override (optional)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="Use default resource price"
                value={formData.priceOverride ?? ''}
                onChange={e => setFormData({ 
                  ...formData, 
                  priceOverride: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Departure'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
