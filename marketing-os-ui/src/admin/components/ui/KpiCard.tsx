import { Card, Statistic, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Text } = Typography;

interface KpiCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  trend?: string;
  icon?: ReactNode;
}

export const KpiCard = ({ icon, prefix, suffix, title, trend, value }: KpiCardProps) => (
  <Card
    style={{
      borderRadius: 14,
      height: '100%',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
      <div style={{ fontSize: 20, opacity: 0.75 }}>{icon}</div>
    </div>
    {trend ? (
      <Text type="secondary" style={{ fontSize: 12 }}>
        {trend}
      </Text>
    ) : null}
  </Card>
);
