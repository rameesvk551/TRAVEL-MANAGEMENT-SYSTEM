import React, { useState } from 'react';
import { Layout, Tabs, Typography, Tag, Badge, Space } from 'antd';
import {
    ShoppingOutlined,
    OrderedListOutlined,
    SettingOutlined,
    BarChartOutlined,
    WhatsAppOutlined,
    ThunderboltOutlined,
    TeamOutlined,
    RobotOutlined,
    BulbOutlined,
    LinkOutlined,
} from '@ant-design/icons';
import StoreProducts from '../components/whatsapp/store/StoreProducts';
import StoreOrders from '../components/whatsapp/store/StoreOrders';
import StoreSettings from '../components/whatsapp/store/StoreSettings';
import StoreAnalytics from '../components/whatsapp/store/StoreAnalytics';
import LeadsList from '../components/whatsapp/leads/LeadsList';
import AutomationRules from '../components/whatsapp/automation/AutomationRules';
import { RecommendationAnalytics } from '../components/whatsapp/recommendations/RecommendationWidget';
import WhatsAppOnboarding from '../components/whatsapp/onboarding/WhatsAppOnboarding';
import { useResponsive } from '../hooks/useResponsive';

const { Content } = Layout;
const { Title, Text } = Typography;

const WAStoreDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('products');
    const { isMobile } = useResponsive();

    const items = [
        {
            key: 'products',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <ShoppingOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Products'}
                </span>
            ),
            children: <StoreProducts />,
        },
        {
            key: 'orders',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <OrderedListOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Orders'}
                    <Badge count={0} showZero={false} offset={[8, -2]} />
                </span>
            ),
            children: <StoreOrders />,
        },
        {
            key: 'leads',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <TeamOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Leads'}
                </span>
            ),
            children: <LeadsList />,
        },
        {
            key: 'automation',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <RobotOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Automation'}
                </span>
            ),
            children: <AutomationRules />,
        },
        {
            key: 'recommendations',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <BulbOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'AI Recs'}
                </span>
            ),
            children: <RecommendationAnalytics />,
        },
        {
            key: 'settings',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <SettingOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Settings'}
                </span>
            ),
            children: <StoreSettings />,
        },
        {
            key: 'analytics',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <BarChartOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Analytics'}
                </span>
            ),
            children: <StoreAnalytics />,
        },
        {
            key: 'connect',
            label: (
                <span style={{ fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>
                    <LinkOutlined style={{ marginRight: isMobile ? 4 : 8 }} />
                    {!isMobile && 'Connect'}
                </span>
            ),
            children: <WhatsAppOnboarding />,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
            <Content>
                {/* Premium Header Banner */}
                <div
                    style={{
                        background: 'linear-gradient(135deg, #075E54 0%, #128C7E 40%, #25D366 100%)',
                        borderRadius: isMobile ? 12 : 16,
                        padding: isMobile ? '20px 16px' : '28px 32px',
                        marginBottom: isMobile ? 16 : 24,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Decorative circles */}
                    <div className="mobile-hidden"
                        style={{
                            position: 'absolute',
                            top: -40,
                            right: -20,
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.06)',
                        }}
                    />
                    <div className="mobile-hidden"
                        style={{
                            position: 'absolute',
                            bottom: -30,
                            right: 80,
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.04)',
                        }}
                    />

                    <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16 }}>
                            <div
                                style={{
                                    width: isMobile ? 40 : 52,
                                    height: isMobile ? 40 : 52,
                                    borderRadius: isMobile ? 10 : 14,
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    flexShrink: 0,
                                }}
                            >
                                <WhatsAppOutlined style={{ color: '#fff', fontSize: isMobile ? 20 : 26 }} />
                            </div>
                            <div>
                                <Title level={isMobile ? 5 : 3} style={{ margin: 0, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
                                    {isMobile ? 'WA Business' : 'WA Business Automation'}
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: isMobile ? 12 : 14 }}>
                                    {isMobile ? 'Products, orders & payments via WhatsApp' : 'Sell products, collect orders & receive payments via WhatsApp'}
                                </Text>
                            </div>
                        </div>

                        <Space>
                            <Tag
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    color: '#fff',
                                    borderRadius: 20,
                                    padding: '4px 14px',
                                    fontSize: isMobile ? 11 : 12,
                                    fontWeight: 600,
                                    backdropFilter: 'blur(8px)',
                                }}
                                icon={<ThunderboltOutlined />}
                            >
                                Starter Mode
                            </Tag>
                        </Space>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={items}
                    tabBarStyle={{
                        background: '#fff',
                        borderRadius: isMobile ? 10 : 14,
                        padding: isMobile ? '4px 12px 0' : '6px 20px 0',
                        marginBottom: isMobile ? 16 : 24,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.04)',
                    }}
                    size={isMobile ? 'small' : 'large'}
                />
            </Content>
        </Layout>
    );
};

export default WAStoreDashboard;
