// ── EmbeddedSignup ──
// Facebook Embedded Signup flow for new WhatsApp users.
// Renders the "Continue with Facebook" button and handles the popup callback.
// ZERO business logic — delegates to hook via props.

import React, { useCallback } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Alert,
  Steps,
  Spin,
} from 'antd';
import {
  FacebookOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  PhoneOutlined,
  LinkOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface EmbeddedSignupProps {
  embeddedConfig: { appId: string; configId: string; redirectUri: string } | null;
  onFetchConfig: () => void;
  isFetchingConfig: boolean;
  onComplete: (payload: { code: string; state?: string }) => void;
  isCompleting: boolean;
}

const EmbeddedSignup: React.FC<EmbeddedSignupProps> = ({
  embeddedConfig,
  onFetchConfig,
  isFetchingConfig,
  onComplete,
  isCompleting,
}) => {
  const handleFacebookLogin = useCallback(() => {
    if (!embeddedConfig) {
      onFetchConfig();
      return;
    }

    const { appId, configId, redirectUri } = embeddedConfig;

    // Build the Facebook OAuth URL
    const state = crypto.randomUUID();
    const fbUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    fbUrl.searchParams.set('client_id', appId);
    fbUrl.searchParams.set('redirect_uri', redirectUri);
    fbUrl.searchParams.set('response_type', 'code');
    fbUrl.searchParams.set('config_id', configId);
    fbUrl.searchParams.set('state', state);
    fbUrl.searchParams.set(
      'scope',
      'whatsapp_business_management,whatsapp_business_messaging',
    );

    // Open popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;
    const popup = window.open(
      fbUrl.toString(),
      'fb_wa_signup',
      `width=${width},height=${height},left=${left},top=${top}`,
    );

    // Listen for redirect back with code
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          return;
        }
        const url = new URL(popup.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          clearInterval(interval);
          popup.close();
          onComplete({ code, state });
        }
      } catch {
        // Cross-origin — keep waiting
      }
    }, 500);
  }, [embeddedConfig, onFetchConfig, onComplete]);

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: 32 } }}
    >
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FacebookOutlined style={{ marginRight: 8, color: '#1877F2' }} />
          Quick Setup with Facebook
        </Title>
        <Text type="secondary">
          New to WhatsApp Business API? Set up everything in minutes through Facebook's
          guided flow.
        </Text>
      </Space>

      <Alert
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        message="Recommended for new users"
        description="This flow will automatically create a WhatsApp Business Account, verify your phone
          number, and configure webhooks — all in one step."
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Steps
        direction="vertical"
        size="small"
        current={-1}
        style={{ marginBottom: 24 }}
        items={[
          {
            title: 'Sign in with Facebook',
            description: 'Authenticate with your Meta Business account',
            icon: <UserAddOutlined />,
          },
          {
            title: 'Select or create phone number',
            description: 'Choose an existing number or register a new one',
            icon: <PhoneOutlined />,
          },
          {
            title: 'Auto-configure webhooks',
            description: 'We handle the technical setup automatically',
            icon: <LinkOutlined />,
          },
          {
            title: 'Start messaging',
            description: 'Your WhatsApp channel is ready to use',
            icon: <CheckCircleOutlined />,
          },
        ]}
      />

      {isCompleting ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <Paragraph style={{ marginTop: 16 }} type="secondary">
            Completing setup... This may take a moment.
          </Paragraph>
        </div>
      ) : (
        <Button
          type="primary"
          size="large"
          icon={<FacebookOutlined />}
          loading={isFetchingConfig}
          onClick={handleFacebookLogin}
          block
          style={{
            height: 48,
            borderRadius: 10,
            fontWeight: 600,
            background: '#1877F2',
            borderColor: '#1877F2',
          }}
        >
          Continue with Facebook
        </Button>
      )}

      <Paragraph
        type="secondary"
        style={{ marginTop: 16, textAlign: 'center', fontSize: 12 }}
      >
        By continuing, you agree to Meta's terms for WhatsApp Business API access.
      </Paragraph>
    </Card>
  );
};

export default EmbeddedSignup;
