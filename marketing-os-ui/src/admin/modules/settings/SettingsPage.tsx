import { SaveOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Space, Switch, Typography, message } from 'antd';
import { useEffect } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAdminSettings, useUpdateSettingsMutation } from '../../hooks/useAdminQueries';
import type { PlatformSettings } from '../../types';

const { Text } = Typography;

interface SettingsFormValues {
  supportEmail: string;
  allowedDomains: string;
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

export default function SettingsPage() {
  const [form] = Form.useForm<SettingsFormValues>();

  const settingsQuery = useAdminSettings();
  const updateSettingsMutation = useUpdateSettingsMutation();

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    form.setFieldsValue({
      supportEmail: settingsQuery.data.supportEmail,
      allowedDomains: settingsQuery.data.allowedDomains.join('\n'),
      maintenanceMode: settingsQuery.data.maintenanceMode,
      sessionTimeoutMinutes: settingsQuery.data.sessionTimeoutMinutes,
    });
  }, [form, settingsQuery.data]);

  const onSubmit = (values: SettingsFormValues) => {
    const payload: PlatformSettings = {
      supportEmail: values.supportEmail,
      allowedDomains: values.allowedDomains
        .split(/[,\n]/)
        .map((domain) => domain.trim())
        .filter(Boolean),
      maintenanceMode: values.maintenanceMode,
      sessionTimeoutMinutes: values.sessionTimeoutMinutes,
    };

    updateSettingsMutation.mutate(payload, {
      onSuccess: () => message.success('Platform settings updated'),
      onError: () => message.error('Failed to update settings'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage global platform configuration and operational defaults."
      />

      <AsyncState
        loading={settingsQuery.isLoading}
        error={settingsQuery.error as Error | null}
        onRetry={() => settingsQuery.refetch()}
      >
        <Card style={{ borderRadius: 14, maxWidth: 760 }}>
          <Form<SettingsFormValues>
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{
              maintenanceMode: false,
              sessionTimeoutMinutes: 45,
            }}
          >
            <Form.Item
              label="Support Email"
              name="supportEmail"
              rules={[
                { required: true, message: 'Support email is required' },
                { type: 'email', message: 'Enter a valid support email' },
              ]}
            >
              <Input placeholder="support@platform.example" />
            </Form.Item>

            <Form.Item
              label="Allowed Domains"
              name="allowedDomains"
              extra={<Text type="secondary">Add one domain per line (or comma-separated).</Text>}
              rules={[{ required: true, message: 'Add at least one domain' }]}
            >
              <Input.TextArea rows={5} placeholder="example.com" />
            </Form.Item>

            <Form.Item label="Session Timeout (minutes)" name="sessionTimeoutMinutes">
              <InputNumber min={5} max={240} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Maintenance Mode" name="maintenanceMode" valuePropName="checked">
              <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            </Form.Item>

            <Space>
              <Button icon={<SaveOutlined />} type="primary" htmlType="submit" loading={updateSettingsMutation.isPending}>
                Save Settings
              </Button>
              <Button htmlType="button" onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form>
        </Card>
      </AsyncState>
    </div>
  );
}
