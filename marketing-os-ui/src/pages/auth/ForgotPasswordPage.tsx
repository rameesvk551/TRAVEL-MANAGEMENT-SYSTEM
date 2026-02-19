import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async (values: { email: string }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            setSuccess(true);
            message.success('Reset link sent to your email');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: '100%', maxWidth: 400, margin: '0 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Title level={3}>Reset Password</Title>
                    <Text type="secondary">Enter your email to receive a reset link</Text>
                </div>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <Alert
                            message="Check your email"
                            description="We have sent a password reset link to your email address."
                            type="success"
                            showIcon
                            style={{ marginBottom: 24, textAlign: 'left' }}
                        />
                        <Link to="/login">
                            <Button type="primary" block>
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <Alert
                                message={error}
                                type="error"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        <Form
                            name="forgot-password"
                            onFinish={onFinish}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                name="email"
                                rules={[
                                    { required: true, message: 'Please input your Email!' },
                                    { type: 'email', message: 'Invalid email' }
                                ]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="Email" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" block loading={loading}>
                                    Send Reset Link
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center' }}>
                                <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <ArrowLeftOutlined /> Back to Login
                                </Link>
                            </div>
                        </Form>
                    </>
                )}
            </Card>
        </div>
    );
}

export default ForgotPasswordPage;
