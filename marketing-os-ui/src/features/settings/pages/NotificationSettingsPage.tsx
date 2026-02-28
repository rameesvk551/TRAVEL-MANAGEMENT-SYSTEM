// ── NotificationSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { BellOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { useNotificationSettings } from '../hooks';
import { NotificationSettingsForm } from '../components';

const { Title, Text } = Typography;

const NotificationSettingsPage: React.FC = () => {
  const { settings, isLoading, update, isUpdating } = useNotificationSettings();

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'Notifications' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <BellOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Notifications
        </Title>
        <Text type="secondary">Control when and how you receive alerts.</Text>
      </Space>

      <NotificationSettingsForm
        settings={settings}
        isLoading={isLoading}
        onSave={update}
        isSaving={isUpdating}
      />
    </div>
  );
};

export default NotificationSettingsPage;
