// ── ApiKeysManager ──

import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Modal,
  Input,
  Form,
  Tag,
  Popconfirm,
  Spin,
  Empty,
  Alert,
} from 'antd';
import {
  KeyOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import type { ApiKeyInfo } from '../types';

const { Title, Text, Paragraph } = Typography;

interface ApiKeysManagerProps {
  keys: ApiKeyInfo[];
  isLoading: boolean;
  onCreate: (name: string) => void;
  isCreating: boolean;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

const ApiKeysManager: React.FC<ApiKeysManagerProps> = ({
  keys,
  isLoading,
  onCreate,
  isCreating,
  onRevoke,
  isRevoking,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = () => {
    form.validateFields().then(({ name }) => {
      onCreate(name);
      form.resetFields();
      setShowCreate(false);
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Key',
      dataIndex: 'keyLast4',
      key: 'key',
      render: (last4: string) => (
        <Tag>
          <Text code>•••• {last4}</Text>
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (d: string | null) => (d ? new Date(d).toLocaleDateString() : 'Never'),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (d: string | null) => (d ? new Date(d).toLocaleDateString() : 'Never'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ApiKeyInfo) => (
        <Popconfirm
          title="Revoke this API key?"
          description="This action cannot be undone."
          onConfirm={() => onRevoke(record.id)}
        >
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={isRevoking}
          />
        </Popconfirm>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card style={{ borderRadius: 12, textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>
            <KeyOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
            API Keys
          </Title>
          <Text type="secondary">
            Manage API keys for external integrations.
          </Text>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowCreate(true)}
        >
          Create Key
        </Button>
      </div>

      <Alert
        type="warning"
        message="Keep your API keys secure. Never expose them in client-side code."
        showIcon
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      {keys.length > 0 ? (
        <Table
          dataSource={keys}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ) : (
        <Empty description="No API keys created yet" />
      )}

      <Modal
        title="Create API Key"
        open={showCreate}
        onOk={handleCreate}
        onCancel={() => setShowCreate(false)}
        confirmLoading={isCreating}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Key Name"
            rules={[{ required: true, message: 'Enter a name for this key' }]}
          >
            <Input placeholder="e.g. Production Backend" />
          </Form.Item>
        </Form>
        <Paragraph type="secondary" style={{ fontSize: 12 }}>
          <CopyOutlined style={{ marginRight: 4 }} />
          The full key will be shown once after creation. Make sure to copy it.
        </Paragraph>
      </Modal>
    </Card>
  );
};

export default ApiKeysManager;
