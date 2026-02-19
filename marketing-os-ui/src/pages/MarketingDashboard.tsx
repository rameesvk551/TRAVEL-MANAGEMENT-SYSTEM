import { Card, Row, Col, Button, Table, Tag, Spin, Typography } from 'antd';
import {
    PlusOutlined,
    TeamOutlined,
    RocketOutlined,
    SendOutlined,
    PercentageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketingApi } from '../api/marketing';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

const statCards = [
    {
        key: 'totalLeads',
        title: 'Total Leads',
        icon: <TeamOutlined />,
        color: '#10B981',
        bg: '#D1FAE5',
    },
    {
        key: 'activeCampaigns',
        title: 'Active Campaigns',
        icon: <RocketOutlined />,
        color: '#4F46E5',
        bg: '#EEF2FF',
    },
    {
        key: 'messagesSent',
        title: 'Messages Sent',
        icon: <SendOutlined />,
        color: '#F59E0B',
        bg: '#FEF3C7',
    },
    {
        key: 'responseRate',
        title: 'Response Rate',
        icon: <PercentageOutlined />,
        color: '#06B6D4',
        bg: '#CFFAFE',
        suffix: '%',
        precision: 2,
    },
];

export default function MarketingDashboard() {
    const navigate = useNavigate();
    const { isMobile } = useResponsive();

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
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
                <Spin size="large" />
            </div>
        );
    }

    const mobileColumns = [
        {
            title: 'Campaign',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: Record<string, string> = {
                    RUNNING: 'green', SCHEDULED: 'blue', COMPLETED: 'purple', FAILED: 'red', DRAFT: 'gold',
                };
                return <Tag color={config[status] || 'default'} style={{ borderRadius: 6 }}>{status}</Tag>;
            },
        },
    ];

    const desktopColumns = [
        {
            title: 'Campaign Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Text strong>{text}</Text>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config: Record<string, string> = {
                    RUNNING: 'green', SCHEDULED: 'blue', COMPLETED: 'purple', FAILED: 'red', DRAFT: 'gold',
                };
                return <Tag color={config[status] || 'default'} style={{ borderRadius: 6 }}>{status}</Tag>;
            },
        },
        {
            title: 'Sent',
            dataIndex: 'sentCount',
            key: 'sentCount',
            render: (v: number) => <Text type="secondary">{v || 0}</Text>,
        },
        {
            title: 'Delivered',
            dataIndex: 'deliveredCount',
            key: 'deliveredCount',
            render: (v: number) => <Text style={{ color: '#10B981' }}>{v || 0}</Text>,
        },
        {
            title: 'Read',
            dataIndex: 'readCount',
            key: 'readCount',
            render: (v: number) => <Text type="secondary">{v || 0}</Text>,
        },
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <Title level={isMobile ? 4 : 3} style={{ margin: 0, fontWeight: 700 }}>Marketing Overview</Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>Track your campaign performance at a glance</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/campaigns')}
                    size={isMobile ? 'middle' : 'large'}
                    block={isMobile}
                    style={{
                        background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                    }}
                >
                    Manage Campaigns
                </Button>
            </div>

            {/* Stat Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {statCards.map((sc) => (
                    <Col xs={12} sm={12} lg={6} key={sc.key}>
                        <Card
                            style={{
                                borderRadius: 14,
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                overflow: 'hidden',
                            }}
                            styles={{ body: { padding: isMobile ? '16px 14px' : '24px 20px' } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ minWidth: 0 }}>
                                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 13, fontWeight: 500, display: 'block' }}>{sc.title}</Text>
                                    <div style={{ fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#0F172A', marginTop: 4, lineHeight: 1.2 }}>
                                        {(stats as any)?.[sc.key] || 0}
                                        {sc.suffix && <span style={{ fontSize: isMobile ? 13 : 16, fontWeight: 500, color: '#64748B' }}>{sc.suffix}</span>}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        width: isMobile ? 36 : 44,
                                        height: isMobile ? 36 : 44,
                                        borderRadius: 12,
                                        background: sc.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: isMobile ? 16 : 20,
                                        color: sc.color,
                                        flexShrink: 0,
                                    }}
                                >
                                    {sc.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Recent Campaigns */}
            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>Recent Campaigns</Text>
                        <Button type="link" onClick={() => navigate('/campaigns')} style={{ fontSize: 13, padding: 0 }}>
                            View All →
                        </Button>
                    </div>
                }
                style={{
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div className="responsive-table-wrapper">
                    <Table
                        dataSource={recentCampaigns}
                        rowKey="id"
                        columns={isMobile ? mobileColumns : desktopColumns}
                        pagination={false}
                        size={isMobile ? 'small' : 'middle'}
                    />
                </div>
            </Card>
        </div>
    );
}
