// ── GeneralSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { SettingOutlined, HomeOutlined } from '@ant-design/icons';
import { useGeneralSettings } from '../hooks';
import { GeneralSettingsForm } from '../components';

const { Title, Text } = Typography;

const GeneralSettingsPage: React.FC = () => {
  const { settings, isLoading, update, isUpdating } = useGeneralSettings();

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'General' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SettingOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          General Settings
        </Title>
        <Text type="secondary">Business details and regional preferences.</Text>
      </Space>

      <GeneralSettingsForm
        settings={settings}
        isLoading={isLoading}
        onSave={update}
        isSaving={isUpdating}
      />
    </div>
  );
};

export default GeneralSettingsPage;
