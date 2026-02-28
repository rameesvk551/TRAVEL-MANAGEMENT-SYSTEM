// ── IntegrationsSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { ApiOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { IntegrationsPanel } from '../components';
import type { SettingsSection } from '../types';

const { Title, Text } = Typography;

interface IntegrationsSettingsPageProps {
  onNavigate: (section: SettingsSection) => void;
}

const IntegrationsSettingsPage: React.FC<IntegrationsSettingsPageProps> = ({
  onNavigate,
}) => {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'Integrations' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <ApiOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Integrations
        </Title>
        <Text type="secondary">Connect third-party services.</Text>
      </Space>

      <IntegrationsPanel onNavigateToWhatsApp={() => onNavigate('whatsapp')} />
    </div>
  );
};

export default IntegrationsSettingsPage;
