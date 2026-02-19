import { Card, Row, Col, Statistic, Progress, Spin, Typography, Space, Divider } from 'antd';
import { DollarOutlined, RiseOutlined, UserOutlined, CreditCardOutlined, WarningOutlined, CheckCircleOutlined, PercentageOutlined, FundOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { revenueApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export default function RevenueDashboard() {
    const { isMobile } = useResponsive();
    const { data, isLoading } = useQuery({ queryKey: ['revenue-dashboard'], queryFn: () => revenueApi.getDashboard() });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!data) return null;

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>💰 Revenue & Financial Intelligence</Title>

            {/* KPI Cards */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>MRR</span>} value={data.mrr} prefix={<DollarOutlined />} precision={2} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>ARR</span>} value={data.arr} prefix={<RiseOutlined />} precision={2} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>ARPU</span>} value={data.arpu} prefix={<UserOutlined />} precision={2} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        <Statistic title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>LTV</span>} value={data.ltv} prefix={<FundOutlined />} precision={2} valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }} />
                    </Card>
                </Col>
            </Row>

            {/* Secondary metrics */}
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="Active Subscriptions" value={data.activeSubscriptions} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10B981', fontSize: isMobile ? 20 : 24 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="Monthly Churn" value={data.churnRate} suffix="%" prefix={<PercentageOutlined />} precision={2} valueStyle={{ color: data.churnRate > 5 ? '#EF4444' : '#10B981', fontSize: isMobile ? 20 : 24 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="Trial → Paid" value={data.trialConversion?.rate || 0} suffix="%" prefix={<RiseOutlined />} precision={1} valueStyle={{ color: '#6366F1', fontSize: isMobile ? 20 : 24 }} />
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card style={{ borderRadius: 12 }}>
                        <Statistic title="Payment Failures" value={data.paymentFailures?.failedCount || 0} prefix={<WarningOutlined />} valueStyle={{ color: data.paymentFailures?.failedCount > 0 ? '#F59E0B' : '#10B981', fontSize: isMobile ? 20 : 24 }} />
                    </Card>
                </Col>
            </Row>

            {/* Revenue by Channel + Refunds */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={14}>
                    <Card title={<Space><CreditCardOutlined /> Revenue by Channel</Space>} style={{ borderRadius: 12, height: '100%' }}>
                        {data.revenueByChannel && data.revenueByChannel.length > 0 ? (
                            <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                                <BarChart data={data.revenueByChannel}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="channel" tick={{ fontSize: isMobile ? 10 : 12 }} />
                                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                                    <Tooltip formatter={(v: any) => [`$${v}`, 'Revenue']} />
                                    <Bar dataKey="total" fill="#6366F1" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>No channel data yet</div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={10}>
                    <Card title={<Space><WarningOutlined /> Refund & Failure Stats</Space>} style={{ borderRadius: 12, height: '100%' }}>
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Text type="secondary">Refund Rate</Text>
                                <Progress percent={data.refunds?.refundRate || 0} strokeColor={data.refunds?.refundRate > 5 ? '#EF4444' : '#10B981'} />
                                <Text>${data.refunds?.totalRefunds || 0} total ({data.refunds?.refundCount || 0} refunds)</Text>
                            </div>
                            <Divider />
                            <div>
                                <Text type="secondary">Payment Failure Rate</Text>
                                <Progress percent={data.paymentFailures?.failureRate || 0} strokeColor={data.paymentFailures?.failureRate > 3 ? '#EF4444' : '#F59E0B'} />
                                <Text>${data.paymentFailures?.failedAmount || 0} failed ({data.paymentFailures?.failedCount || 0} transactions)</Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
