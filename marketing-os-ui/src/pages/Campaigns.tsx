import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, message, Popconfirm, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '../api/marketing';
import type { Campaign } from '../api/marketing';
import { format } from 'date-fns';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export default function Campaigns() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isMobile } = useResponsive();

    const { data, isLoading } = useQuery({
        queryKey: ['marketing', 'campaigns'],
        queryFn: marketingApi.getCampaigns,
    });

    const launchMutation = useMutation({
        mutationFn: marketingApi.launchCampaign,
        onSuccess: () => {
            message.success('Campaign launched successfully!');
            queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
        },
        onError: (error: any) => {
            message.error(`Failed to launch campaign: ${error.message}`);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: marketingApi.deleteCampaign,
        onSuccess: () => {
            message.success('Campaign deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
        },
        onError: (error: any) => {
            message.error(`Failed to delete campaign: ${error.message}`);
        },
    });

    const mobileColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong style={{ color: '#4F46E5' }}>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const config: Record<string, { color: string; bg: string }> = {
                    RUNNING: { color: '#059669', bg: '#D1FAE5' },
                    COMPLETED: { color: '#4F46E5', bg: '#EEF2FF' },
                    DRAFT: { color: '#D97706', bg: '#FEF3C7' },
                    FAILED: { color: '#DC2626', bg: '#FEE2E2' },
                    SCHEDULED: { color: '#0891B2', bg: '#CFFAFE' },
                };
                const c = config[status] || { color: '#64748B', bg: '#F1F5F9' };
                return (
                    <span style={{ background: c.bg, color: c.color, padding: '4px 10px', borderRadius: 20, fontWeight: 500, fontSize: 11 }}>
                        {status}
                    </span>
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: 80,
            render: (_: any, record: Campaign) => (
                <Space size="small">
                    {(record.status === 'DRAFT' || record.status === 'SCHEDULED') && (
                        <Popconfirm title="Launch?" onConfirm={() => launchMutation.mutate(record.id)} okText="Yes" cancelText="No">
                            <Button icon={<PlayCircleOutlined />} type="text" size="small" style={{ color: '#10B981' }} />
                        </Popconfirm>
                    )}
                    <Popconfirm title="Delete?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Yes" cancelText="No">
                        <Button icon={<DeleteOutlined />} danger type="text" size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const desktopColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Campaign) => (
                <Text strong style={{ cursor: 'pointer', color: '#4F46E5' }} onClick={() => navigate(`${record.id}`)}>
                    {text}
                </Text>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color="blue" style={{ borderRadius: 6 }}>{type}</Tag>,
        },
        {
            title: 'Channel',
            dataIndex: 'channel',
            key: 'channel',
            render: (channel: string) => <Tag color="green" style={{ borderRadius: 6 }}>{channel}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: Record<string, { color: string; bg: string }> = {
                    RUNNING: { color: '#059669', bg: '#D1FAE5' },
                    COMPLETED: { color: '#4F46E5', bg: '#EEF2FF' },
                    DRAFT: { color: '#D97706', bg: '#FEF3C7' },
                    FAILED: { color: '#DC2626', bg: '#FEE2E2' },
                    SCHEDULED: { color: '#0891B2', bg: '#CFFAFE' },
                };
                const c = config[status] || { color: '#64748B', bg: '#F1F5F9' };
                return (
                    <span style={{ background: c.bg, color: c.color, padding: '4px 12px', borderRadius: 20, fontWeight: 500, fontSize: 12 }}>
                        {status}
                    </span>
                );
            },
        },
        {
            title: 'Stats',
            key: 'stats',
            render: (_: any, record: Campaign) => (
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B' }}>
                    <span>Sent: <strong style={{ color: '#0F172A' }}>{record.sentCount || 0}</strong></span>
                    <span>Delivered: <strong style={{ color: '#10B981' }}>{record.deliveredCount || 0}</strong></span>
                    <span>Failed: <strong style={{ color: '#EF4444' }}>{record.failedCount || 0}</strong></span>
                </div>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {format(new Date(date), 'MMM d, yyyy')}
                </Text>
            ) : '-',
        },
        {
            title: 'Actions',
            key: 'action',
            width: 140,
            render: (_: any, record: Campaign) => (
                <Space size="small">
                    {record.status === 'DRAFT' || record.status === 'SCHEDULED' ? (
                        <Popconfirm
                            title="Launch Campaign"
                            description="Are you sure you want to launch this campaign now?"
                            onConfirm={() => launchMutation.mutate(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                icon={<PlayCircleOutlined />}
                                type="text"
                                title="Launch"
                                loading={launchMutation.isPending && launchMutation.variables === record.id}
                                style={{ color: '#10B981' }}
                            />
                        </Popconfirm>
                    ) : null}
                    <Button icon={<EditOutlined />} type="text" onClick={() => navigate(`${record.id}/edit`)} />
                    <Popconfirm
                        title="Delete Campaign"
                        description="Are you sure you want to delete this campaign?"
                        onConfirm={() => deleteMutation.mutate(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button icon={<DeleteOutlined />} danger type="text" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontWeight: 700 }}>Campaigns</Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>Manage your broadcasts and automations</Text>
                </div>
                <Space wrap>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] })}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('new')}
                        size={isMobile ? 'middle' : 'large'}
                        style={{
                            background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                        }}
                    >
                        {isMobile ? 'New' : 'Create Campaign'}
                    </Button>
                </Space>
            </div>

            {/* Campaigns Table */}
            <Card
                style={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div className="responsive-table-wrapper">
                    <Table
                        columns={isMobile ? mobileColumns : desktopColumns}
                        dataSource={data?.campaigns || []}
                        rowKey="id"
                        loading={isLoading}
                        size={isMobile ? 'small' : 'middle'}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: !isMobile,
                            style: { padding: '0 16px' },
                        }}
                        locale={{
                            emptyText: (
                                <div style={{ padding: isMobile ? 32 : 48, textAlign: 'center' }}>
                                    <RocketOutlined style={{ fontSize: 48, color: '#CBD5E1', marginBottom: 16 }} />
                                    <Title level={5} style={{ color: '#64748B', fontWeight: 500 }}>No campaigns yet</Title>
                                    <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                                        Create your first campaign to start engaging your audience
                                    </Text>
                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
                                        Create Campaign
                                    </Button>
                                </div>
                            ),
                        }}
                    />
                </div>
            </Card>
        </div>
    );
}
