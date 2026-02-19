import { Card, Row, Col, Statistic, Table, Tag, Spin, Typography, Space, Empty, Tabs } from 'antd';
import { RocketOutlined, DollarOutlined, EyeOutlined, ThunderboltOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { adsApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;
const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdsDashboard() {
    const { isMobile } = useResponsive();
    const { data, isLoading } = useQuery({ queryKey: ['ads-dashboard'], queryFn: adsApi.getDashboard });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!data) return null;

    const campaignCols = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Platform', dataIndex: 'platform', key: 'platform', render: (v: string) => <Tag color={v === 'meta' ? 'blue' : v === 'google' ? 'red' : 'green'}>{v}</Tag> },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
        { title: 'Spend', dataIndex: 'spend', key: 'spend', render: (v: number) => `$${(v || 0).toLocaleString()}`, responsive: ['sm'] as any },
        { title: 'Clicks', dataIndex: 'clicks', key: 'clicks', render: (v: number) => (v || 0).toLocaleString(), responsive: ['md'] as any },
        { title: 'Conv', dataIndex: 'conversions', key: 'conv', render: (v: number) => (v || 0).toLocaleString(), responsive: ['md'] as any },
        { title: 'ROAS', dataIndex: 'roas', key: 'roas', render: (v: number) => <Text strong style={{ color: v > 2 ? '#10B981' : '#F59E0B' }}>{v?.toFixed(1)}x</Text>, responsive: ['sm'] as any },
    ];

    const abTestCols = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag>, responsive: ['md'] as any },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'running' ? 'blue' : v === 'completed' ? 'green' : 'default'}>{v}</Tag> },
        { title: 'A Conv.', dataIndex: 'variant_a_conversions', key: 'va', render: (v: number, r: any) => `${v || 0}/${r.variant_a_visitors || 0}` },
        { title: 'B Conv.', dataIndex: 'variant_b_conversions', key: 'vb', render: (v: number, r: any) => `${v || 0}/${r.variant_b_visitors || 0}` },
    ];

    const tabItems = [
        {
            key: 'campaigns', label: <Space><RocketOutlined /> {!isMobile && 'Campaigns'}</Space>,
            children: <div className="responsive-table-wrapper"><Table dataSource={Array.isArray(data.byPlatform) ? [] : []} columns={campaignCols} rowKey="id" pagination={{ pageSize: 10 }} size="small" locale={{ emptyText: <Empty description="No campaigns synced" /> }} /></div>,
        },
        {
            key: 'ab-tests', label: <Space><ExperimentOutlined /> {!isMobile && 'A/B Tests'}</Space>,
            children: <div className="responsive-table-wrapper"><Table dataSource={Array.isArray(data.abTests) ? data.abTests : []} columns={abTestCols} rowKey="id" pagination={{ pageSize: 10 }} size="small" locale={{ emptyText: <Empty description="No A/B tests" /> }} /></div>,
        },
    ];

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>🎯 Ads & Campaign Control Center</Title>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Spend</span>} value={data.overview?.total_spend || 0} prefix="$" valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Impressions</span>} value={data.overview?.total_impressions || 0} prefix={<EyeOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Conversions</span>} value={data.overview?.total_conversions || 0} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Avg ROAS</span>} value={data.overview?.avg_roas || 0} suffix="x" precision={1} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={16}>
                    <Card style={{ borderRadius: 12 }}>
                        <Tabs items={tabItems} size={isMobile ? 'small' : 'middle'} />
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title={<Space><DollarOutlined /> Spend by Platform</Space>} style={{ borderRadius: 12 }}>
                        {Array.isArray(data.byPlatform) && data.byPlatform.length > 0 ? (
                            <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                                <PieChart>
                                    <Pie data={data.byPlatform} dataKey="spend" nameKey="platform" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 80} label={!isMobile}>
                                        {data.byPlatform.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: any) => `$${v}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <Empty description="No platform data" />}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
