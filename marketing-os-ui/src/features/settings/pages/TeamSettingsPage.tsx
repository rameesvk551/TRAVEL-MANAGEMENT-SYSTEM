// ── TeamSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { TeamOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { TeamPanel } from '../components';

const { Title, Text } = Typography;

const TeamSettingsPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'Team' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Team
        </Title>
        <Text type="secondary">Invite members and manage roles.</Text>
      </Space>

      <TeamPanel />
    </div>
  );
};

export default TeamSettingsPage;
