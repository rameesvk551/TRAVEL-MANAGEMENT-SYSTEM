import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const { Title, Text } = Typography;

function ResetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const onFinish = async (values: any) => {
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: values.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Reset failed');
            }

            message.success('Password reset successfully');
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#f0f2f5'
            }}>
                <Card style={{ width: '100%', maxWidth: 400, margin: '0 16px', textAlign: 'center' }}>
                    <Alert
                        message="Invalid Link"
                        description="This password reset link is invalid or missing."
                        type="error"
                        showIcon
                    />
                    <div style={{ marginTop: 16 }}>
                        <Link to="/login">Return to Login</Link>
                    </div>
                </Card>
            </div>
        );
    }

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
                    <Title level={3}>Set New Password</Title>
                    <Text type="secondary">Enter your new password below</Text>
                </div>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Form
                    name="reset-password"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: 'Please input your new password!' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
                    </Form.Item>

                    <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Please confirm your password!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default ResetPasswordPage;
