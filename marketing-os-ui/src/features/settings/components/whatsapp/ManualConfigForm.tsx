// ── ManualConfigForm ──
// Form for existing WhatsApp owners to enter their WAB ID, Token, etc.
// ZERO logic — delegates everything to the hook via props.

import React from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Space,
  Alert,
  Tooltip,
  Divider,
} from 'antd';
import {
  KeyOutlined,
  PhoneOutlined,
  IdcardOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { WhatsAppManualConfig } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface ManualConfigFormProps {
  initialValues?: Partial<WhatsAppManualConfig> | null;
  onSubmit: (values: WhatsAppManualConfig) => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

const ManualConfigForm: React.FC<ManualConfigFormProps> = ({
  initialValues,
  onSubmit,
  isSubmitting,
  isEditMode = false,
}) => {
  const [form] = Form.useForm<WhatsAppManualConfig>();

  const handleFinish = (values: WhatsAppManualConfig) => {
    onSubmit(values);
  };

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: 32 } }}
    >
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <KeyOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Manual Configuration
        </Title>
        <Text type="secondary">
          For existing WhatsApp Business API owners. Enter your credentials from the Meta
          Developer Console.
        </Text>
      </Space>

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="Where to find these values"
        description={
          <Paragraph style={{ margin: 0 }} type="secondary">
            Go to{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
            >
              Meta Developer Console
            </a>{' '}
            → Your App → WhatsApp → API Setup. You'll find the Phone Number
            ID, WhatsApp Business Account ID, and a temporary or permanent access token.
          </Paragraph>
        }
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues || {}}
        onFinish={handleFinish}
        requiredMark="optional"
        size="large"
      >
        <Form.Item
          name="whatsappBusinessAccountId"
          label={
            <Space>
              WhatsApp Business Account ID
              <Tooltip title="Found in Meta Business Suite under WhatsApp accounts">
                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: 'WAB Account ID is required' },
            { pattern: /^\d+$/, message: 'Must be a numeric ID' },
          ]}
        >
          <Input
            prefix={<IdcardOutlined style={{ color: '#94A3B8' }} />}
            placeholder="e.g. 123456789012345"
          />
        </Form.Item>

        <Form.Item
          name="phoneNumberId"
          label={
            <Space>
              Phone Number ID
              <Tooltip title="Found under WhatsApp → API Setup in your Meta app">
                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: 'Phone Number ID is required' },
            { pattern: /^\d+$/, message: 'Must be a numeric ID' },
          ]}
        >
          <Input
            prefix={<PhoneOutlined style={{ color: '#94A3B8' }} />}
            placeholder="e.g. 109876543210123"
          />
        </Form.Item>

        <Form.Item
          name="accessToken"
          label={
            <Space>
              Permanent Access Token
              <Tooltip title="Generate a permanent token via System Users in Meta Business Suite">
                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: 'Access token is required' },
            { min: 20, message: 'Token seems too short' },
          ]}
        >
          <Input.Password
            prefix={<SafetyCertificateOutlined style={{ color: '#94A3B8' }} />}
            placeholder="EAAxxxxxxx..."
          />
        </Form.Item>

        <Form.Item
          name="verifyToken"
          label={
            <Space>
              Webhook Verify Token
              <Tooltip title="A secret string you set for webhook verification. Can be any random string.">
                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </Space>
          }
          rules={[
            { required: true, message: 'Verify token is required' },
            { min: 8, message: 'Token must be at least 8 characters' },
          ]}
        >
          <Input
            prefix={<KeyOutlined style={{ color: '#94A3B8' }} />}
            placeholder="my_secret_verify_token_123"
          />
        </Form.Item>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>
          Optional Details
        </Title>

        <Form.Item
          name="displayPhoneNumber"
          label="Display Phone Number"
        >
          <Input
            prefix={<PhoneOutlined style={{ color: '#94A3B8' }} />}
            placeholder="+91 98765 43210"
          />
        </Form.Item>

        <Form.Item name="businessName" label="Business Name">
          <Input
            prefix={<ShopOutlined style={{ color: '#94A3B8' }} />}
            placeholder="Your Business Name"
          />
        </Form.Item>

        <Form.Item
          name="webhookUrl"
          label={
            <Space>
              Webhook Callback URL
              <Tooltip title="Auto-generated. Use this URL in your Meta App webhook settings.">
                <InfoCircleOutlined style={{ color: '#94A3B8' }} />
              </Tooltip>
            </Space>
          }
        >
          <Input
            prefix={<LinkOutlined style={{ color: '#94A3B8' }} />}
            placeholder="https://yourdomain.com/api/v1/webhooks/whatsapp"
            disabled
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            size="large"
            block
            style={{
              height: 48,
              borderRadius: 10,
              fontWeight: 600,
              background: '#25D366',
              borderColor: '#25D366',
            }}
          >
            {isEditMode ? 'Update Configuration' : 'Connect WhatsApp'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ManualConfigForm;
