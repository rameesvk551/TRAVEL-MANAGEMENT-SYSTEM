import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  Row,
  Space,
  Switch,
  Table,
  Typography,
  message,
  type TableProps,
} from 'antd';
import { useMemo, useState } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAdminFeatureManagement,
  useFeatureFlagMutation,
  usePlanFeatureMutation,
  usePlanLimitMutation,
} from '../../hooks/useAdminQueries';
import type { FeatureFlag, PlanFeatureConfig } from '../../types';

const { Text, Title } = Typography;

type LimitField = 'users' | 'messagesPerMonth' | 'storageGb';

export default function FeatureManagementPage() {
  const featureQuery = useAdminFeatureManagement();
  const planFeatureMutation = usePlanFeatureMutation();
  const planLimitMutation = usePlanLimitMutation();
  const featureFlagMutation = useFeatureFlagMutation();
  const [draftRollout, setDraftRollout] = useState<Record<string, number>>({});

  const featureFlagColumns: TableProps<FeatureFlag>['columns'] = useMemo(
    () => [
      {
        title: 'Flag Key',
        dataIndex: 'key',
        key: 'key',
        render: (value) => <Text code>{value}</Text>,
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Enabled',
        dataIndex: 'enabled',
        key: 'enabled',
        render: (enabled, flag) => (
          <Switch
            checked={enabled}
            onChange={(checked) => {
              const rolloutValue = draftRollout[flag.id] ?? flag.rolloutPercentage;
              featureFlagMutation.mutate(
                {
                  flagId: flag.id,
                  enabled: checked,
                  rolloutPercentage: rolloutValue,
                },
                {
                  onSuccess: () => message.success(`Updated ${flag.key}`),
                  onError: () => message.error(`Failed to update ${flag.key}`),
                },
              );
            }}
          />
        ),
      },
      {
        title: 'Rollout %',
        dataIndex: 'rolloutPercentage',
        key: 'rolloutPercentage',
        render: (rolloutPercentage, flag) => {
          const localValue = draftRollout[flag.id] ?? rolloutPercentage;
          return (
            <Space>
              <InputNumber
                min={0}
                max={100}
                value={localValue}
                onChange={(value) => {
                  const safeValue = value ?? 0;
                  setDraftRollout((previous) => ({
                    ...previous,
                    [flag.id]: safeValue,
                  }));
                }}
              />
              <Button
                icon={<CheckOutlined />}
                onClick={() => {
                  featureFlagMutation.mutate(
                    {
                      flagId: flag.id,
                      enabled: flag.enabled,
                      rolloutPercentage: localValue,
                    },
                    {
                      onSuccess: () => message.success(`Rollout updated for ${flag.key}`),
                      onError: () => message.error(`Failed to update rollout for ${flag.key}`),
                    },
                  );
                }}
              >
                Save
              </Button>
            </Space>
          );
        },
      },
    ],
    [draftRollout, featureFlagMutation],
  );

  const updatePlanLimit = (planId: string, field: LimitField, value: number) => {
    planLimitMutation.mutate(
      { field, planId, value },
      {
        onSuccess: () => message.success('Plan limit updated'),
        onError: () => message.error('Failed to update plan limit'),
      },
    );
  };

  const renderPlanConfigCard = (planConfig: PlanFeatureConfig) => (
    <Card
      key={planConfig.planId}
      style={{ borderRadius: 14, height: '100%' }}
      title={
        <Space>
          <Title level={5} style={{ marginBottom: 0 }}>
            {planConfig.planName}
          </Title>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size={14}>
        <div>
          <Text strong>Feature Access</Text>
          <div style={{ marginTop: 10 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
              {Object.entries(planConfig.features).map(([featureKey, enabled]) => (
                <Space key={featureKey} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Text>{featureKey}</Text>
                  <Switch
                    checked={enabled}
                    onChange={(checked) => {
                      planFeatureMutation.mutate(
                        {
                          planId: planConfig.planId,
                          featureKey,
                          enabled: checked,
                        },
                        {
                          onSuccess: () => message.success('Feature access updated'),
                          onError: () => message.error('Failed to update feature access'),
                        },
                      );
                    }}
                  />
                </Space>
              ))}
            </Space>
          </div>
        </div>

        <Divider style={{ margin: 0 }} />

        <div>
          <Text strong>Plan Limits</Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: 10 }} size={8}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>Users</Text>
              <InputNumber
                min={1}
                value={planConfig.limits.users}
                onChange={(value) => updatePlanLimit(planConfig.planId, 'users', value ?? 1)}
              />
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>Messages / month</Text>
              <InputNumber
                min={100}
                step={100}
                value={planConfig.limits.messagesPerMonth}
                onChange={(value) => updatePlanLimit(planConfig.planId, 'messagesPerMonth', value ?? 100)}
              />
            </Space>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text>Storage (GB)</Text>
              <InputNumber
                min={1}
                value={planConfig.limits.storageGb}
                onChange={(value) => updatePlanLimit(planConfig.planId, 'storageGb', value ?? 1)}
              />
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Feature Management"
        subtitle="Control feature access, per-plan usage limits, and platform-wide feature flags."
      />

      <AsyncState
        loading={featureQuery.isLoading}
        error={featureQuery.error as Error | null}
        onRetry={() => featureQuery.refetch()}
      >
        {featureQuery.data ? (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Card
              title={
                <Space>
                  <EditOutlined />
                  Plan Feature Matrix
                </Space>
              }
              style={{ borderRadius: 14 }}
            >
              <Row gutter={[16, 16]}>
                {featureQuery.data.planConfigs.map((planConfig) => (
                  <Col xs={24} lg={12} key={planConfig.planId}>
                    {renderPlanConfigCard(planConfig)}
                  </Col>
                ))}
              </Row>
            </Card>

            <Card title="Feature Flags" style={{ borderRadius: 14 }}>
              <Table<FeatureFlag>
                rowKey="id"
                columns={featureFlagColumns}
                dataSource={featureQuery.data.featureFlags}
                pagination={false}
                scroll={{ x: 960 }}
              />
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </div>
  );
}
