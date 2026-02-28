// ── BillingPanel ──
// Placeholder billing page.

import React from 'react';
import { Card, Typography, Space, Empty } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BillingPanel: React.FC = () => {
  return (
    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <DollarOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Billing & Subscription
        </Title>
        <Text type="secondary">
          Manage your subscription plan, payment methods, and invoices.
        </Text>
      </Space>
      <Empty description="Billing management coming soon" />
    </Card>
  );
};

export default BillingPanel;
