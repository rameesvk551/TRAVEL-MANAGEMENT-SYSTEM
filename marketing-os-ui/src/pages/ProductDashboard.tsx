import { Card, Row, Col, Statistic, Table, Spin, Typography, Space, Empty } from 'antd';
import { ExperimentOutlined, ClockCircleOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { productApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title } = Typography;

export default function ProductDashboard() {
    const { isMobile } = useResponsive();
    const { data, isLoading } = useQuery({ queryKey: ['product-dashboard'], queryFn: () => productApi.getDashboard() });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!data) return null;

    const featureCols = [
        { title: 'Feature', dataIndex: 'feature_name', key: 'feature' },
        { title: 'Users', dataIndex: 'unique_users', key: 'users', render: (v: number) => (v || 0).toLocaleString() },
        { title: 'Usage', dataIndex: 'total_usage', key: 'usage', render: (v: number) => (v || 0).toLocaleString(), responsive: ['sm'] as any },
        { title: 'Avg Duration', dataIndex: 'avg_duration', key: 'duration', render: (v: number) => v ? `${Math.round(v)}s` : '-', responsive: ['md'] as any },
    ];

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>📊 Product & User Behavior Analytics</Title>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Sessions</span>} value={data.sessionStats?.total_sessions || 0} prefix={<AppstoreOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Unique Users</span>} value={data.sessionStats?.unique_users || 0} prefix={<UserOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Avg Duration</span>} value={Math.round(data.sessionStats?.avg_duration || 0)} suffix="s" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Avg Pages/Session</span>} value={Math.round(data.sessionStats?.avg_pages || 0)} prefix={<ExperimentOutlined />} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={14}>
                    <Card title={<Space><ExperimentOutlined /> Feature Adoption</Space>} style={{ borderRadius: 12 }}>
                        {Array.isArray(data.featureAdoption) && data.featureAdoption.length > 0 ? (
                            <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                                <BarChart data={data.featureAdoption.slice(0, isMobile ? 6 : 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="feature_name" tick={{ fontSize: isMobile ? 9 : 11 }} />
                                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                                    <Tooltip />
                                    <Bar dataKey="unique_users" fill="#6366F1" name="Users" radius={[8, 8, 0, 0]} />
                                    {!isMobile && <Bar dataKey="total_usage" fill="#06B6D4" name="Usage" radius={[8, 8, 0, 0]} />}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <Empty description="No feature data" />}
                    </Card>
                </Col>
                <Col xs={24} md={10}>
                    <Card title="📈 Feature Details" style={{ borderRadius: 12 }}>
                        <div className="responsive-table-wrapper">
                            <Table dataSource={Array.isArray(data.featureAdoption) ? data.featureAdoption : []} columns={featureCols} rowKey="feature_name" pagination={{ pageSize: 8 }} size="small" locale={{ emptyText: <Empty description="No feature data" /> }} />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
