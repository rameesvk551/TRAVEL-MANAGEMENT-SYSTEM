import { HistoryOutlined } from '@ant-design/icons';
import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Timeline,
  Typography,
  type TableProps,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminUserActivity, useAdminUsers } from '../../hooks/useAdminQueries';
import type { User } from '../../types';

const { Text } = Typography;

const statusColorMap: Record<User['status'], string> = {
  active: 'green',
  disabled: 'red',
  invited: 'gold',
};

const roleColorMap: Record<User['role'], string> = {
  super_admin: 'magenta',
  tenant_admin: 'blue',
  manager: 'cyan',
  analyst: 'processing',
  member: 'default',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<User['status'] | 'all'>('all');
  const [role, setRole] = useState<User['role'] | 'all'>('all');
  const [tenantId, setTenantId] = useState<string | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activityUserId, setActivityUserId] = useState<string | null>(null);

  const usersQuery = useAdminUsers({
    page,
    pageSize,
    role,
    search,
    status,
    tenantId,
  });

  const userActivityQuery = useAdminUserActivity(activityUserId);

  const tenantOptions = useMemo(() => {
    const unique = new Map<string, string>();

    (usersQuery.data?.items ?? []).forEach((user) => {
      unique.set(user.tenantId, user.tenantName);
    });

    const values = Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
    values.sort((first, second) => first.label.localeCompare(second.label));

    return [{ value: 'all', label: 'All tenants' }, ...values];
  }, [usersQuery.data]);

  const columns: TableProps<User>['columns'] = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (_, user) => (
        <Space direction="vertical" size={0}>
          <Text strong>{user.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (roleValue: User['role']) => (
        <Tag color={roleColorMap[roleValue]}>{roleValue.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (statusValue: User['status']) => (
        <Tag color={statusColorMap[statusValue]}>{statusValue.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, user) => (
        <Button icon={<HistoryOutlined />} size="small" onClick={() => setActivityUserId(user.id)}>
          Activity history
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Global user directory across all tenants with role and status governance."
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search name, email, tenant"
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              style={{ width: 280 }}
            />
            <Select
              value={role}
              style={{ width: 170 }}
              options={[
                { value: 'all', label: 'All roles' },
                { value: 'super_admin', label: 'Super Admin' },
                { value: 'tenant_admin', label: 'Tenant Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'analyst', label: 'Analyst' },
                { value: 'member', label: 'Member' },
              ]}
              onChange={(value) => {
                setPage(1);
                setRole(value);
              }}
            />
            <Select
              value={status}
              style={{ width: 150 }}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'active', label: 'Active' },
                { value: 'invited', label: 'Invited' },
                { value: 'disabled', label: 'Disabled' },
              ]}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
            />
            <Select
              value={tenantId}
              style={{ width: 190 }}
              options={tenantOptions}
              onChange={(value) => {
                setPage(1);
                setTenantId(value);
              }}
            />
          </Space>
        }
      />

      <AsyncState
        loading={usersQuery.isLoading}
        error={usersQuery.error as Error | null}
        onRetry={() => usersQuery.refetch()}
      >
        <Table<User>
          rowKey="id"
          columns={columns}
          dataSource={usersQuery.data?.items ?? []}
          pagination={{
            current: page,
            pageSize,
            total: usersQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          scroll={{ x: 1040 }}
        />
      </AsyncState>

      <Modal
        open={Boolean(activityUserId)}
        title="User Activity History"
        onCancel={() => setActivityUserId(null)}
        footer={null}
      >
        <AsyncState
          loading={userActivityQuery.isLoading}
          error={userActivityQuery.error as Error | null}
          isEmpty={(userActivityQuery.data?.length ?? 0) === 0}
          emptyDescription="No activity records found for this user."
        >
          <Timeline
            items={(userActivityQuery.data ?? []).map((activity) => ({
              color: 'blue',
              children: (
                <Space direction="vertical" size={0}>
                  <Text strong>{activity.action}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activity.resource}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(activity.timestamp).format('MMM D, YYYY h:mm A')} - {activity.ipAddress}
                  </Text>
                </Space>
              ),
            }))}
          />
        </AsyncState>
      </Modal>
    </div>
  );
}
