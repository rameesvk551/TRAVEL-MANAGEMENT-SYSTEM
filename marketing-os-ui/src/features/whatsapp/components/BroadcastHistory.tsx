// BroadcastHistory.tsx — shows past and running broadcast campaigns
import React from 'react';
import {
    Table, Tag, Typography, Space, Button, Tooltip, Card,
    Progress, Empty, Spin,
} from 'antd';
import {
    ReloadOutlined, EyeOutlined, CheckCircleOutlined,
    ClockCircleOutlined, SyncOutlined, CloseCircleOutlined,
    SendOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { broadcastService } from '../services/broadcastService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    SENDING: { color: 'processing', icon: <SyncOutlined spin />, label: 'Sending' },
    COMPLETED: { color: 'success', icon: <CheckCircleOutlined />, label: 'Completed' },
    FAILED: { color: 'error', icon: <CloseCircleOutlined />, label: 'Failed' },
    SCHEDULED: { color: 'warning', icon: <CalendarOutlined />, label: 'Scheduled' },
    PENDING: { color: 'default', icon: <ClockCircleOutlined />, label: 'Pending' },
};

interface BroadcastHistoryProps {
    onNewBroadcast: () => void;
}

const BroadcastHistory: React.FC<BroadcastHistoryProps> = ({ onNewBroadcast }) => {
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['whatsapp-broadcasts'],
        queryFn: () => broadcastService.getBroadcasts({ limit: 50 }),
        refetchInterval: 10000, // auto-refresh every 10s to catch SENDING → COMPLETED
    });

    const broadcasts: any[] = data?.data || [];

    const columns = [
        {
            title: 'Template',
            dataIndex: 'template_name',
            key: 'template_name',
            render: (name: string) => <Text strong>{name}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: string) => {
                const cfg = statusConfig[status] || statusConfig.PENDING;
                return <Tag icon={cfg.icon} color={cfg.color}>{cfg.label}</Tag>;
            },
            filters: [
                { text: 'Sending', value: 'SENDING' },
                { text: 'Completed', value: 'COMPLETED' },
                { text: 'Failed', value: 'FAILED' },
                { text: 'Scheduled', value: 'SCHEDULED' },
            ],
            onFilter: (value: any, record: any) => record.status === value,
        },
        {
            title: 'Progress',
            key: 'progress',
            width: 200,
            render: (_: any, record: any) => {
                const total = record.total_recipients || 0;
                const sent = record.sent_count || 0;
                const failed = record.failed_count || 0;
                const done = sent + failed;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const status = record.status === 'FAILED' ? 'exception' as const
                    : record.status === 'COMPLETED' ? 'success' as const
                        : 'active' as const;
                return (
                    <div>
                        <Progress percent={pct} size="small" status={status} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {sent} sent · {failed} failed / {total} total
                        </Text>
                    </div>
                );
            },
        },
        {
            title: 'Recipients',
            dataIndex: 'total_recipients',
            key: 'total_recipients',
            width: 100,
            align: 'center' as const,
            sorter: (a: any, b: any) => a.total_recipients - b.total_recipients,
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (date: string) => (
                <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
                    <Text type="secondary">{dayjs(date).fromNow()}</Text>
                </Tooltip>
            ),
            sorter: (a: any, b: any) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            defaultSortOrder: 'descend' as const,
        },
        {
            title: 'Completed',
            dataIndex: 'completed_at',
            key: 'completed_at',
            width: 160,
            render: (date: string) => date ? (
                <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
                    <Text type="secondary">{dayjs(date).fromNow()}</Text>
                </Tooltip>
            ) : <Text type="secondary">—</Text>,
        },
    ];

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 80 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}><Text type="secondary">Loading broadcasts...</Text></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Broadcast History</Title>
                    <Text type="secondary">View and track all your broadcast campaigns</Text>
                </div>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
                    <Button type="primary" icon={<SendOutlined />} onClick={onNewBroadcast}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                        New Broadcast
                    </Button>
                </Space>
            </div>

            {broadcasts.length === 0 ? (
                <Card bordered={false} style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Empty
                        description={
                            <Space direction="vertical" size={4}>
                                <Text strong style={{ fontSize: 16 }}>No broadcasts yet</Text>
                                <Text type="secondary">Launch your first broadcast campaign to see it here</Text>
                            </Space>
                        }
                    >
                        <Button type="primary" icon={<SendOutlined />} onClick={onNewBroadcast}
                            style={{ marginTop: 16, background: '#52c41a', borderColor: '#52c41a' }}>
                            Create First Broadcast
                        </Button>
                    </Empty>
                </Card>
            ) : (
                <Card bordered={false} styles={{ body: { padding: 0 } }}>
                    <Table
                        dataSource={broadcasts}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} broadcasts` }}
                        size="middle"
                    />
                </Card>
            )}
        </div>
    );
};

export default BroadcastHistory;
