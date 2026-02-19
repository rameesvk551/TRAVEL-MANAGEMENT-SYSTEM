import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Steps,
    Typography,
    Space,
    Alert,
    Spin,
    Result,
    Tag,
    Divider,
    Descriptions,
    Modal,
    message,
    Form,
    Input,
    Tabs,
} from 'antd';
import {
    WhatsAppOutlined,
    QrcodeOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    LinkOutlined,
    DisconnectOutlined,
    SafetyCertificateOutlined,
    PhoneOutlined,
    SettingOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/client';

const { Title, Text, Paragraph } = Typography;

interface OnboardConfig {
    appId: string;
    configId: string;
    redirectUri: string;
    scopes: string[];
}

interface ConnectionStatus {
    isConnected: boolean;
    onboardingMethod?: 'embedded_signup' | 'manual' | 'qr_code';
    phoneNumber?: string;
    businessName?: string;
    qualityRating?: 'GREEN' | 'YELLOW' | 'RED';
    features: {
        catalogEnabled: boolean;
        cartEnabled: boolean;
        paymentsEnabled: boolean;
        flowsEnabled: boolean;
    };
}

interface ManualCredentials {
    accessToken: string;
    phoneNumberId: string;
    wabaId: string;
    businessName?: string;
}

// WhatsApp Onboarding API
const onboardApi = {
    getConfig: () => apiClient.get<{ data: OnboardConfig }>('/whatsapp/onboard/config'),
    getStatus: () => apiClient.get<{ data: ConnectionStatus }>('/whatsapp/onboard/status'),
    completeOnboarding: (code: string) => apiClient.post('/whatsapp/onboard/complete', { code }),
    manualConnect: (credentials: ManualCredentials) => apiClient.post('/whatsapp/onboard/manual', credentials),
    testConnection: (credentials: ManualCredentials) => apiClient.post('/whatsapp/onboard/test', credentials),
    disconnect: () => apiClient.post('/whatsapp/onboard/disconnect'),
    refresh: () => apiClient.post('/whatsapp/onboard/refresh'),
};

const WhatsAppOnboarding: React.FC = () => {
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(0);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
    const [connectionMethod, setConnectionMethod] = useState<'qr' | 'manual'>('qr');
    const [manualForm] = Form.useForm();
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Check URL params for onboarding result
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const success = params.get('onboard_success');
        const error = params.get('onboard_error');
        
        if (success === 'true') {
            message.success('WhatsApp Business connected successfully!');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
        } else if (error) {
            const errorMessage = params.get('error_message') || 'Connection failed';
            message.error(`Onboarding failed: ${errorMessage}`);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [queryClient]);

    // Fetch onboarding config
    const { data: configData, isLoading: configLoading, error: configError } = useQuery({
        queryKey: ['whatsapp-onboard-config'],
        queryFn: () => onboardApi.getConfig(),
    });

    // Fetch connection status
    const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: () => onboardApi.getStatus(),
        refetchInterval: 30000, // Refresh every 30s
    });

    const disconnectMutation = useMutation({
        mutationFn: () => onboardApi.disconnect(),
        onSuccess: () => {
            message.success('WhatsApp disconnected');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            setShowDisconnectConfirm(false);
        },
        onError: () => {
            message.error('Failed to disconnect');
        },
    });

    const refreshMutation = useMutation({
        mutationFn: () => onboardApi.refresh(),
        onSuccess: () => {
            message.success('Status refreshed');
            refetchStatus();
        },
    });

    // Manual connection mutation
    const manualConnectMutation = useMutation({
        mutationFn: (credentials: ManualCredentials) => onboardApi.manualConnect(credentials),
        onSuccess: () => {
            message.success('WhatsApp Business connected successfully!');
            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
            manualForm.resetFields();
            setTestResult(null);
        },
        onError: (err: any) => {
            message.error(err.response?.data?.error || 'Failed to connect');
        },
    });

    // Test connection
    const handleTestConnection = async () => {
        try {
            const values = await manualForm.validateFields();
            setTestingConnection(true);
            setTestResult(null);

            const response = await onboardApi.testConnection(values);
            const data = response.data as any;
            
            if (data.success) {
                setTestResult({
                    success: true,
                    message: `Connection successful! Phone: ${data.data?.phoneNumber || 'Connected'}`,
                });
            } else {
                setTestResult({
                    success: false,
                    message: data.error || 'Connection test failed',
                });
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.response?.data?.error || 'Connection test failed',
            });
        } finally {
            setTestingConnection(false);
        }
    };

    // Handle manual form submit
    const handleManualSubmit = async () => {
        const values = await manualForm.validateFields();
        manualConnectMutation.mutate(values);
    };

    const config = configData?.data?.data;
    const status = statusData?.data?.data;
    const isConnected = status?.isConnected;
    const isConfigured = !!config?.appId;

    // Handle Facebook SDK Login
    const handleConnectWithFacebook = () => {
        if (!config) {
            message.error('Onboarding not configured');
            return;
        }

        setIsConnecting(true);

        // Check if FB SDK is loaded
        if (typeof (window as any).FB === 'undefined') {
            // Load Facebook SDK
            loadFacebookSDK(config.appId)
                .then(() => initiateFacebookLogin(config))
                .catch(() => {
                    message.error('Failed to load Facebook SDK');
                    setIsConnecting(false);
                });
        } else {
            initiateFacebookLogin(config);
        }
    };

    const loadFacebookSDK = (appId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                (window as any).FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0',
                });
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    };

    const initiateFacebookLogin = (cfg: OnboardConfig) => {
        (window as any).FB.login(
            (response: any) => {
                setIsConnecting(false);
                
                if (response.authResponse && response.authResponse.code) {
                    // Send code to backend
                    message.loading('Completing setup...');
                    onboardApi.completeOnboarding(response.authResponse.code)
                        .then(() => {
                            message.success('WhatsApp Business connected!');
                            queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] });
                        })
                        .catch((err) => {
                            message.error(err.response?.data?.error || 'Connection failed');
                        });
                } else {
                    message.warning('Login cancelled or failed');
                }
            },
            {
                config_id: cfg.configId,
                response_type: 'code',
                override_default_response_type: true,
                extras: {
                    setup: {},
                    featureType: '',
                    sessionInfoVersion: 2,
                },
            }
        );
    };

    const qualityColors: Record<string, string> = {
        GREEN: 'success',
        YELLOW: 'warning',
        RED: 'error',
    };

    // Loading state
    if (configLoading || statusLoading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">Loading WhatsApp configuration...</Text>
                    </div>
                </div>
            </Card>
        );
    }

    // Connected state
    if (isConnected) {
        return (
            <Card>
                <Result
                    status="success"
                    icon={<WhatsAppOutlined style={{ color: '#25D366' }} />}
                    title="WhatsApp Business Connected"
                    subTitle={`Phone: ${status?.phoneNumber || 'Connected'}`}
                    extra={[
                        <Button 
                            key="refresh" 
                            icon={<SyncOutlined spin={refreshMutation.isPending} />}
                            onClick={() => refreshMutation.mutate()}
                        >
                            Refresh Status
                        </Button>,
                        <Button 
                            key="disconnect" 
                            danger
                            icon={<DisconnectOutlined />}
                            onClick={() => setShowDisconnectConfirm(true)}
                        >
                            Disconnect
                        </Button>,
                    ]}
                />

                <Divider />

                <Descriptions title="Connection Details" bordered column={1}>
                    {status?.businessName && (
                        <Descriptions.Item label="Business Name">
                            {status.businessName}
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Phone Number">
                        <Space>
                            <PhoneOutlined />
                            {status?.phoneNumber || 'Hidden'}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Connection Method">
                        <Tag color="blue">
                            {status?.onboardingMethod === 'embedded_signup' ? 'QR Code / Facebook Login' : 
                             status?.onboardingMethod === 'manual' ? 'Manual Configuration' : 'Unknown'}
                        </Tag>
                    </Descriptions.Item>
                    {status?.qualityRating && (
                        <Descriptions.Item label="Quality Rating">
                            <Tag color={qualityColors[status.qualityRating]}>
                                {status.qualityRating}
                            </Tag>
                        </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Features">
                        <Space wrap>
                            <Tag color={status?.features.catalogEnabled ? 'green' : 'default'}>
                                Catalog {status?.features.catalogEnabled ? '✓' : '✗'}
                            </Tag>
                            <Tag color={status?.features.cartEnabled ? 'green' : 'default'}>
                                Cart {status?.features.cartEnabled ? '✓' : '✗'}
                            </Tag>
                            <Tag color={status?.features.paymentsEnabled ? 'green' : 'default'}>
                                Payments {status?.features.paymentsEnabled ? '✓' : '✗'}
                            </Tag>
                            <Tag color={status?.features.flowsEnabled ? 'green' : 'default'}>
                                Flows {status?.features.flowsEnabled ? '✓' : '✗'}
                            </Tag>
                        </Space>
                    </Descriptions.Item>
                </Descriptions>

                <Modal
                    title="Disconnect WhatsApp?"
                    open={showDisconnectConfirm}
                    onOk={() => disconnectMutation.mutate()}
                    onCancel={() => setShowDisconnectConfirm(false)}
                    okText="Disconnect"
                    okButtonProps={{ danger: true, loading: disconnectMutation.isPending }}
                >
                    <p>This will disconnect your WhatsApp Business Account. You will stop receiving messages and need to reconnect to continue.</p>
                </Modal>
            </Card>
        );
    }

    // Manual Configuration Form Component
    const ManualConfigForm = () => (
        <div>
            <Alert
                type="info"
                showIcon
                icon={<KeyOutlined />}
                message="Already have WhatsApp API credentials?"
                description="Enter your existing WhatsApp Cloud API credentials from Meta Business Suite."
                style={{ marginBottom: 24 }}
            />

            <Form form={manualForm} layout="vertical">
                <Form.Item
                    name="accessToken"
                    label="Access Token"
                    rules={[{ required: true, message: 'Access token is required' }]}
                    extra="Permanent token from Meta Business Suite → WhatsApp → API Setup"
                >
                    <Input.Password
                        placeholder="EAAxxxxxxxxxxxxxxxx..."
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="phoneNumberId"
                    label="Phone Number ID"
                    rules={[{ required: true, message: 'Phone Number ID is required' }]}
                    extra="Found in WhatsApp → API Setup → Phone number ID"
                >
                    <Input
                        placeholder="123456789012345"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="wabaId"
                    label="WhatsApp Business Account ID"
                    rules={[{ required: true, message: 'WABA ID is required' }]}
                    extra="Found in WhatsApp → API Setup → WhatsApp Business Account ID"
                >
                    <Input
                        placeholder="987654321098765"
                        size="large"
                    />
                </Form.Item>

                <Form.Item
                    name="businessName"
                    label="Business Name (Optional)"
                >
                    <Input
                        placeholder="Your Business Name"
                        size="large"
                    />
                </Form.Item>

                {testResult && (
                    <Alert
                        type={testResult.success ? 'success' : 'error'}
                        message={testResult.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                        description={testResult.message}
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button
                        icon={<SyncOutlined spin={testingConnection} />}
                        onClick={handleTestConnection}
                        loading={testingConnection}
                    >
                        Test Connection
                    </Button>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleManualSubmit}
                        loading={manualConnectMutation.isPending}
                        disabled={!testResult?.success}
                    >
                        Connect
                    </Button>
                </Space>
            </Form>

            <Divider />

            <Alert
                type="warning"
                message="Where to find these credentials"
                description={
                    <ol style={{ marginBottom: 0, paddingLeft: 20 }}>
                        <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">Meta Business Suite</a></li>
                        <li>Navigate to WhatsApp → API Setup</li>
                        <li>Copy the Phone Number ID and WABA ID</li>
                        <li>Generate a Permanent Access Token</li>
                    </ol>
                }
            />
        </div>
    );

    // Not configured for QR but can still use manual
    if (!isConfigured || configError) {
        return (
            <Card>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}
                    >
                        <WhatsAppOutlined style={{ fontSize: 40, color: '#fff' }} />
                    </div>
                    <Title level={3} style={{ margin: 0 }}>Connect WhatsApp Business</Title>
                    <Text type="secondary">
                        Enter your existing WhatsApp API credentials
                    </Text>
                </div>

                <Alert
                    type="info"
                    showIcon
                    message="QR Code login not available"
                    description="Quick QR code setup is not configured. Use manual configuration below."
                    style={{ marginBottom: 24 }}
                />

                <ManualConfigForm />
            </Card>
        );
    }

    // Onboarding wizard with tabs for QR vs Manual
    return (
        <Card>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                    }}
                >
                    <WhatsAppOutlined style={{ fontSize: 40, color: '#fff' }} />
                </div>
                <Title level={3} style={{ margin: 0 }}>Connect WhatsApp Business</Title>
                <Text type="secondary">
                    Connect your WhatsApp Business account to start selling
                </Text>
            </div>

            <Tabs
                activeKey={connectionMethod}
                onChange={(key) => setConnectionMethod(key as 'qr' | 'manual')}
                centered
                items={[
                    {
                        key: 'qr',
                        label: (
                            <span>
                                <QrcodeOutlined /> Quick Setup (QR Code)
                            </span>
                        ),
                        children: (
                            <div>
                                <Steps current={currentStep} items={[
                                    { title: 'Prepare', description: 'Requirements' },
                                    { title: 'Connect', description: 'Link WhatsApp' },
                                    { title: 'Done', description: 'Confirm' },
                                ]} style={{ marginBottom: 32 }} />

                                {currentStep === 0 && (
                                    <div>
                                        <Alert
                                            type="info"
                                            showIcon
                                            icon={<SafetyCertificateOutlined />}
                                            message="Before you begin"
                                            description={
                                                <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                                                    <li>You need a phone number dedicated for WhatsApp Business</li>
                                                    <li>The phone number cannot be used with WhatsApp personal app</li>
                                                    <li>You'll need access to your Meta Business account</li>
                                                    <li>A QR code will appear - scan it with your phone's camera</li>
                                                </ul>
                                            }
                                            style={{ marginBottom: 24 }}
                                        />
                                        <div style={{ textAlign: 'center' }}>
                                            <Button type="primary" size="large" onClick={() => setCurrentStep(1)}>
                                                I'm Ready, Continue
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <div style={{ textAlign: 'center' }}>
                                        <div
                                            style={{
                                                width: 200,
                                                height: 200,
                                                border: '2px dashed #d9d9d9',
                                                borderRadius: 12,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 24px',
                                                background: '#fafafa',
                                            }}
                                        >
                                            {isConnecting ? (
                                                <Spin size="large" />
                                            ) : (
                                                <QrcodeOutlined style={{ fontSize: 80, color: '#bfbfbf' }} />
                                            )}
                                        </div>
                                        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                                            Click below to open Meta's secure login. Scan QR code or log in with Facebook.
                                        </Paragraph>
                                        <Space direction="vertical" size="middle">
                                            <Button
                                                type="primary"
                                                size="large"
                                                icon={<LinkOutlined />}
                                                loading={isConnecting}
                                                onClick={handleConnectWithFacebook}
                                                style={{ background: '#1877F2', borderColor: '#1877F2', height: 48, paddingLeft: 32, paddingRight: 32 }}
                                            >
                                                Continue with Facebook
                                            </Button>
                                            <Button onClick={() => setCurrentStep(0)}>Back</Button>
                                        </Space>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <Result
                                        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                        title="Connection Successful!"
                                        subTitle="Your WhatsApp Business account is now connected"
                                        extra={<Button type="primary" onClick={() => refetchStatus()}>View Status</Button>}
                                    />
                                )}
                            </div>
                        ),
                    },
                    {
                        key: 'manual',
                        label: (
                            <span>
                                <SettingOutlined /> Manual Setup (API Keys)
                            </span>
                        ),
                        children: <ManualConfigForm />,
                    },
                ]}
            />
        </Card>
    );
};

export default WhatsAppOnboarding;
