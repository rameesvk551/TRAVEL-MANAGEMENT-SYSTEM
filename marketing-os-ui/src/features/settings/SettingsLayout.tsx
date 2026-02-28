// ── SettingsLayout ──
// Main Settings page with sidebar navigation.
// This is the top-level page rendered at /settings.
// It composes the sidebar + sub-pages. NO business logic here.

import React, { useState } from 'react';
import { Typography, Layout, Card, theme } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useResponsive } from '../../hooks/useResponsive';
import { SettingsSidebar } from './components';
import {
  GeneralSettingsPage,
  ProfileSettingsPage,
  NotificationSettingsPage,
  WhatsAppSettingsPage,
  IntegrationsSettingsPage,
  ApiKeysSettingsPage,
  BillingSettingsPage,
  TeamSettingsPage,
} from './pages';
import type { SettingsSection } from './types';

const { Title } = Typography;
const { Sider, Content } = Layout;

const SettingsLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const { isMobile } = useResponsive();
  const { token } = theme.useToken();

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettingsPage />;
      case 'profile':
        return <ProfileSettingsPage />;
      case 'notifications':
        return <NotificationSettingsPage />;
      case 'whatsapp':
        return <WhatsAppSettingsPage />;
      case 'integrations':
        return (
          <IntegrationsSettingsPage onNavigate={setActiveSection} />
        );
      case 'api-keys':
        return <ApiKeysSettingsPage />;
      case 'billing':
        return <BillingSettingsPage />;
      case 'team':
        return <TeamSettingsPage />;
      default:
        return <GeneralSettingsPage />;
    }
  };

  return (
    <div style={{ padding: isMobile ? 16 : 24, minHeight: '100%' }}>
      <Title
        level={2}
        style={{
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SettingOutlined style={{ color: token.colorPrimary }} />
        Settings
      </Title>

      <Layout
        style={{
          background: 'transparent',
          borderRadius: 12,
          gap: isMobile ? 16 : 24,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {/* Sidebar */}
        {isMobile ? (
          <Card
            style={{ borderRadius: 12, marginBottom: 16 }}
            styles={{ body: { padding: 8 } }}
          >
            <SettingsSidebar
              activeSection={activeSection}
              onChange={setActiveSection}
            />
          </Card>
        ) : (
          <Sider
            width={240}
            style={{
              background: token.colorBgContainer,
              borderRadius: 12,
              padding: '16px 0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              height: 'fit-content',
              position: 'sticky',
              top: 80,
            }}
          >
            <SettingsSidebar
              activeSection={activeSection}
              onChange={setActiveSection}
            />
          </Sider>
        )}

        {/* Content area */}
        <Content style={{ minHeight: 400 }}>{renderContent()}</Content>
      </Layout>
    </div>
  );
};

export default SettingsLayout;
