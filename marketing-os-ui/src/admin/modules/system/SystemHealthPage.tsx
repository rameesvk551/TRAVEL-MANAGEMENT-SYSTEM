import { Alert, Card, Col, Progress, Row, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminSystemHealth } from '../../hooks/useAdminQueries';
import type { HealthMetric } from '../../types';

const { Text, Title } = Typography;

const progressColorMap: Record<HealthMetric['health'], string> = {
  healthy: '#52c41a',
  degraded: '#faad14',
  down: '#ff4d4f',
};

const metricProgress = (metric: HealthMetric): number => {
  if (metric.unit === 'uptime') {
    return Math.min(100, Math.round((metric.value / 100) * 100));
  }

  if (metric.unit === 'ms' || metric.unit === 'jobs' || metric.unit === 'count') {
    return Math.max(0, Math.min(100, Math.round((metric.threshold / metric.value) * 100)));
  }

  return Math.min(100, Math.round((metric.value / Math.max(metric.threshold, 1)) * 100));
};

const metricValueLabel = (metric: HealthMetric): string => {
  if (metric.unit === 'uptime') {
    return `${metric.value.toFixed(3)}%`;
  }

  if (metric.unit === '%') {
    return `${metric.value}%`;
  }

  return `${metric.value} ${metric.unit}`;
};

export default function SystemHealthPage() {
  const healthQuery = useAdminSystemHealth();

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Real-time platform runtime posture including latency, queue pressure, errors, and uptime."
      />

      <AsyncState
        loading={healthQuery.isLoading}
        error={healthQuery.error as Error | null}
        onRetry={() => healthQuery.refetch()}
      >
        {healthQuery.data ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Row gutter={[16, 16]}>
              {healthQuery.data.metrics.map((metric) => (
                <Col xs={24} md={12} xl={8} key={metric.key}>
                  <Card style={{ borderRadius: 14, height: '100%' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={10}>
                      <div>
                        <Text type="secondary">{metric.label}</Text>
                        <Title level={4} style={{ marginTop: 6, marginBottom: 0 }}>
                          {metricValueLabel(metric)}
                        </Title>
                      </div>
                      <Progress
                        percent={metricProgress(metric)}
                        size="small"
                        strokeColor={progressColorMap[metric.health]}
                        showInfo={false}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Threshold: {metric.threshold}
                        {metric.unit === 'uptime' ? '%' : ` ${metric.unit}`}
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            <Card title="Alerts" style={{ borderRadius: 14 }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {healthQuery.data.alerts.map((alert) => (
                  <Alert
                    key={alert.id}
                    type={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
                    showIcon
                    message={alert.title}
                    description={`${alert.description} (${dayjs(alert.createdAt).format('MMM D, YYYY h:mm A')})`}
                  />
                ))}
              </Space>
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </div>
  );
}
