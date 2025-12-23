// pages/hrms/HRAnalyticsPage.tsx
// HR Analytics Dashboard Page

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  HRAnalyticsDashboard,
  MetricChart,
  TrendVisualization,
} from '../../components/hrms/analytics';

type Tab = 'overview' | 'workforce' | 'performance' | 'compensation';

export function HRAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState('this_year');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'workforce', label: 'Workforce', icon: <Users className="h-4 w-4" /> },
    { id: 'performance', label: 'Performance', icon: <Target className="h-4 w-4" /> },
    { id: 'compensation', label: 'Compensation', icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-blue-600" />
            HR Analytics
          </h1>
          <p className="mt-1 text-gray-500">
            Insights and metrics across your workforce
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="this_month">This Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Headcount</p>
              <p className="text-2xl font-bold mt-1">156</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +5.2% vs last month
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Turnover Rate</p>
              <p className="text-2xl font-bold mt-1">8.4%</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> -2.1% vs last year
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Avg Performance</p>
              <p className="text-2xl font-bold mt-1">4.2</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +0.3 vs last cycle
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Labor Cost</p>
              <p className="text-2xl font-bold mt-1">1.2B</p>
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +8.5% YoY
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <HRAnalyticsDashboard />}

      {activeTab === 'workforce' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Headcount by Department</h3>
            <MetricChart
              metricCode="HEADCOUNT"
              chartType="bar"
              breakdown="department"
            />
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Gender Distribution</h3>
            <MetricChart
              metricCode="GENDER_RATIO"
              chartType="pie"
            />
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Tenure Distribution</h3>
            <MetricChart
              metricCode="AVG_TENURE"
              chartType="bar"
              breakdown="tenure_band"
            />
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Headcount Trend</h3>
            <TrendVisualization
              metricCode="HEADCOUNT"
              trendType="MOM"
            />
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Performance Distribution</h3>
            <MetricChart
              metricCode="AVG_PERF_SCORE"
              chartType="bar"
              breakdown="rating"
            />
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Goal Completion Rate</h3>
            <MetricChart
              metricCode="GOAL_COMPLETION"
              chartType="gauge"
            />
          </div>
          <div className="bg-white rounded-lg border p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Performance Trend</h3>
            <TrendVisualization
              metricCode="AVG_PERF_SCORE"
              trendType="YOY"
            />
          </div>
        </div>
      )}

      {activeTab === 'compensation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Labor Cost by Department</h3>
            <MetricChart
              metricCode="LABOR_COST_PER_EMP"
              chartType="bar"
              breakdown="department"
            />
          </div>
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold mb-4">Cost Breakdown</h3>
            <MetricChart
              metricCode="LABOR_COST_PER_EMP"
              chartType="pie"
              breakdown="cost_type"
            />
          </div>
          <div className="bg-white rounded-lg border p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Labor Cost Trend</h3>
            <TrendVisualization
              metricCode="LABOR_COST_PER_EMP"
              trendType="MOM"
            />
          </div>
        </div>
      )}
    </div>
  );
}
