// ── ApiKeysSettingsPage ──

import React from 'react';
import { Typography, Space, Breadcrumb } from 'antd';
import { KeyOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { useApiKeys } from '../hooks';
import { ApiKeysManager } from '../components';

const { Title, Text } = Typography;

const ApiKeysSettingsPage: React.FC = () => {
  const { keys, isLoading, create, isCreating, revoke, isRevoking } = useApiKeys();

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <HomeOutlined /> },
          { title: <><SettingOutlined /> Settings</> },
          { title: 'API Keys' },
        ]}
      />
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <KeyOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          API Keys
        </Title>
        <Text type="secondary">Manage access tokens for external integrations.</Text>
      </Space>

      <ApiKeysManager
        keys={keys}
        isLoading={isLoading}
        onCreate={create}
        isCreating={isCreating}
        onRevoke={revoke}
        isRevoking={isRevoking}
      />
    </div>
  );
};

export default ApiKeysSettingsPage;
