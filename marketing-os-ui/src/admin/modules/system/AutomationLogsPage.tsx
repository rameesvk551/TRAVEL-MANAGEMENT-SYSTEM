import { Input, Select, Space, Table, Tag, Typography, type TableProps } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminAutomationLogs } from '../../hooks/useAdminQueries';
import type { AutomationLog } from '../../types';

const { Text } = Typography;

const statusColorMap: Record<AutomationLog['status'], string> = {
  success: 'green',
  failed: 'red',
  running: 'processing',
};

export default function AutomationLogsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AutomationLog['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const logsQuery = useAdminAutomationLogs({ page, pageSize, search, status });

  const columns: TableProps<AutomationLog>['columns'] = [
    {
      title: 'Workflow Name',
      dataIndex: 'workflowName',
      key: 'workflowName',
      render: (value) => <Text strong>{value}</Text>,
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Trigger Source',
      dataIndex: 'triggerSource',
      key: 'triggerSource',
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: AutomationLog['status']) => (
        <Tag color={statusColorMap[value]}>{value.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Execution Duration',
      dataIndex: 'durationMs',
      key: 'durationMs',
      render: (value) => `${value} ms`,
    },
    {
      title: 'Executed At',
      dataIndex: 'executedAt',
      key: 'executedAt',
      render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Automation Logs"
        subtitle="Review workflow executions across tenants and identify failures quickly."
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search workflow, tenant, trigger"
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              style={{ width: 280 }}
            />
            <Select
              value={status}
              style={{ width: 160 }}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'success', label: 'Success' },
                { value: 'failed', label: 'Failed' },
                { value: 'running', label: 'Running' },
              ]}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
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
        <Table<AutomationLog>
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
