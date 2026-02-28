// ── TeamPanel ──
// Placeholder team management page.

import React from 'react';
import { Card, Typography, Space, Empty } from 'antd';
import { TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TeamPanel: React.FC = () => {
  return (
    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <TeamOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Team Management
        </Title>
        <Text type="secondary">
          Invite team members, assign roles, and manage permissions.
        </Text>
      </Space>
      <Empty description="Team management coming soon" />
    </Card>
  );
};

export default TeamPanel;
