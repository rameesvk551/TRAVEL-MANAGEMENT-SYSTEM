// ── ProfileSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { UserOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { useProfileSettings } from '../hooks';
import { ProfileSettingsForm } from '../components';

const { Title, Text } = Typography;

const ProfileSettingsPage: React.FC = () => {
  const { profile, isLoading, update, isUpdating } = useProfileSettings();

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'Profile' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Profile
        </Title>
        <Text type="secondary">Your personal account settings.</Text>
      </Space>

      <ProfileSettingsForm
        profile={profile}
        isLoading={isLoading}
        onSave={update}
        isSaving={isUpdating}
      />
    </div>
  );
};

export default ProfileSettingsPage;
