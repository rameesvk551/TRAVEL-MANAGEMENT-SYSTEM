import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Space, Card, Modal, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi, Campaign } from '../services/marketing.api';
import { format } from 'date-fns';

export default function Campaigns() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch Campaigns
    const { data, isLoading } = useQuery({
        queryKey: ['marketing', 'campaigns'],
        queryFn: marketingApi.getCampaigns,
    });

    // Launch Campaign Mutation
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

    // Delete Campaign Mutation
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

    const handleLaunch = (id: string) => {
        launchMutation.mutate(id);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Campaign) => <a onClick={() => navigate(`${record.id}`)}>{text}</a>,
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: 'Channel',
            dataIndex: 'channel',
            key: 'channel',
            render: (channel: string) => <Tag color="green">{channel}</Tag>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                if (status === 'RUNNING') color = 'processing';
                if (status === 'COMPLETED') color = 'success';
                if (status === 'DRAFT') color = 'warning';
                if (status === 'FAILED') color = 'error';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Stats',
            key: 'stats',
            render: (_: any, record: Campaign) => (
                <div className="text-xs text-gray-500">
                    S: {record.sentCount || 0} | D: {record.deliveredCount || 0} | F: {record.failedCount || 0}
                </div>
            )
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => date ? format(new Date(date), 'MMM d, yyyy') : '-',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Campaign) => (
                <Space size="small">
                    {record.status === 'DRAFT' || record.status === 'SCHEDULED' ? (
                        <Popconfirm
                            title="Launch Campaign"
                            description="Are you sure you want to launch this campaign now?"
                            onConfirm={() => handleLaunch(record.id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                icon={<PlayCircleOutlined />}
                                type="text"
                                title="Launch"
                                loading={launchMutation.isPending && launchMutation.variables === record.id}
                            />
                        </Popconfirm>
                    ) : null}

                    <Button icon={<EditOutlined />} type="text" onClick={() => navigate(`${record.id}/edit`)} />

                    <Popconfirm
                        title="Delete Campaign"
                        description="Are you sure you want to delete this campaign?"
                        onConfirm={() => handleDelete(record.id)}
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
                    <p className="text-muted-foreground">Manage your broadcasts and automations</p>
                </div>
                <div className="flex space-x-2">
                    <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] })}>
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('new')}>
                        Create Campaign
                    </Button>
                </div>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={data?.campaigns || []}
                    rowKey="id"
                    loading={isLoading}
                />
            </Card>
        </div>
    );
}
