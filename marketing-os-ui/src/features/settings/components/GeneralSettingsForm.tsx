// ── GeneralSettingsForm ──
// Purely presentational form for general business settings.

import React, { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Space,
  Spin,
} from 'antd';
import {
  SettingOutlined,
  GlobalOutlined,
  MailOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { GeneralSettings } from '../types';

const { Title, Text } = Typography;

interface GeneralSettingsFormProps {
  settings: GeneralSettings | null;
  isLoading: boolean;
  onSave: (values: Partial<GeneralSettings>) => void;
  isSaving: boolean;
}

const timezones = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Australia/Sydney',
];

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];

const GeneralSettingsForm: React.FC<GeneralSettingsFormProps> = ({
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
          <SettingOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          General Settings
        </Title>
        <Text type="secondary">Configure your business details and preferences.</Text>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark="optional"
        size="large"
      >
        <Form.Item
          name="businessName"
          label="Business Name"
          rules={[{ required: true }]}
        >
          <Input prefix={<GlobalOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item
          name="businessEmail"
          label="Business Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input prefix={<MailOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item name="timezone" label="Timezone">
          <Select
            suffixIcon={<ClockCircleOutlined />}
            options={timezones.map((tz) => ({ label: tz, value: tz }))}
            showSearch
          />
        </Form.Item>

        <Form.Item name="language" label="Language">
          <Select
            options={[
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' },
              { label: 'Arabic', value: 'ar' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
            ]}
          />
        </Form.Item>

        <Form.Item name="currency" label="Currency">
          <Select
            options={currencies.map((c) => ({ label: c, value: c }))}
          />
        </Form.Item>

        <Form.Item name="dateFormat" label="Date Format">
          <Select
            options={[
              { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
              { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
              { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
            ]}
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default GeneralSettingsForm;
