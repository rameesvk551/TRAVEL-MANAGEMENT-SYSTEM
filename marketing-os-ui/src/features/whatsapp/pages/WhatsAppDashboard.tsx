import React, { useState } from 'react';
import { Layout, Tabs, Typography, theme } from 'antd';
import {
    MessageOutlined,
    FileTextOutlined,
    NotificationOutlined,
    RobotOutlined,
    BarChartOutlined,
    ContactsOutlined
} from '@ant-design/icons';
import WhatsAppChats from '../components/WhatsAppChats';
import WhatsAppAutomation from '../components/WhatsAppAutomation';
import WhatsAppTemplates from '../components/WhatsAppTemplates';
import WhatsAppBroadcast from '../components/WhatsAppBroadcast';
import WhatsAppAnalytics from '../components/WhatsAppAnalytics';
import WhatsAppContacts from '../components/WhatsAppContacts';
import { useResponsive } from '../../../hooks/useResponsive';

const { Content } = Layout;
const { Title } = Typography;

const WhatsAppDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('chats');
    const { isMobile } = useResponsive();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const items = [
        {
            key: 'chats',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <MessageOutlined /> {!isMobile && 'Chats'}
                </span>
            ),
            children: <WhatsAppChats />,
        },
        {
            key: 'templates',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <FileTextOutlined /> {!isMobile && 'Templates'}
                </span>
            ),
            children: <WhatsAppTemplates />,
        },
        {
            key: 'broadcast',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <NotificationOutlined /> {!isMobile && 'Broadcast'}
                </span>
            ),
            children: <WhatsAppBroadcast />,
        },
        {
            key: 'automation',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <RobotOutlined /> {!isMobile && 'Automation'}
                </span>
            ),
            children: <WhatsAppAutomation />,
        },
        {
            key: 'analytics',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <BarChartOutlined /> {!isMobile && 'Analytics'}
                </span>
            ),
            children: <WhatsAppAnalytics />,
        },
        {
            key: 'contacts',
            label: (
                <span style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: 500 }}>
                    <ContactsOutlined /> {!isMobile && 'Contacts'}
                </span>
            ),
            children: <WhatsAppContacts />,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content style={{ margin: isMobile ? '12px 8px' : '24px 24px' }}>
                <div className="page-header">
                    <div>
                        <Title level={isMobile ? 4 : 2} style={{ margin: 0, fontWeight: 600, color: '#1f1f1f' }}>
                            WhatsApp Marketing
                        </Title>
                        <Typography.Text type="secondary" style={{ fontSize: isMobile ? 13 : 16 }}>
                            Manage campaigns, automation, and conversations
                        </Typography.Text>
                    </div>
                </div>

                <div
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        minHeight: '80vh'
                    }}
                >
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={items}
                        tabBarStyle={{
                            padding: isMobile ? '0 8px' : '0 24px',
                            marginBottom: 0,
                            borderBottom: '1px solid #f0f0f0',
                            height: isMobile ? 48 : 64,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        style={{ height: '100%' }}
                        size={isMobile ? 'small' : 'large'}
                    />
                </div>
            </Content>
        </Layout>
    );
};

export default WhatsAppDashboard;
