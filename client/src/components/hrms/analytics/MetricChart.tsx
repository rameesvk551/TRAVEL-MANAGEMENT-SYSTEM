// components/hrms/analytics/MetricChart.tsx
// Reusable chart component for metrics visualization

import { useMetricSnapshots } from '../../../hooks/hrms/useAnalytics';

export interface MetricChartProps {
  metricCode: string;
  chartType: 'bar' | 'pie' | 'gauge' | 'line' | 'area';
  breakdown?: string;
  height?: number;
  color?: string;
}

export function MetricChart({
  metricCode,
  chartType,
  breakdown: _breakdown,
  height = 200,
  color = '#3B82F6',
}: MetricChartProps) {
  const { data: snapshots, isLoading } = useMetricSnapshots({ metricCode });

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

  if (!snapshots || snapshots.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  // Extract data for visualization
  const values = snapshots.map((s) => s.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 500 - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate positions
  const points = snapshots.map((d, i) => ({
    x: padding.left + (i / (snapshots.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
    value: d.value,
    label: d.snapshotDate || '',
  }));

  // Grid lines
  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (i / 4) * chartHeight;
    const value = maxValue - (i / 4) * range;
    return { y, value };
  });

  // Bar width
  const barWidth = Math.max(10, chartWidth / snapshots.length - 4);

  // Render pie chart
  if (chartType === 'pie') {
    const total = values.reduce((a, b) => a + b, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    let startAngle = 0;

    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <svg viewBox="0 0 200 200" width={height} height={height}>
          {snapshots.map((d, i) => {
            const percent = d.value / total;
            const angle = percent * 360;
            const endAngle = startAngle + angle;
            const largeArc = angle > 180 ? 1 : 0;
            
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const x1 = 100 + 80 * Math.cos(startRad);
            const y1 = 100 + 80 * Math.sin(startRad);
            const x2 = 100 + 80 * Math.cos(endRad);
            const y2 = 100 + 80 * Math.sin(endRad);
            
            const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
            startAngle = endAngle;
            
            return (
              <path key={i} d={path} fill={colors[i % colors.length]} />
            );
          })}
        </svg>
      </div>
    );
  }

  // Render gauge chart
  if (chartType === 'gauge') {
    const value = values[values.length - 1] || 0;
    const percent = Math.min(100, Math.max(0, value));
    const angle = (percent / 100) * 180 - 90;
    
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <svg viewBox="0 0 200 120" width="200" height="120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M 20 100 A 80 80 0 ${percent > 50 ? 1 : 0} 1 ${100 + 80 * Math.cos((angle * Math.PI) / 180)} ${100 + 80 * Math.sin((angle * Math.PI) / 180)}`}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
          />
          <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold" fill="#111827">
            {percent.toFixed(0)}%
          </text>
        </svg>
      </div>
    );
  }

  // Line/area path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
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

      {/* Area fill */}
      {chartType === 'area' && (
        <path d={areaPath} fill={color} fillOpacity={0.1} />
      )}

      {/* Line */}
      {(chartType === 'line' || chartType === 'area') && (
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Bars */}
      {chartType === 'bar' &&
        points.map((point, i) => (
          <rect
            key={i}
            x={point.x - barWidth / 2}
            y={point.y}
            width={barWidth}
            height={padding.top + chartHeight - point.y}
            fill={color}
            rx={2}
          />
        ))}

      {/* Data points for line/area */}
      {(chartType === 'line' || chartType === 'area') &&
        points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="white"
            stroke={color}
            strokeWidth={2}
          />
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
  );
}
