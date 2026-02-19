import { Card as AntCard, Statistic, Row, Col, Button, Table, Tag, Spin, Alert } from 'antd';
import { ArrowUpOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketingApi } from '../services/marketing.api';

export default function MarketingDashboard() {
    const navigate = useNavigate();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['marketing', 'stats'],
        queryFn: marketingApi.getDashboardStats,
    });

    const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
        queryKey: ['marketing', 'campaigns', 'recent'],
        queryFn: marketingApi.getCampaigns,
    });

    const recentCampaigns = campaignsData?.campaigns.slice(0, 5) || [];

    if (statsLoading || campaignsLoading) {
        return <div className="flex justify-center p-12"><Spin size="large" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Marketing Overview</h2>
                <div className="flex space-x-2">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/marketing/campaigns')}>
                        Manage Campaigns
                    </Button>
                </div>
            </div>

            <Row gutter={16}>
                <Col span={6}>
                    <AntCard>
                        <Statistic
                            title="Total Leads"
                            value={stats?.totalLeads || 0}
                            precision={0}
                            valueStyle={{ color: '#3f8600' }}
                            prefix={<ArrowUpOutlined />}
                        />
                    </AntCard>
                </Col>
                <Col span={6}>
                    <AntCard>
                        <Statistic
                            title="Active Campaigns"
                            value={stats?.activeCampaigns || 0}
                            precision={0}
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </AntCard>
                </Col>
                <Col span={6}>
                    <AntCard>
                        <Statistic
                            title="Messages Sent"
                            value={stats?.messagesSent || 0}
                            precision={0}
                            suffix=""
                        />
                    </AntCard>
                </Col>
                <Col span={6}>
                    <AntCard>
                        <Statistic
                            title="Response Rate"
                            value={stats?.responseRate || 0}
                            precision={2}
                            suffix="%"
                        />
                    </AntCard>
                </Col>
            </Row>

            <AntCard title="Recent Campaigns">
                <Table
                    dataSource={recentCampaigns}
                    rowKey="id"
                    columns={[
                        { title: 'Campaign Name', dataIndex: 'name', key: 'name' },
                        {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            render: (status: string) => {
                                let color = 'default';
                                if (status === 'RUNNING') color = 'green';
                                if (status === 'SCHEDULED') color = 'blue';
                                if (status === 'COMPLETED') color = 'purple';
                                if (status === 'FAILED') color = 'red';
                                return <Tag color={color}>{status}</Tag>;
                            }
                        },
                        { title: 'Sent', dataIndex: 'sentCount', key: 'sentCount' },
                        { title: 'Delivered', dataIndex: 'deliveredCount', key: 'deliveredCount' },
                        { title: 'Read', dataIndex: 'readCount', key: 'readCount' },
                    ]}
                    pagination={false}
                />
            </AntCard>
        </div>
    );
}
