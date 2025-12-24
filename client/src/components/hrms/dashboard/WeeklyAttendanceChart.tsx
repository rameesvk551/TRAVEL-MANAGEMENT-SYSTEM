/**
 * Weekly Attendance Chart
 * Visual bar chart showing attendance for the current week
 */
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useTeamAttendance } from '@/hooks/hrms';

interface DayData {
  day: string;
  shortDay: string;
  date: string;
  percentage: number;
  present: number;
  total: number;
}

export function WeeklyAttendanceChart() {
  const [weekData, setWeekData] = useState<DayData[]>([]);

  // Get dates for current week (Mon-Fri)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  
  // Fetch attendance for each day
  const { data: monData } = useTeamAttendance(weekDates[0]);
  const { data: tueData } = useTeamAttendance(weekDates[1]);
  const { data: wedData } = useTeamAttendance(weekDates[2]);
  const { data: thuData } = useTeamAttendance(weekDates[3]);
  const { data: friData } = useTeamAttendance(weekDates[4]);

  useEffect(() => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const allData = [monData, tueData, wedData, thuData, friData];
    
    const newWeekData = weekDates.map((date, index) => {
      const data = allData[index]?.data || [];
      const total = data.length || 50; // Default to 50 if no data
      const present = data.filter(a => 
        a.status === 'present' || a.status === 'on_trip' || a.status === 'remote'
      ).length;
      
      return {
        day: dayNames[index],
        shortDay: shortNames[index],
        date,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        total,
      };
    });
    
    setWeekData(newWeekData);
  }, [monData, tueData, wedData, thuData, friData]);

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-green-400';
    if (percentage >= 70) return 'bg-yellow-400';
    if (percentage >= 60) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h2 className="font-semibold text-gray-800">Attendance This Week</h2>
      </div>

      <div className="space-y-4">
        {weekData.map((day) => (
          <div key={day.day} className="flex items-center gap-4">
            <div className="w-12 text-sm text-gray-500 font-medium">
              {day.shortDay}
            </div>
            <div className="flex-1">
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getBarColor(day.percentage)}`}
                  style={{ width: `${day.percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-end pr-3">
                  <span className="text-sm font-medium text-gray-600">
                    {day.percentage}%
                  </span>
                </div>
              </div>
            </div>
            <div className="w-16 text-right text-sm text-gray-400">
              {day.present}/{day.total}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>90%+</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span>70-89%</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span>&lt;70%</span>
        </div>
      </div>
    </div>
  );
}
