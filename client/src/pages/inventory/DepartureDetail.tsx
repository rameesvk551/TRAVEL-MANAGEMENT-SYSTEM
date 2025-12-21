import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api';
import { DepartureDetail as DepartureDetailComponent } from '@/components/inventory';

export default function DepartureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: departure, isLoading, error } = useQuery({
    queryKey: ['departure', id],
    queryFn: () => inventoryApi.getDeparture(id!),
    enabled: !!id,
  });

  if (!id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Invalid departure ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !departure) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load departure details</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inventory')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Departure Details</h1>
      </div>

      <DepartureDetailComponent 
        departure={departure}
        resourceName={departure.departure?.resourceId || 'Resource'}
        activeHolds={[]}
        onAddBooking={() => {}}
        onBlockSeats={() => {}}
        onEditDeparture={() => {}}
        onCloseBooking={() => {}}
      />
    </div>
  );
}
