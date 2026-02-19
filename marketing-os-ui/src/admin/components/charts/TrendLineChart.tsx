import { Card, Empty } from 'antd';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeSeriesPoint } from '../../types';

interface TrendLineChartProps {
  title: string;
  color: string;
  data: TimeSeriesPoint[];
}

export const TrendLineChart = ({ color, data, title }: TrendLineChartProps) => {
  if (!data.length) {
    return (
      <Card title={title} style={{ borderRadius: 14, height: '100%' }}>
        <Empty description="No trend data" />
      </Card>
    );
  }

  return (
    <Card title={title} style={{ borderRadius: 14, height: '100%' }}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: 0, right: 18, top: 8, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
