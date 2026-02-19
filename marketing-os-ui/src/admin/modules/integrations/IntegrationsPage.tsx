import { Alert, Card, Space, Table, Tag, Typography, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminIntegrations } from '../../hooks/useAdminQueries';
import type { IntegrationMonitorItem } from '../../types';

const { Text } = Typography;

const healthColorMap: Record<IntegrationMonitorItem['health'], string> = {
  healthy: 'green',
  degraded: 'gold',
  down: 'red',
};

const tokenStatusColorMap: Record<IntegrationMonitorItem['tokenStatus'], string> = {
  valid: 'green',
  expiring: 'orange',
  expired: 'red',
};

export default function IntegrationsPage() {
  const integrationsQuery = useAdminIntegrations();

  const columns: TableProps<IntegrationMonitorItem>['columns'] = [
    {
      title: 'Integration',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Connected Tenants',
      dataIndex: 'connectedTenants',
      key: 'connectedTenants',
    },
    {
      title: 'Token Status',
      dataIndex: 'tokenStatus',
      key: 'tokenStatus',
      render: (value: IntegrationMonitorItem['tokenStatus']) => (
        <Tag color={tokenStatusColorMap[value]}>{value.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Health',
      dataIndex: 'health',
      key: 'health',
      render: (value: IntegrationMonitorItem['health']) => (
        <Tag color={healthColorMap[value]}>{value.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Error Alerts (24h)',
      dataIndex: 'errorCount24h',
      key: 'errorCount24h',
      render: (value) => (value ? <Tag color="red">{value}</Tag> : <Tag color="green">0</Tag>),
    },
    {
      title: 'Last Checked',
      dataIndex: 'lastCheckedAt',
      key: 'lastCheckedAt',
      render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
    },
  ];

  const highPriorityAlerts = (integrationsQuery.data ?? []).filter(
    (integration) => integration.health !== 'healthy' || integration.errorCount24h > 0,
  );

  return (
    <div>
      <PageHeader
        title="Integrations"
        subtitle="Monitor third-party service connectivity, token health, and incident hotspots."
      />

      <AsyncState
        loading={integrationsQuery.isLoading}
        error={integrationsQuery.error as Error | null}
        onRetry={() => integrationsQuery.refetch()}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {highPriorityAlerts.map((integration) => (
            <Alert
              key={integration.id}
              type={integration.health === 'down' ? 'error' : 'warning'}
              showIcon
              message={`${integration.name} requires attention`}
              description={`${integration.errorCount24h} recent errors and token status ${integration.tokenStatus}.`}
            />
          ))}

          <Card style={{ borderRadius: 14 }}>
            <Table<IntegrationMonitorItem>
              rowKey="id"
              columns={columns}
              dataSource={integrationsQuery.data ?? []}
              pagination={false}
              scroll={{ x: 920 }}
            />
          </Card>

          {!highPriorityAlerts.length ? (
            <Card>
              <Text type="secondary">All integrations are healthy. No error alerts at this time.</Text>
            </Card>
          ) : null}
        </Space>
      </AsyncState>
    </div>
  );
}
