import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import {
    ShoppingOutlined, ShoppingCartOutlined, DollarOutlined,
    CheckCircleOutlined, ClockCircleOutlined,
    RiseOutlined, InboxOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api/modules';

const { Text, Title, Paragraph } = Typography;

const StoreAnalytics: React.FC = () => {
    const { data: analyticsData, isLoading } = useQuery({
        queryKey: ['store-analytics'],
        queryFn: () => storeApi.getAnalytics(),
    });

    const stats = analyticsData?.data;

    if (!stats && !isLoading) {
        return (
            <Card
                style={{
                    borderRadius: 16,
                    border: '1px solid rgba(0,0,0,0.06)',
                    textAlign: 'center',
                    padding: '60px 40px',
                }}
            >
                <div
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: 18,
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
                    }}
                >
                    <InboxOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>No Analytics Yet</Title>
                <Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto', fontSize: 14 }}>
                    Analytics will appear once you start receiving orders through WhatsApp.
                    Add products and enable automation to get started!
                </Paragraph>
            </Card>
        );
    }

    const cards = [
        {
            title: 'Active Products',
            value: stats?.totalProducts || 0,
            icon: <ShoppingOutlined />,
            color: '#4F46E5',
            gradient: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
        },
        {
            title: 'Total Orders',
            value: stats?.totalOrders || 0,
            icon: <ShoppingCartOutlined />,
            color: '#0891B2',
            gradient: 'linear-gradient(135deg, #ECFEFF, #CFFAFE)',
        },
        {
            title: 'Recent (7 days)',
            value: stats?.recentOrders || 0,
            icon: <RiseOutlined />,
            color: '#059669',
            gradient: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
        },
        {
            title: 'Pending',
            value: stats?.pendingOrders || 0,
            icon: <ClockCircleOutlined />,
            color: '#D97706',
            gradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
        },
        {
            title: 'Completed',
            value: stats?.completedOrders || 0,
            icon: <CheckCircleOutlined />,
            color: '#16A34A',
            gradient: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
        },
        {
            title: 'Awaiting Payment',
            value: stats?.awaitingPayment || 0,
            icon: <DollarOutlined />,
            color: '#EA580C',
            gradient: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
        },
        {
            title: 'Paid',
            value: stats?.paidOrders || 0,
            icon: <CheckCircleOutlined />,
            color: '#25D366',
            gradient: 'linear-gradient(135deg, #F0FDF9, #CCFBF1)',
        },
    ];

    return (
        <div>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <InboxOutlined style={{ color: '#4F46E5', fontSize: 18 }} />
                </div>
                <div>
                    <Title level={5} style={{ margin: 0 }}>Store Performance</Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>Overview of your WhatsApp store activity</Text>
                </div>
            </div>

            <Row gutter={[16, 16]}>
                {cards.map((card, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                        <Card
                            style={{
                                borderRadius: 14,
                                background: card.gradient,
                                border: 'none',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                cursor: 'default',
                            }}
                            bodyStyle={{ padding: '20px 24px' }}
                            loading={isLoading}
                            hoverable
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Statistic
                                    title={
                                        <Text style={{ color: card.color, fontWeight: 500, fontSize: 12 }}>
                                            {card.title}
                                        </Text>
                                    }
                                    value={card.value}
                                    valueStyle={{
                                        color: card.color,
                                        fontWeight: 700,
                                        fontSize: 30,
                                    }}
                                />
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        background: `${card.color}18`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 20,
                                        color: card.color,
                                    }}
                                >
                                    {card.icon}
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default StoreAnalytics;
