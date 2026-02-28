// ── IntegrationsPanel ──
// Placeholder page listing available integrations.

import React from 'react';
import { Card, Typography, Row, Col, Tag, Button, Space } from 'antd';
import {
  ApiOutlined,
  WhatsAppOutlined,
  MailOutlined,
  GoogleOutlined,
  ShopOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface Integration {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'available' | 'coming_soon';
  color: string;
}

const integrations: Integration[] = [
  {
    key: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Send messages, manage conversations, and automate WhatsApp communications.',
    icon: <WhatsAppOutlined style={{ fontSize: 28 }} />,
    status: 'available',
    color: '#25D366',
  },
  {
    key: 'email',
    name: 'Email (SMTP / SendGrid)',
    description: 'Send transactional and marketing emails.',
    icon: <MailOutlined style={{ fontSize: 28 }} />,
    status: 'available',
    color: '#4F46E5',
  },
  {
    key: 'google',
    name: 'Google Analytics',
    description: 'Track website visitors and campaign performance.',
    icon: <GoogleOutlined style={{ fontSize: 28 }} />,
    status: 'coming_soon',
    color: '#EA4335',
  },
  {
    key: 'shopify',
    name: 'Shopify',
    description: 'Sync products, orders, and customer data with your store.',
    icon: <ShopOutlined style={{ fontSize: 28 }} />,
    status: 'coming_soon',
    color: '#96BF48',
  },
  {
    key: 'analytics',
    name: 'Facebook Pixel',
    description: 'Track conversions and optimize Facebook ad campaigns.',
    icon: <BarChartOutlined style={{ fontSize: 28 }} />,
    status: 'coming_soon',
    color: '#1877F2',
  },
];

interface IntegrationsPanelProps {
  onNavigateToWhatsApp: () => void;
}

const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({
  onNavigateToWhatsApp,
}) => {
  const statusTag = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Tag color="success">Connected</Tag>;
      case 'available':
        return <Tag color="blue">Available</Tag>;
      case 'coming_soon':
        return <Tag>Coming Soon</Tag>;
    }
  };

  return (
    <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32 } }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ApiOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Integrations
        </Title>
        <Text type="secondary">
          Connect third-party services to enhance your marketing platform.
        </Text>
      </Space>

      <Row gutter={[16, 16]}>
        {integrations.map((intg) => (
          <Col xs={24} sm={12} lg={8} key={intg.key}>
            <Card
              hoverable={intg.status !== 'coming_soon'}
              style={{
                borderRadius: 12,
                opacity: intg.status === 'coming_soon' ? 0.6 : 1,
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ color: intg.color }}>{intg.icon}</div>
                  {statusTag(intg.status)}
                </div>
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    {intg.name}
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ margin: '4px 0 0', fontSize: 13 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {intg.description}
                  </Paragraph>
                </div>
                {intg.key === 'whatsapp' && intg.status === 'available' && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={onNavigateToWhatsApp}
                    style={{ background: intg.color, borderColor: intg.color }}
                  >
                    Configure
                  </Button>
                )}
                {intg.status === 'coming_soon' && (
                  <Button size="small" disabled>
                    Coming Soon
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default IntegrationsPanel;
