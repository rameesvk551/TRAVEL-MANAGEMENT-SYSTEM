// ── ConnectionStatus ──
// Displays the current WhatsApp connection status with actions.
// ZERO logic — purely presentational.

import React from 'react';
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Descriptions,
  Popconfirm,
  Divider,
  Tooltip,
  Badge,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  ApiOutlined,
  PhoneOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { WhatsAppConnection, WhatsAppConnectionStatus } from '../../types';

const { Title, Text } = Typography;

const STATUS_CONFIG: Record<
  WhatsAppConnectionStatus,
  { color: string; icon: React.ReactNode; label: string }
> = {
  connected: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    label: 'Connected',
  },
  connecting: {
    color: 'processing',
    icon: <SyncOutlined spin />,
    label: 'Connecting...',
  },
  error: {
    color: 'error',
    icon: <CloseCircleOutlined />,
    label: 'Error',
  },
  expired: {
    color: 'warning',
    icon: <ExclamationCircleOutlined />,
    label: 'Token Expired',
  },
  not_connected: {
    color: 'default',
    icon: <DisconnectOutlined />,
    label: 'Not Connected',
  },
};

interface ConnectionStatusProps {
  connection: WhatsAppConnection;
  onTest: () => void;
  isTesting: boolean;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  onRegenerateToken: () => void;
  isRegenerating: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connection,
  onTest,
  isTesting,
  onDisconnect,
  isDisconnecting,
  onRegenerateToken,
  isRegenerating,
}) => {
  const statusCfg = STATUS_CONFIG[connection.status] || STATUS_CONFIG.not_connected;

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: 32 } }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>
            <ApiOutlined style={{ marginRight: 8, color: '#25D366' }} />
            Connection Status
          </Title>
          <Text type="secondary">
            Connected via{' '}
            <Tag>{connection.connectionMethod === 'manual' ? 'Manual Config' : 'Embedded Signup'}</Tag>
          </Text>
        </Space>

        <Badge
          status={
            connection.status === 'connected'
              ? 'success'
              : connection.status === 'error'
                ? 'error'
                : 'processing'
          }
          text={
            <Tag
              icon={statusCfg.icon}
              color={statusCfg.color}
              style={{ fontSize: 14, padding: '4px 12px' }}
            >
              {statusCfg.label}
            </Tag>
          }
        />
      </div>

      {connection.errorMessage && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
          }}
        >
          <Text type="danger">
            <CloseCircleOutlined style={{ marginRight: 8 }} />
            {connection.errorMessage}
          </Text>
        </div>
      )}

      <Descriptions
        column={{ xs: 1, sm: 2 }}
        size="small"
        bordered
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item
          label={
            <Space>
              <ShopOutlined /> Business Name
            </Space>
          }
        >
          {connection.businessName || '—'}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <PhoneOutlined /> Phone Number
            </Space>
          }
        >
          {connection.displayPhoneNumber || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="WAB Account ID">
          <Text copyable={{ text: connection.whatsappBusinessAccountId || '' }}>
            {connection.whatsappBusinessAccountId || '—'}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Phone Number ID">
          <Text copyable={{ text: connection.phoneNumberId || '' }}>
            {connection.phoneNumberId || '—'}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Access Token">
          {connection.accessTokenLast4 ? `•••• ${connection.accessTokenLast4}` : '—'}
        </Descriptions.Item>
        <Descriptions.Item
          label={
            <Space>
              <ClockCircleOutlined /> Connected At
            </Space>
          }
        >
          {connection.connectedAt
            ? new Date(connection.connectedAt).toLocaleString()
            : '—'}
        </Descriptions.Item>
      </Descriptions>

      {connection.webhookUrl && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Webhook URL">
              <Text copyable style={{ fontSize: 13, fontFamily: 'monospace' }}>
                {connection.webhookUrl}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space>
                  <SafetyCertificateOutlined /> Verify Token
                </Space>
              }
            >
              <Space>
                <Text copyable style={{ fontSize: 13, fontFamily: 'monospace' }}>
                  {connection.verifyToken || '—'}
                </Text>
                <Tooltip title="Regenerate verify token">
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    loading={isRegenerating}
                    onClick={onRegenerateToken}
                  />
                </Tooltip>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      <Divider />

      <Space wrap>
        <Button
          icon={<SyncOutlined />}
          loading={isTesting}
          onClick={onTest}
        >
          Test Connection
        </Button>
        <Popconfirm
          title="Disconnect WhatsApp?"
          description="This will remove the integration. You can reconnect later."
          onConfirm={onDisconnect}
          okText="Disconnect"
          okButtonProps={{ danger: true }}
        >
          <Button
            danger
            icon={<DisconnectOutlined />}
            loading={isDisconnecting}
          >
            Disconnect
          </Button>
        </Popconfirm>
      </Space>
    </Card>
  );
};

export default ConnectionStatus;
