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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 pt-8 pb-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            {greeting.icon}
            <span className="text-white/90 text-base">{greeting.text},</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{user.firstName}! 👋</h1>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span>{user.role}</span>
            <span>·</span>
            <span>{user.company}</span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-16 pb-8 space-y-5">
        {/* Check-In Card - Premium Design */}
        <div className="bg-white rounded-3xl shadow-xl p-6 backdrop-blur-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">{isGettingLocation ? 'Getting location...' : locationName}</span>
            </div>
            {attendance?.checkInTime && (
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {loadingStatus ? (
            <div className="text-center py-8 text-gray-400">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p>Loading status...</p>
            </div>
          ) : isCheckedOut ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <div className="text-green-600 font-bold text-xl mb-2">Day Complete ✓</div>
              <div className="text-gray-500">
                <span className="font-semibold text-gray-700">{attendance?.workHours?.toFixed(1)}h</span> worked today
              </div>
            </div>
          ) : (
            <button
              onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
              disabled={checkInMutation.isPending || checkOutMutation.isPending || !location}
              className={`
                w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3
                transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                shadow-lg
                ${isCheckedIn 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-200' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-200'
                }
              `}
            >
              <MapPin className="w-6 h-6" />
              {checkInMutation.isPending || checkOutMutation.isPending 
                ? 'Processing...' 
                : isCheckedIn 
                  ? 'CHECK OUT' 
                  : 'CHECK IN'
              }
            </button>
          )}
        </div>

        {/* Upcoming Trips - Modern Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg">Upcoming Trips</h2>
            </div>
            <Link to="/hrms/trips" className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingTrips ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400">Loading trips...</p>
            </div>
          ) : upcomingTrips.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-1">No upcoming trips assigned</p>
              <p className="text-gray-400 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTrips.slice(0, 3).map((trip) => (
                <div
                  key={trip.id}
                  className="border-2 border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bold text-gray-900 mb-1">
                        Trip #{trip.tripId.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </div>
                    </div>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-bold
                      ${trip.role === 'guide' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'}
                    `}>
                      {ROLE_DISPLAY[trip.role] || trip.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      Team assigned
                    </span>
                    <span className={`
                      font-semibold
                      ${trip.status === 'confirmed' ? 'text-green-600' : 'text-amber-600'}
                    `}>
                      {trip.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Month Stats - Premium Grid */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2 text-lg">
            <span className="text-2xl">📊</span>
            This Month
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-5 text-center border-2 border-green-100">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/30 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <div className="text-3xl font-black text-green-600 mb-1">{monthStats.present}</div>
                <div className="text-xs font-semibold text-green-700/70 uppercase tracking-wide">Present</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 text-center border-2 border-blue-100">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/30 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <div className="text-3xl font-black text-blue-600 mb-1">{monthStats.onTrip}</div>
                <div className="text-xs font-semibold text-blue-700/70 uppercase tracking-wide">On Trip</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center border-2 border-amber-100">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/30 rounded-full -mr-8 -mt-8"></div>
              <div className="relative">
                <div className="text-3xl font-black text-amber-600 mb-1">{monthStats.leave}</div>
                <div className="text-xs font-semibold text-amber-700/70 uppercase tracking-wide">Leave</div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balance - Modern Design */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <h2 className="font-bold text-gray-900 text-lg">Leave Balance</h2>
            </div>
            <Link to="/hrms/leaves" className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700 transition-colors">
              Apply <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loadingBalance ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : leaveBalances.length === 0 ? (
            <div className="text-center py-6 text-gray-400">No leave data</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {leaveBalances.slice(0, 3).map((balance) => (
                <div key={balance.leaveType} className="text-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                  <div className="text-2xl font-black text-gray-800 mb-1">{balance.remaining}</div>
                  <div className="text-xs font-semibold text-gray-600 capitalize leading-tight">
                    {balance.leaveType.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions - Modern Grid */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/hrms/leaves/apply"
            className="bg-white rounded-2xl p-5 text-center shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200">
              <span className="text-2xl">📝</span>
            </div>
            <div className="text-xs font-bold text-gray-700">Apply Leave</div>
          </Link>
          <Link
            to="/hrms/payroll"
            className="bg-white rounded-2xl p-5 text-center shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
              <span className="text-2xl">💵</span>
            </div>
            <div className="text-xs font-bold text-gray-700">Payslips</div>
          </Link>
          <Link
            to="/hrms/attendance"
            className="bg-white rounded-2xl p-5 text-center shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 border border-gray-100"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-200">
              <span className="text-2xl">📅</span>
            </div>
            <div className="text-xs font-bold text-gray-700">Attendance</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
