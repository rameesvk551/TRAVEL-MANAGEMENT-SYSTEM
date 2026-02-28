// ── NotificationSettingsForm ──

import React, { useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Button,
  Typography,
  Space,
  Divider,
  Spin,
} from 'antd';
import { BellOutlined } from '@ant-design/icons';
import type { NotificationSettings } from '../types';

const { Title, Text } = Typography;

interface NotificationSettingsFormProps {
  settings: NotificationSettings | null;
  isLoading: boolean;
  onSave: (values: Partial<NotificationSettings>) => void;
  isSaving: boolean;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({
  settings,
  isLoading,
  onSave,
  isSaving,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  if (isLoading) {
    return (
      <Card style={{ borderRadius: 12, textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BellOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Notification Preferences
        </Title>
        <Text type="secondary">Control how and when you receive notifications.</Text>
      </Space>

      <Form
        form={form}
        layout="horizontal"
        onFinish={onSave}
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 8 }}
        labelAlign="left"
        colon={false}
        size="large"
      >
        <Title level={5}>Channels</Title>

        <Form.Item
          name="emailNotifications"
          label="Email Notifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="pushNotifications"
          label="Push Notifications"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="whatsappAlerts"
          label="WhatsApp Alerts"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />
        <Title level={5}>Reports</Title>

        <Form.Item
          name="dailyDigest"
          label="Daily Digest"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="weeklyReport"
          label="Weekly Report"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider />
        <Title level={5}>Triggers</Title>

        <Form.Item
          name="alertOnNewLead"
          label="Alert on New Lead"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="alertOnConversation"
          label="Alert on New Conversation"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Save Preferences
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default NotificationSettingsForm;
