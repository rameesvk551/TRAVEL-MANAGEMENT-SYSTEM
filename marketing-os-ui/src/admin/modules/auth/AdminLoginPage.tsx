import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, SafetyOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import client from '../../../api/client';
import { useAuth, type User } from '../../../context/AuthContext';

const { Paragraph, Text, Title } = Typography;

interface LoginResponse {
  data: {
    token: string;
    user: User;
  };
}

const allowedRoles = new Set(['super_admin', 'platform_admin', 'owner']);

const demoUser: User = {
  id: 'super-admin-demo',
  email: 'superadmin@platform.local',
  name: 'Platform Super Admin',
  role: 'super_admin',
  tenantId: 'platform',
  tenantName: 'Platform',
};

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const isDemoLogin =
        values.email.toLowerCase() === 'superadmin@platform.local' && values.password === 'Admin@123';

      if (isDemoLogin) {
        login('mock-super-admin-token', demoUser);
        navigate('/admin', { replace: true });
        return;
      }

      const response = await client.post<LoginResponse>('/auth/login', values);
      const payload = response.data.data;

      if (!allowedRoles.has(payload.user.role.toLowerCase())) {
        setError('Only super admin roles can access platform administration.');
        return;
      }

      login(payload.token, payload.user);
      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError('Invalid credentials or unable to reach auth service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background:
          'radial-gradient(100% 180% at 0% 0%, rgba(26,115,232,0.12) 0%, rgba(255,255,255,1) 45%), radial-gradient(120% 140% at 100% 100%, rgba(0,190,140,0.14) 0%, rgba(255,255,255,1) 48%)',
      }}
    >
      <Card style={{ width: 'min(440px, 100%)', borderRadius: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 6 }}>
            Platform Super Admin
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Secure access to tenant administration, billing, health, and configuration controls.
          </Paragraph>
        </div>

        {error ? <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error} /> : null}

        <Form layout="vertical" onFinish={onSubmit}>
          <Form.Item
            label="Work email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email address' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="superadmin@platform.local" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter password" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading} icon={<SafetyOutlined />}>
            Access Admin Console
          </Button>
        </Form>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Demo credentials: `superadmin@platform.local` / `Admin@123`
          </Text>
        </div>
      </Card>
    </div>
  );
}
