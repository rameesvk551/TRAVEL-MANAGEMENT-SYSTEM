// ── BillingSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { DollarOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { BillingPanel } from '../components';

const { Title, Text } = Typography;

const BillingSettingsPage: React.FC = () => {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'Billing' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <DollarOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Billing
        </Title>
        <Text type="secondary">Subscription and payment management.</Text>
      </Space>

      <BillingPanel />
    </div>
  );
};

export default BillingSettingsPage;
