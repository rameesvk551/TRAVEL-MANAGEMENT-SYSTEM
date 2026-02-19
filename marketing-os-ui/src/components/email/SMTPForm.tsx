import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Select, message, Spin } from 'antd';
import { MailOutlined, KeyOutlined, SaveOutlined, ApiOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { emailApi } from '../../api/modules';

const { Option } = Select;

export const SMTPForm: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'failed' | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await emailApi.getSettings();
            if (data) {
                form.setFieldsValue({
                    provider: data.provider,
                    fromName: data.fromName,
                    fromEmail: data.fromEmail,
                    smtpHost: data.smtpHost,
                    smtpPort: data.smtpPort,
                    username: data.username,
                    dailyLimit: data.dailyLimit,
                    rateLimitPerMinute: data.rateLimitPerMinute,
                });
                setConnectionStatus(data.status);
            }
        } catch (error) {
            // Ignore 404
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await emailApi.updateSettings(values);
            message.success('Settings saved successfully');
            setConnectionStatus(null); // Reset status until tested
        } catch (error: any) {
            message.error(error.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            // Save first ensuring we test latest
            await emailApi.updateSettings(form.getFieldsValue());
            const result = await emailApi.testConnection();
            if (result.success) {
                message.success('Connection verified!');
                setConnectionStatus('connected');
            } else {
                message.error('Connection failed: ' + result.message);
                setConnectionStatus('failed');
            }
        } catch (error: any) {
            message.error('Test failed: ' + error.message);
            setConnectionStatus('failed');
        } finally {
            setTesting(false);
        }
    };

    return (
        <Card
            title="Email Service Configuration"
            extra={
                connectionStatus === 'connected' ? <span style={{ color: 'green' }}><CheckCircleOutlined /> Connected</span> :
                    connectionStatus === 'failed' ? <span style={{ color: 'red' }}><CloseCircleOutlined /> Disconnected</span> : null
            }
        >
            {loading && !testing ? <Spin /> : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ provider: 'smtp', smtpPort: 587, dailyLimit: 1000, rateLimitPerMinute: 60 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
                            <Select>
                                <Option value="smtp">Generic SMTP</Option>
                                <Option value="gmail">Gmail (App Password)</Option>
                                <Option value="ses">Amazon SES</Option>
                            </Select>
                        </Form.Item>

                        <div />

                        <Form.Item name="fromName" label="Sender Name" rules={[{ required: true }]}>
                            <Input prefix={<MailOutlined />} placeholder="Marketing Team" />
                        </Form.Item>
                        <Form.Item name="fromEmail" label="Sender Email" rules={[{ required: true, type: 'email' }]}>
                            <Input prefix={<MailOutlined />} placeholder="marketing@example.com" />
                        </Form.Item>

                        <Form.Item name="smtpHost" label="SMTP Host" rules={[{ required: true }]}>
                            <Input placeholder="smtp.example.com" />
                        </Form.Item>
                        <Form.Item name="smtpPort" label="SMTP Port" rules={[{ required: true }]}>
                            <Input type="number" />
                        </Form.Item>

                        <Form.Item name="username" label="SMTP Username" rules={[{ required: true }]}>
                            <Input placeholder="user@example.com" />
                        </Form.Item>
                        <Form.Item name="password" label="SMTP Password" rules={[{ required: false, message: 'Required for new connections' }]}>
                            <Input.Password prefix={<KeyOutlined />} placeholder="••••••••" />
                        </Form.Item>

                        <Form.Item name="dailyLimit" label="Daily Sending Limit">
                            <Input type="number" />
                        </Form.Item>
                        <Form.Item name="rateLimitPerMinute" label="Rate Limit (per min)">
                            <Input type="number" />
                        </Form.Item>
                    </div>

                    <Form.Item>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                Save Configuration
                            </Button>
                            <Button onClick={handleTestConnection} icon={<ApiOutlined />} loading={testing}>
                                Save & Test Connection
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            )}
        </Card>
    );
};
