/**
 * Founder/Executive Dashboard
 * High-level people insights and cost intelligence
 * Following architecture spec section 8.3
 */
import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Briefcase,
  BarChart3,
  ChevronDown,
  Download,
} from 'lucide-react';
import { 
  TopInsightsPanel,
  LaborCostChart,
  HeadcountByTypeChart,
} from '@/components/hrms';

interface ExecutiveKPI {
  title: string;
  value: string | number;
  unit?: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

export default function FounderDashboard() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  const currentMonth = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Executive KPIs
  const kpis: ExecutiveKPI[] = [
    {
      title: 'Labor Cost',
      value: '₹4.2L',
      change: 8,
      changeLabel: 'vs Nov',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Cost/Trip',
      value: '₹12,400',
      change: -5,
      changeLabel: 'vs Nov',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Utilization',
      value: '78%',
      change: 12,
      changeLabel: 'vs Nov',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Attrition',
      value: '2.1%',
      change: -1.1,
      changeLabel: 'from 3.2%',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              People Insights
            </h1>
            <p className="text-sm text-gray-500 mt-1">{currentMonth}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as typeof period)}
                className="appearance-none bg-white border rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.title} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{kpi.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    kpi.change >= 0 
                      ? (kpi.title === 'Attrition' ? 'text-green-600' : 'text-green-600') 
                      : (kpi.title === 'Attrition' ? 'text-green-600' : 'text-red-600')
                  }`}>
                    {kpi.change >= 0 ? (
                      kpi.title === 'Attrition' ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )
                    ) : (
                      kpi.title === 'Cost/Trip' ? (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )
                    )}
                    <span className={kpi.title === 'Cost/Trip' && kpi.change < 0 ? 'text-green-600' : ''}>
                      {kpi.change >= 0 ? '+' : ''}{kpi.change}% {kpi.changeLabel}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Labor Cost vs Revenue Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <LaborCostChart period={period} />
          </div>
          
          {/* Headcount by Type - Takes 1 column */}
          <div>
            <HeadcountByTypeChart />
          </div>
        </div>

        {/* Top Insights */}
        <TopInsightsPanel />

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Top Performers</h3>
            <div className="space-y-3">
              {['Rajesh Kumar', 'Priya Singh', 'Amit Patel'].map((name, i) => (
                <div key={name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{name}</div>
                    <div className="text-xs text-gray-500">{12 - i * 2} trips this month</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Department Costs</h3>
            <div className="space-y-3">
              {[
                { name: 'Operations', cost: '₹2.8L', percentage: 67 },
                { name: 'Support', cost: '₹0.9L', percentage: 21 },
                { name: 'Admin', cost: '₹0.5L', percentage: 12 },
              ].map((dept) => (
                <div key={dept.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{dept.name}</span>
                    <span className="font-medium text-gray-800">{dept.cost}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">48</div>
                <div className="text-xs text-gray-500">Total Staff</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">34</div>
                <div className="text-xs text-gray-500">Trips (MTD)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">2.4</div>
                <div className="text-xs text-gray-500">Avg Tenure (yrs)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">4.2</div>
                <div className="text-xs text-gray-500">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
