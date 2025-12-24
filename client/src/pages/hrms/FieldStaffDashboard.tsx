/**
 * Field Staff Dashboard (Mobile-First)
 * Personalized dashboard for field employees (guides, drivers, crew)
 * Following architecture spec section 8.1
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight,
  Sun,
  Moon,
  CloudSun,
  Briefcase,
  Users,
} from 'lucide-react';
import { 
  useTodayStatus, 
  useCheckIn, 
  useCheckOut,
  useLeaveBalance,
  useMyTripAssignments,
} from '@/hooks/hrms';
import { useMyAttendance } from '@/hooks/hrms';
import type { GeoLocation, TripAssignment, LeaveBalance } from '@/types/hrms.types';

// Get greeting based on time of day
function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sun className="w-6 h-6 text-yellow-500" /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <CloudSun className="w-6 h-6 text-orange-500" /> };
  return { text: 'Good Evening', icon: <Moon className="w-6 h-6 text-indigo-500" /> };
}

// Format date range
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
  }
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
}

// Role display name
const ROLE_DISPLAY: Record<string, string> = {
  guide: 'Lead Guide',
  driver: 'Driver',
  coordinator: 'Coordinator',
  photographer: 'Photographer',
  support: 'Support Staff',
};

export default function FieldStaffDashboard() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationName, setLocationName] = useState<string>('Getting location...');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Hooks
  const { data: todayStatus, isLoading: loadingStatus } = useTodayStatus();
  const { data: leaveBalanceData, isLoading: loadingBalance } = useLeaveBalance();
  const { data: tripAssignmentsData, isLoading: loadingTrips } = useMyTripAssignments({ upcoming: true });
  const { data: monthAttendanceData } = useMyAttendance({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const attendance = todayStatus?.data;
  const isCheckedIn = attendance?.checkInTime && !attendance?.checkOutTime;
  const isCheckedOut = attendance?.checkInTime && attendance?.checkOutTime;
  const leaveBalances: LeaveBalance[] = leaveBalanceData?.data || [];
  const upcomingTrips: TripAssignment[] = tripAssignmentsData?.data || [];
  const monthAttendance = monthAttendanceData?.data || [];

  // Calculate monthly stats
  const monthStats = {
    present: monthAttendance.filter(a => a.status === 'present').length,
    onTrip: monthAttendance.filter(a => a.status === 'on_trip').length,
    leave: monthAttendance.filter(a => a.status === 'absent' || a.status === 'half_day').length,
  };

  // Get current location
  useEffect(() => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(loc);
          // Reverse geocode for location name (simplified)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`
            );
            const data = await response.json();
            setLocationName(data.address?.suburb || data.address?.city || data.display_name?.split(',')[0] || 'Unknown Location');
          } catch {
            setLocationName('Location detected');
          }
          setIsGettingLocation(false);
        },
        () => {
          setLocationName('Location unavailable');
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleCheckIn = async () => {
    if (!location) return;
    await checkInMutation.mutateAsync({ location });
  };

  const handleCheckOut = async () => {
    if (!location) return;
    await checkOutMutation.mutateAsync({ location });
  };

  const greeting = getGreeting();

  // Mock user data (in real app, this comes from auth context)
  const user = {
    firstName: 'Rajesh',
    role: 'Guide',
    company: 'Himalayan Expeditions',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header / Greeting */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-2">
          {greeting.icon}
          <span className="text-lg opacity-90">{greeting.text},</span>
        </div>
        <h1 className="text-2xl font-bold">{user.firstName}! 👋</h1>
        <p className="text-blue-100 mt-1">{user.role} · {user.company}</p>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Check-In Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{isGettingLocation ? 'Getting location...' : locationName}</span>
            </div>
            {attendance?.checkInTime && (
              <div className="text-xs text-gray-400">
                Last: {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {loadingStatus ? (
            <div className="text-center py-4 text-gray-400">Loading status...</div>
          ) : isCheckedOut ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-green-600 font-semibold text-lg">Day Complete ✓</div>
              <div className="text-sm text-gray-500 mt-1">
                {attendance?.workHours?.toFixed(1)}h worked today
              </div>
            </div>
          ) : (
            <button
              onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
              disabled={checkInMutation.isPending || checkOutMutation.isPending || !location}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2
                transition-all duration-200 disabled:opacity-50
                ${isCheckedIn 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              <MapPin className="w-5 h-5" />
              {checkInMutation.isPending || checkOutMutation.isPending 
                ? 'Processing...' 
                : isCheckedIn 
                  ? 'CHECK OUT' 
                  : 'CHECK IN'
              }
            </button>
          )}
        </div>

        {/* Upcoming Trips */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Trips
            </h2>
            <Link to="/hrms/trips" className="text-blue-600 text-sm flex items-center">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingTrips ? (
            <div className="text-gray-400 text-center py-4">Loading trips...</div>
          ) : upcomingTrips.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No upcoming trips assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <div
                  key={trip.id}
                  className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">
                    Trip #{trip.tripId.slice(0, 8)}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500">
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </span>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${trip.role === 'guide' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}
                    `}>
                      {ROLE_DISPLAY[trip.role] || trip.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Team assigned
                    </span>
                    <span className={`
                      ${trip.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}
                    `}>
                      {trip.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Month Stats */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 This Month
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{monthStats.present}</div>
              <div className="text-xs text-gray-500 mt-1">Present</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{monthStats.onTrip}</div>
              <div className="text-xs text-gray-500 mt-1">On Trip</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-xl">
              <div className="text-2xl font-bold text-amber-600">{monthStats.leave}</div>
              <div className="text-xs text-gray-500 mt-1">Leave</div>
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              💰 Leave Balance
            </h2>
            <Link to="/hrms/leaves" className="text-blue-600 text-sm flex items-center">
              Apply <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingBalance ? (
            <div className="text-gray-400 text-center py-4">Loading...</div>
          ) : leaveBalances.length === 0 ? (
            <div className="text-gray-400 text-center py-4">No leave data</div>
          ) : (
            <div className="flex justify-between">
              {leaveBalances.slice(0, 3).map((balance) => (
                <div key={balance.leaveType} className="text-center">
                  <div className="text-xl font-bold text-gray-800">{balance.remaining}</div>
                  <div className="text-xs text-gray-500 capitalize mt-1">
                    {balance.leaveType.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/hrms/leaves/apply"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              📝
            </div>
            <div className="text-xs text-gray-600">Apply Leave</div>
          </Link>
          <Link
            to="/hrms/payroll"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              💵
            </div>
            <div className="text-xs text-gray-600">Payslips</div>
          </Link>
          <Link
            to="/hrms/attendance"
            className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              📅
            </div>
            <div className="text-xs text-gray-600">Attendance</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
