// components/hrms/analytics/HRAnalyticsDashboard.tsx
// Main HR analytics dashboard with key metrics and visualizations

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  UserPlus,
  UserMinus,
  Target,
  BarChart3,
  Calendar,
  RefreshCw,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, changeLabel, icon, color }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-gray-400 ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function HRAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Mock data for demonstration
  const metrics = {
    totalEmployees: 156,
    newHires: 12,
    terminations: 3,
    openPositions: 8,
    avgTenure: 2.4,
    turnoverRate: 8.5,
    absenteeismRate: 3.2,
    avgSalary: 65000,
    laborCost: 10140000,
    trainingHours: 1240,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">HR Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Key workforce metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded ${
                  dateRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Employees"
          value={metrics.totalEmployees}
          change={5.2}
          changeLabel="vs last month"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <MetricCard
          title="New Hires (MTD)"
          value={metrics.newHires}
          change={33.3}
          changeLabel="vs last month"
          icon={<UserPlus className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        <MetricCard
          title="Turnover Rate"
          value={`${metrics.turnoverRate}%`}
          change={-1.2}
          changeLabel="vs last month"
          icon={<UserMinus className="w-6 h-6 text-red-600" />}
          color="bg-red-50"
        />
        <MetricCard
          title="Labor Cost (MTD)"
          value={`$${(metrics.laborCost / 1000000).toFixed(2)}M`}
          change={2.1}
          changeLabel="vs budget"
          icon={<DollarSign className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Open Positions</p>
              <p className="text-xl font-bold text-gray-900">{metrics.openPositions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Avg Tenure</p>
              <p className="text-xl font-bold text-gray-900">{metrics.avgTenure} yrs</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Absenteeism</p>
              <p className="text-xl font-bold text-gray-900">{metrics.absenteeismRate}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Avg Salary</p>
              <p className="text-xl font-bold text-gray-900">${(metrics.avgSalary / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Training Hours</p>
              <p className="text-xl font-bold text-gray-900">{metrics.trainingHours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Headcount Trend</h3>
            <span className="text-sm text-gray-500">Last {dateRange}</span>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart placeholder - integrate with charting library</p>
          </div>
        </div>

        {/* Turnover Trend */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Turnover Rate Trend</h3>
            <span className="text-sm text-gray-500">Last {dateRange}</span>
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Chart placeholder - integrate with charting library</p>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Headcount */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">Headcount by Department</h3>
          <div className="space-y-3">
            {[
              { name: 'Engineering', count: 52, percent: 33 },
              { name: 'Sales', count: 35, percent: 22 },
              { name: 'Operations', count: 28, percent: 18 },
              { name: 'Marketing', count: 21, percent: 13 },
              { name: 'HR', count: 12, percent: 8 },
              { name: 'Finance', count: 8, percent: 5 },
            ].map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{dept.name}</span>
                  <span className="text-gray-500">{dept.count} ({dept.percent}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${dept.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">Gender Distribution</h3>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="flex gap-8">
                <div>
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    62%
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Male</p>
                </div>
                <div>
                  <div className="w-20 h-20 rounded-full bg-pink-500 flex items-center justify-center text-white text-xl font-bold">
                    38%
                  </div>
                  <p className="mt-2 text-sm text-gray-600">Female</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenure Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">Tenure Distribution</h3>
          <div className="space-y-3">
            {[
              { range: '< 1 year', count: 28, percent: 18 },
              { range: '1-2 years', count: 42, percent: 27 },
              { range: '2-5 years', count: 56, percent: 36 },
              { range: '5-10 years', count: 22, percent: 14 },
              { range: '> 10 years', count: 8, percent: 5 },
            ].map((tenure) => (
              <div key={tenure.range}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{tenure.range}</span>
                  <span className="text-gray-500">{tenure.count} ({tenure.percent}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${tenure.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
