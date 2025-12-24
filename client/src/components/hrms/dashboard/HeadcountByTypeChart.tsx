/**
 * Headcount by Type Chart
 * Visual breakdown of employee categories
 */
import { Users } from 'lucide-react';

interface HeadcountCategory {
  type: string;
  count: number;
  color: string;
}

export function HeadcountByTypeChart() {
  // Mock data - in real app, comes from employee analytics
  const categories: HeadcountCategory[] = [
    { type: 'Guides', count: 18, color: 'bg-blue-500' },
    { type: 'Drivers', count: 10, color: 'bg-green-500' },
    { type: 'Crew', count: 14, color: 'bg-purple-500' },
    { type: 'Admin', count: 4, color: 'bg-orange-500' },
    { type: 'Management', count: 2, color: 'bg-red-500' },
  ];

  const total = categories.reduce((sum, cat) => sum + cat.count, 0);
  const maxCount = Math.max(...categories.map(c => c.count));

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-purple-500" />
        <h2 className="font-semibold text-gray-800">Headcount by Type</h2>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const percentage = Math.round((category.count / total) * 100);
          const barWidth = (category.count / maxCount) * 100;
          
          return (
            <div key={category.type} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 font-medium">
                  {category.type}
                </span>
                <span className="text-sm text-gray-500">
                  {category.count} ({percentage}%)
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${category.color} flex items-center`}
                  style={{ width: `${barWidth}%` }}
                >
                  {/* Show count inside bar if it's wide enough */}
                  {barWidth > 30 && (
                    <span className="text-white text-xs font-medium ml-3">
                      {category.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Total Headcount</span>
          <span className="text-2xl font-bold text-gray-800">{total}</span>
        </div>
      </div>

      {/* Quick breakdown */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Field Staff</span>
            <span className="font-medium text-gray-700">
              {categories.filter(c => ['Guides', 'Drivers', 'Crew'].includes(c.type))
                .reduce((sum, c) => sum + c.count, 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Office Staff</span>
            <span className="font-medium text-gray-700">
              {categories.filter(c => ['Admin', 'Management'].includes(c.type))
                .reduce((sum, c) => sum + c.count, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
