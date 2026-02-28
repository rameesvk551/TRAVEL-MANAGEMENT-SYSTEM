// ── ConnectionMethodSelector ──
// Lets users pick between Manual or Embedded signup.

import React from 'react';
import { Radio, Typography, Space, Row, Col } from 'antd';
import { KeyOutlined, FacebookOutlined } from '@ant-design/icons';
import type { WhatsAppConnectionMethod } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface ConnectionMethodSelectorProps {
  value: WhatsAppConnectionMethod;
  onChange: (method: WhatsAppConnectionMethod) => void;
}

const ConnectionMethodSelector: React.FC<ConnectionMethodSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          Choose Connection Method
        </Title>
        <Text type="secondary">
          Select how you'd like to connect your WhatsApp Business account.
        </Text>
      </Space>

      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Radio.Button
              value="manual"
              style={{
                width: '100%',
                height: 'auto',
                padding: 20,
                borderRadius: 12,
                textAlign: 'left',
                whiteSpace: 'normal',
                border: value === 'manual' ? '2px solid #25D366' : undefined,
              }}
            >
              <Space direction="vertical" size={4}>
                <Space>
                  <KeyOutlined style={{ fontSize: 20, color: '#25D366' }} />
                  <Text strong style={{ fontSize: 16 }}>
                    Manual Setup
                  </Text>
                </Space>
                <Paragraph
                  type="secondary"
                  style={{ margin: 0, fontSize: 13 }}
                >
                  I already have a WhatsApp Business API account. I'll enter my
                  WAB ID, Phone Number ID, and Access Token.
                </Paragraph>
              </Space>
            </Radio.Button>
          </Col>
          <Col xs={24} md={12}>
            <Radio.Button
              value="embedded"
              style={{
                width: '100%',
                height: 'auto',
                padding: 20,
                borderRadius: 12,
                textAlign: 'left',
                whiteSpace: 'normal',
                border: value === 'embedded' ? '2px solid #1877F2' : undefined,
              }}
            >
              <Space direction="vertical" size={4}>
                <Space>
                  <FacebookOutlined style={{ fontSize: 20, color: '#1877F2' }} />
                  <Text strong style={{ fontSize: 16 }}>
                    Quick Setup (Facebook)
                  </Text>
                </Space>
                <Paragraph
                  type="secondary"
                  style={{ margin: 0, fontSize: 13 }}
                >
                  I'm new to WhatsApp Business API. Set up everything automatically
                  through Facebook's guided flow.
                </Paragraph>
              </Space>
            </Radio.Button>
          </Col>
        </Row>
      </Radio.Group>
    </div>
  );
};

export default ConnectionMethodSelector;
