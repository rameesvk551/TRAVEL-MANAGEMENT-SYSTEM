import {
  CalendarOutlined,
  EyeOutlined,
  MoreOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  type MenuProps,
  type TableProps,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAdminTenant,
  useAdminTenants,
  useTenantImpersonationMutation,
  useTenantPlanMutation,
  useTenantStatusMutation,
  useTenantTrialMutation,
} from '../../hooks/useAdminQueries';
import type { Tenant } from '../../types';

const { Paragraph, Text, Title } = Typography;

interface TrialFormValues {
  trialStartAt?: Dayjs | null;
  trialEndAt: Dayjs;
  reason?: string;
}

const statusColorMap: Record<Tenant['status'], string> = {
  active: 'green',
  inactive: 'default',
  suspended: 'red',
  trial: 'gold',
};

const planOptions: Tenant['plan'][] = ['Starter', 'Growth', 'Scale', 'Enterprise'];

export default function TenantsPage() {
  const { user } = useAuth();
  const [trialForm] = Form.useForm<TrialFormValues>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Tenant['status'] | 'all'>('all');
  const [plan, setPlan] = useState<Tenant['plan'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [trialTenant, setTrialTenant] = useState<Tenant | null>(null);

  const tenantsQuery = useAdminTenants({
    page,
    pageSize,
    plan,
    search,
    status,
  });

  const tenantDetailQuery = useAdminTenant(selectedTenantId);
  const statusMutation = useTenantStatusMutation();
  const planMutation = useTenantPlanMutation();
  const impersonationMutation = useTenantImpersonationMutation();
  const trialMutation = useTenantTrialMutation();

  const openTrialModal = (tenant: Tenant) => {
    setTrialTenant(tenant);
    trialForm.setFieldsValue({
      trialStartAt: dayjs(tenant.createdAt),
      trialEndAt: dayjs(tenant.createdAt).add(30, 'day'),
      reason: '',
    });
  };

  const submitTrialUpdate = async () => {
    if (!trialTenant) {
      return;
    }

    const values = await trialForm.validateFields();
    trialMutation.mutate(
      {
        tenantId: trialTenant.id,
        payload: {
          trialStartAt: values.trialStartAt ? values.trialStartAt.toISOString() : null,
          trialEndAt: values.trialEndAt.toISOString(),
          reason: values.reason?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          message.success(`Trial window updated for ${trialTenant.companyName}`);
          setTrialTenant(null);
          trialForm.resetFields();
        },
        onError: () => {
          message.error('Failed to update tenant trial window');
        },
      },
    );
  };

  const columns: TableProps<Tenant>['columns'] = useMemo(
    () => [
      {
        title: 'Company Name',
        dataIndex: 'companyName',
        key: 'companyName',
        render: (_, tenant) => (
          <Space direction="vertical" size={0}>
            <Text strong>{tenant.companyName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {tenant.ownerEmail}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Plan',
        dataIndex: 'plan',
        key: 'plan',
      },
      {
        title: 'Users Count',
        dataIndex: 'usersCount',
        key: 'usersCount',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (value: Tenant['status']) => <Tag color={statusColorMap[value]}>{value.toUpperCase()}</Tag>,
      },
      {
        title: 'Created Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value) => dayjs(value).format('MMM D, YYYY'),
      },
      {
        title: 'Last Activity',
        dataIndex: 'lastActivity',
        key: 'lastActivity',
        render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        render: (_, tenant) => {
          const planMenuItems: MenuProps['items'] = planOptions.map((planOption) => ({
            key: planOption,
            label: `Change to ${planOption}`,
            disabled: tenant.plan === planOption,
          }));

          return (
            <Space>
              <Button icon={<EyeOutlined />} onClick={() => setSelectedTenantId(tenant.id)} size="small">
                View
              </Button>
              <Button
                icon={<UserSwitchOutlined />}
                size="small"
                onClick={() => {
                  impersonationMutation.mutate(
                    {
                      tenantId: tenant.id,
                      actorName: user?.name,
                    },
                    {
                      onSuccess: (session) => {
                        message.success(
                          `Impersonation ready for ${session.tenantName}. Expires ${dayjs(session.expiresAt).format('h:mm A')}.`,
                        );
                      },
                      onError: () => message.error('Failed to start impersonation'),
                    },
                  );
                }}
                loading={impersonationMutation.isPending}
              >
                Impersonate
              </Button>
              <Button icon={<CalendarOutlined />} size="small" onClick={() => openTrialModal(tenant)}>
                Trial
              </Button>
              <Button
                icon={tenant.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                size="small"
                onClick={() => {
                  statusMutation.mutate(
                    {
                      tenantId: tenant.id,
                      status: tenant.status === 'active' ? 'suspended' : 'active',
                    },
                    {
                      onSuccess: () => message.success(`Tenant status updated for ${tenant.companyName}`),
                      onError: () => message.error('Failed to update tenant status'),
                    },
                  );
                }}
                loading={statusMutation.isPending}
              >
                {tenant.status === 'active' ? 'Suspend' : 'Activate'}
              </Button>
              <Dropdown
                menu={{
                  items: planMenuItems,
                  onClick: ({ key }) => {
                    planMutation.mutate(
                      {
                        tenantId: tenant.id,
                        plan: key as Tenant['plan'],
                      },
                      {
                        onSuccess: () => message.success(`Plan changed for ${tenant.companyName}`),
                        onError: () => message.error('Failed to update plan'),
                      },
                    );
                  },
                }}
                trigger={['click']}
              >
                <Button icon={<MoreOutlined />} size="small" loading={planMutation.isPending}>
                  Change plan
                </Button>
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [planMutation, statusMutation, impersonationMutation, trialMutation, user?.name],
  );

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle="Manage company workspaces, plan lifecycle, activity posture, and impersonation access."
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search company or owner email"
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              style={{ width: 280 }}
            />
            <Select
              value={status}
              style={{ width: 150 }}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'active', label: 'Active' },
                { value: 'trial', label: 'Trial' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <Select
              value={plan}
              style={{ width: 160 }}
              onChange={(value) => {
                setPage(1);
                setPlan(value);
              }}
              options={[
                { value: 'all', label: 'All plans' },
                { value: 'Starter', label: 'Starter' },
                { value: 'Growth', label: 'Growth' },
                { value: 'Scale', label: 'Scale' },
                { value: 'Enterprise', label: 'Enterprise' },
              ]}
            />
          </Space>
        }
      />

      <AsyncState loading={tenantsQuery.isLoading} error={tenantsQuery.error as Error | null} onRetry={() => tenantsQuery.refetch()}>
        <Table<Tenant>
          rowKey="id"
          columns={columns}
          dataSource={tenantsQuery.data?.items ?? []}
          pagination={{
            current: page,
            pageSize,
            total: tenantsQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          scroll={{ x: 1200 }}
        />
      </AsyncState>

      <Drawer title="Tenant Details" width={480} open={Boolean(selectedTenantId)} onClose={() => setSelectedTenantId(null)}>
        <AsyncState
          loading={tenantDetailQuery.isLoading}
          error={tenantDetailQuery.error as Error | null}
          isEmpty={!tenantDetailQuery.data}
          emptyDescription="Select a tenant to inspect details."
        >
          {tenantDetailQuery.data ? (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Title level={4} style={{ marginBottom: 4 }}>
                  {tenantDetailQuery.data.companyName}
                </Title>
                <Tag color={statusColorMap[tenantDetailQuery.data.status]}>{tenantDetailQuery.data.status.toUpperCase()}</Tag>
              </div>

              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Owner:</Text> {tenantDetailQuery.data.ownerEmail}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Plan:</Text> {tenantDetailQuery.data.plan}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Users:</Text> {tenantDetailQuery.data.usersCount}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Region:</Text> {tenantDetailQuery.data.region}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Created:</Text> {dayjs(tenantDetailQuery.data.createdAt).format('MMM D, YYYY h:mm A')}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                <Text type="secondary">Last Activity:</Text> {dayjs(tenantDetailQuery.data.lastActivity).format('MMM D, YYYY h:mm A')}
              </Paragraph>

              <div>
                <Text type="secondary">Feature Flags</Text>
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {tenantDetailQuery.data.featureFlags.length ? (
                      tenantDetailQuery.data.featureFlags.map((flag) => (
                        <Tag key={flag} color="blue">
                          {flag}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">No feature overrides</Text>
                    )}
                  </Space>
                </div>
              </div>
            </Space>
          ) : null}
        </AsyncState>
      </Drawer>

      <Modal
        title={trialTenant ? `Manage Trial - ${trialTenant.companyName}` : 'Manage Trial'}
        open={Boolean(trialTenant)}
        onCancel={() => {
          setTrialTenant(null);
          trialForm.resetFields();
        }}
        onOk={submitTrialUpdate}
        okButtonProps={{ loading: trialMutation.isPending }}
      >
        <Form<TrialFormValues> form={trialForm} layout="vertical">
          <Form.Item label="Trial Start" name="trialStartAt">
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item label="Trial End" name="trialEndAt" rules={[{ required: true, message: 'Trial end date is required' }]}>
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item label="Reason" name="reason">
            <Input.TextArea rows={3} placeholder="Optional audit reason" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
