import { Input, Select, Space, Table, Tag, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminAuditLogs } from '../../hooks/useAdminQueries';
import type { AuditLog } from '../../types';

const categoryColorMap: Record<AuditLog['category'], string> = {
  admin_action: 'magenta',
  tenant_update: 'blue',
  permission_change: 'orange',
  settings_update: 'cyan',
};

export default function AuditLogsPage() {
  const [category, setCategory] = useState<AuditLog['category'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const logsQuery = useAdminAuditLogs({ page, pageSize, category, search });

  const columns: TableProps<AuditLog>['columns'] = [
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (value: AuditLog['category']) => (
        <Tag color={categoryColorMap[value]}>{value.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
      render: (value) => value || '-',
    },
    {
      title: 'Timestamp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Track administrative actions, permission changes, and tenant-level updates."
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search actor, action, or tenant"
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              style={{ width: 280 }}
            />
            <Select
              value={category}
              style={{ width: 200 }}
              options={[
                { value: 'all', label: 'All categories' },
                { value: 'admin_action', label: 'Admin Actions' },
                { value: 'tenant_update', label: 'Tenant Updates' },
                { value: 'permission_change', label: 'Permission Changes' },
                { value: 'settings_update', label: 'Settings Updates' },
              ]}
              onChange={(value) => {
                setPage(1);
                setCategory(value);
              }}
            />
          </Space>
        }
      />

      <AsyncState
        loading={logsQuery.isLoading}
        error={logsQuery.error as Error | null}
        onRetry={() => logsQuery.refetch()}
      >
        <Table<AuditLog>
          rowKey="id"
          columns={columns}
          dataSource={logsQuery.data?.items ?? []}
          pagination={{
            current: page,
            pageSize,
            total: logsQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              if (nextPageSize !== pageSize) {
                setPageSize(nextPageSize);
              }
            },
          }}
          scroll={{ x: 980 }}
        />
      </AsyncState>
    </div>
  );
}
