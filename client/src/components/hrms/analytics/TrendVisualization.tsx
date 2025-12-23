// components/hrms/analytics/TrendVisualization.tsx
// Advanced trend visualization with comparison and analysis

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMetricTrends, useMetricByCode } from '../../../hooks/hrms/useAnalytics';

export interface TrendVisualizationProps {
  metricCode: string;
  trendType: 'MOM' | 'QOQ' | 'YOY';
  height?: number;
}

export function TrendVisualization({
  metricCode,
  trendType,
  height = 200,
}: TrendVisualizationProps) {
  // First get the metric ID from the code
  const { data: metric } = useMetricByCode(metricCode);
  const { data: trends, isLoading } = useMetricTrends(metric?.id || '', trendType);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">No trend data available</p>
      </div>
    );
  }

  // Extract values from trend data
  const trend = trends.find((t) => t.trendType === trendType) || trends[0];
  const dataPoints = trend?.dataPoints || [];

  if (dataPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">No data points available</p>
      </div>
    );
  }

  const values = dataPoints.map((d) => d.value);
  const currentValue = values[values.length - 1] || 0;
  const previousValue = values[values.length - 2] || values[0] || 0;
  const percentChange =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Calculate trend direction
  const trendDirection: 'up' | 'down' | 'flat' =
    percentChange > 1 ? 'up' : percentChange < -1 ? 'down' : 'flat';

  // Chart dimensions
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const chartWidth = 500 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const points = dataPoints.map((d, i) => ({
    x: padding.left + (i / (dataPoints.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    value: d.value,
    label: d.date || '',
  }));

  // Create path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  // Grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (i / 4) * chartHeight;
    const value = maxValue - (i / 4) * range;
    return { y, value };
  });

  // Colors based on trend
  const trendColor =
    trendDirection === 'up' ? '#10B981' : trendDirection === 'down' ? '#EF4444' : '#6B7280';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Current</p>
          <p className="text-lg font-bold text-gray-900">{currentValue.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Change</p>
          <p
            className={`text-lg font-bold flex items-center justify-center gap-1 ${
              trendDirection === 'up'
                ? 'text-green-600'
                : trendDirection === 'down'
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            {trendDirection === 'up' && <TrendingUp className="w-4 h-4" />}
            {trendDirection === 'down' && <TrendingDown className="w-4 h-4" />}
            {trendDirection === 'flat' && <Minus className="w-4 h-4" />}
            {percentChange.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Average</p>
          <p className="text-lg font-bold text-gray-900">{average.toFixed(0)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Period</p>
          <p className="text-lg font-bold text-gray-900">{trendType}</p>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 500 ${height}`} className="w-full" style={{ height }}>
        {/* Grid */}
        {gridLines.map((line, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={line.y}
              x2={padding.left + chartWidth}
              y2={line.y}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={line.y + 4}
              textAnchor="end"
              className="text-xs fill-gray-400"
              fontSize="10"
            >
              {line.value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Area */}
        <path d={areaPath} fill={trendColor} fillOpacity={0.1} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={trendColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill="white"
              stroke={trendColor}
              strokeWidth={2}
            />
            {/* Tooltip on hover would be added here in production */}
          </g>
        ))}

        {/* X-axis labels */}
        {points
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0)
          .map((point, i) => (
            <text
              key={i}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-gray-400"
              fontSize="10"
            >
              {String(point.label).slice(0, 10)}
            </text>
          ))}
      </svg>
    </div>
  );
}
