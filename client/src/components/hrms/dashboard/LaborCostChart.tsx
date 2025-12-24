/**
 * Labor Cost vs Revenue Chart
 * Visual comparison of labor costs against revenue over time
 */
import { TrendingUp } from 'lucide-react';

interface DataPoint {
  month: string;
  shortMonth: string;
  revenue: number;
  laborCost: number;
}

interface LaborCostChartProps {
  period: 'monthly' | 'quarterly' | 'yearly';
}

export function LaborCostChart({ period: _period }: LaborCostChartProps) {
  // Mock data for demonstration
  const monthlyData: DataPoint[] = [
    { month: 'July', shortMonth: 'Jul', revenue: 1500000, laborCost: 350000 },
    { month: 'August', shortMonth: 'Aug', revenue: 1800000, laborCost: 380000 },
    { month: 'September', shortMonth: 'Sep', revenue: 2200000, laborCost: 400000 },
    { month: 'October', shortMonth: 'Oct', revenue: 1900000, laborCost: 390000 },
    { month: 'November', shortMonth: 'Nov', revenue: 2100000, laborCost: 410000 },
    { month: 'December', shortMonth: 'Dec', revenue: 2500000, laborCost: 420000 },
  ];

  // Could use _period to filter data in the future
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  // Calculate Labor Cost Ratio
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalLaborCost = monthlyData.reduce((sum, d) => sum + d.laborCost, 0);
  const laborCostRatio = ((totalLaborCost / totalRevenue) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800">Labor Cost vs Revenue</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-dashed border-purple-300" />
            <span className="text-gray-600">Labor Cost</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
          <span>₹25L</span>
          <span>₹20L</span>
          <span>₹15L</span>
          <span>₹10L</span>
          <span>₹5L</span>
          <span>₹0</span>
        </div>

        {/* Chart area */}
        <div className="ml-14 h-full flex items-end justify-between gap-2 pb-8 border-l border-b border-gray-200">
          {monthlyData.map((data) => (
            <div key={data.month} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Bars */}
              <div className="relative w-full flex justify-center gap-1" style={{ height: '200px' }}>
                {/* Revenue bar */}
                <div
                  className="w-5 bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 relative group/bar"
                  style={{ 
                    height: `${(data.revenue / 2500000) * 100}%`,
                    minHeight: '4px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-10">
                    {formatCurrency(data.revenue)}
                  </div>
                </div>
                
                {/* Labor cost bar */}
                <div
                  className="w-5 bg-purple-400 rounded-t transition-all duration-300 hover:bg-purple-500 relative group/bar"
                  style={{ 
                    height: `${(data.laborCost / 2500000) * 100}%`,
                    minHeight: '4px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-10">
                    {formatCurrency(data.laborCost)}
                  </div>
                </div>
              </div>
              
              {/* X-axis label */}
              <span className="text-xs text-gray-500 mt-2">{data.shortMonth}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(totalRevenue)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Total Labor Cost</div>
          <div className="text-lg font-bold text-gray-800">
            {formatCurrency(totalLaborCost)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Labor Cost Ratio</div>
          <div className="text-lg font-bold text-green-600">
            {laborCostRatio}%
          </div>
        </div>
      </div>
    </div>
  );
}
