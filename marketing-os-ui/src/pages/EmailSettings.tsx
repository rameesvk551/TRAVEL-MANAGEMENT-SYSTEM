import React from 'react';
import { Typography, Row, Col, Breadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined } from '@ant-design/icons';
import { SMTPForm } from '../components/email/SMTPForm';
import { useResponsive } from '../hooks/useResponsive';

const { Title } = Typography;

const EmailSettings: React.FC = () => {
    const { isMobile } = useResponsive();
    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <Breadcrumb
                items={[
                    { href: '/', title: <HomeOutlined /> },
                    { href: '/email', title: 'Email' },
                    { title: 'Settings' },
                ]}
                style={{ marginBottom: 16 }}
            />

            <div style={{ marginBottom: 24 }}>
                <Title level={isMobile ? 4 : 2}><SettingOutlined /> Email Settings</Title>
                <p>Configure your email provider to start sending campaigns.</p>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <SMTPForm />
                </Col>
                <Col xs={24} lg={12}>
                    {/* Placeholder for future settings like Domain Verification */}
                </Col>
            </Row>
        </div>
    );
};

export default EmailSettings;
