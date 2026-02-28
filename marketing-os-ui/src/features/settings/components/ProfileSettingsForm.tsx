// ── ProfileSettingsForm ──

import React, { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  Avatar,
  Spin,
} from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import type { ProfileSettings } from '../types';

const { Title, Text } = Typography;

interface ProfileSettingsFormProps {
  profile: ProfileSettings | null;
  isLoading: boolean;
  onSave: (values: Partial<ProfileSettings>) => void;
  isSaving: boolean;
}

const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  profile,
  isLoading,
  onSave,
  isSaving,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (profile) {
      form.setFieldsValue(profile);
    }
  }, [profile, form]);

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
          <UserOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Profile Settings
        </Title>
        <Text type="secondary">Manage your personal account details.</Text>
      </Space>

      {profile && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            size={80}
            src={profile.avatarUrl}
            icon={<UserOutlined />}
            style={{ background: '#4F46E5' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">{profile.role}</Text>
          </div>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        requiredMark="optional"
        size="large"
      >
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true }]}
        >
          <Input prefix={<UserOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
            disabled
          />
        </Form.Item>

        <Form.Item name="phone" label="Phone Number">
          <Input prefix={<PhoneOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Update Profile
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileSettingsForm;
