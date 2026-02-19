import React from 'react';
import {
    Card, Form, Switch, Input, InputNumber, Button, message, Typography,
    Space, Alert, Row, Col, Steps,
} from 'antd';
import {
    WhatsAppOutlined, ShoppingOutlined, CreditCardOutlined,
    RocketOutlined, CheckCircleOutlined, SettingOutlined,
    BellOutlined, MessageOutlined, LinkOutlined,
    SafetyCertificateOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '../../../api/modules';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const sectionCard: React.CSSProperties = {
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)',
    marginBottom: 20,
    overflow: 'hidden',
};

const iconBox = (bg: string, color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    color,
    flexShrink: 0,
});

const StoreSettings: React.FC = () => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['store-settings'],
        queryFn: () => storeApi.getSettings(),
    });

    const settings = settingsData?.data;

    React.useEffect(() => {
        if (settings) form.setFieldsValue(settings);
    }, [settings, form]);

    const updateMutation = useMutation({
        mutationFn: (values: any) => storeApi.updateSettings(values),
        onSuccess: () => {
            message.success('Settings saved successfully!');
            queryClient.invalidateQueries({ queryKey: ['store-settings'] });
        },
        onError: () => message.error('Failed to save settings'),
    });

    const handleSave = async () => {
        const values = await form.validateFields();
        updateMutation.mutate(values);
    };

    const { data: productsData } = useQuery({
        queryKey: ['store-products'],
        queryFn: () => storeApi.getProducts(),
    });

    const productCount = productsData?.data?.length || 0;
    const isActive = settings?.is_active || false;
    const currentStep = isActive ? 2 : productCount > 0 ? 1 : 0;

    return (
        <Row gutter={24}>
            {/* Left: Main Settings */}
            <Col xs={24} lg={16}>
                <Form form={form} layout="vertical">
                    {/* ── Store Activation ─────────────────── */}
                    <Card style={sectionCard} loading={isLoading}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={iconBox('linear-gradient(135deg, #ECFDF5, #D1FAE5)', '#059669')}>
                                <WhatsAppOutlined />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <Title level={5} style={{ margin: 0 }}>Store Automation</Title>
                                    <Form.Item name="is_active" valuePropName="checked" style={{ margin: 0 }}>
                                        <Switch
                                            checkedChildren="Active"
                                            unCheckedChildren="Off"
                                        />
                                    </Form.Item>
                                </div>
                                <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                                    When enabled, your WhatsApp auto-responds with catalog, takes orders, and sends payment links.
                                </Paragraph>
                            </div>
                        </div>
                    </Card>

                    {/* ── Welcome Message ─────────────────── */}
                    <Card style={sectionCard} loading={isLoading}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={iconBox('linear-gradient(135deg, #EEF2FF, #E0E7FF)', '#4F46E5')}>
                                <MessageOutlined />
                            </div>
                            <div>
                                <Title level={5} style={{ margin: 0 }}>Welcome Message</Title>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    First message sent when a customer says &quot;hi&quot; or &quot;hello&quot;
                                </Text>
                            </div>
                        </div>
                        <Form.Item name="welcome_message" style={{ margin: 0 }}>
                            <TextArea
                                rows={3}
                                placeholder='Welcome to our store! 🛍️ Type "catalog" to browse our products.'
                                style={{
                                    borderRadius: 10,
                                    background: '#FAFBFC',
                                    border: '1px solid #E8ECF0',
                                    fontSize: 14,
                                }}
                            />
                        </Form.Item>
                    </Card>

                    {/* ── Payment Configuration ─────────────────── */}
                    <Card style={sectionCard} loading={isLoading}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={iconBox('linear-gradient(135deg, #FFF7ED, #FFEDD5)', '#EA580C')}>
                                <CreditCardOutlined />
                            </div>
                            <div>
                                <Title level={5} style={{ margin: 0 }}>Payment Configuration</Title>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Configure how customers pay for their orders
                                </Text>
                            </div>
                        </div>

                        <Form.Item
                            name="payment_link_template"
                            label={
                                <span style={{ fontWeight: 500 }}>
                                    <LinkOutlined style={{ marginRight: 6 }} />
                                    Payment Link Template
                                </span>
                            }
                        >
                            <Input
                                placeholder="https://pay.example.com/pay?amount={{amount}}&ref={{order_id}}"
                                style={{ borderRadius: 10, background: '#FAFBFC', border: '1px solid #E8ECF0' }}
                            />
                        </Form.Item>
                        <div
                            style={{
                                background: '#F8FAFC',
                                borderRadius: 10,
                                padding: '10px 14px',
                                border: '1px solid #E2E8F0',
                            }}
                        >
                            <Text style={{ fontSize: 12, color: '#64748B' }}>
                                💡 Use <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{amount}}'}</code> and{' '}
                                <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>{'{{order_id}}'}</code>{' '}
                                as placeholders. Works with Razorpay, Stripe, PhonePe, UPI links.
                            </Text>
                        </div>
                    </Card>

                    {/* ── Reminders ─────────────────── */}
                    <Card style={sectionCard} loading={isLoading}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={iconBox('linear-gradient(135deg, #FEF3C7, #FDE68A)', '#D97706')}>
                                <BellOutlined />
                            </div>
                            <div>
                                <Title level={5} style={{ margin: 0 }}>Auto Reminders</Title>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    Automatically remind customers who abandon checkout or haven&apos;t paid
                                </Text>
                            </div>
                        </div>

                        <Row gutter={16}>
                            <Col span={12}>
                                <div
                                    style={{
                                        background: '#FAFBFC',
                                        borderRadius: 12,
                                        padding: '16px 20px',
                                        border: '1px solid #E8ECF0',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <ClockCircleOutlined style={{ color: '#D97706' }} />
                                        <Text strong style={{ fontSize: 13 }}>Checkout Reminder</Text>
                                    </div>
                                    <Form.Item name="checkout_reminder_minutes" style={{ margin: 0 }}>
                                        <InputNumber
                                            min={5}
                                            max={120}
                                            addonAfter="min"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                            </Col>
                            <Col span={12}>
                                <div
                                    style={{
                                        background: '#FAFBFC',
                                        borderRadius: 12,
                                        padding: '16px 20px',
                                        border: '1px solid #E8ECF0',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <ClockCircleOutlined style={{ color: '#EA580C' }} />
                                        <Text strong style={{ fontSize: 13 }}>Payment Reminder</Text>
                                    </div>
                                    <Form.Item name="payment_reminder_minutes" style={{ margin: 0 }}>
                                        <InputNumber
                                            min={5}
                                            max={240}
                                            addonAfter="min"
                                            style={{ width: '100%' }}
                                        />
                                    </Form.Item>
                                </div>
                            </Col>
                        </Row>
                    </Card>

                    {/* Save Button */}
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSave}
                        loading={updateMutation.isPending}
                        style={{
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #25D366, #128C7E)',
                            border: 'none',
                            width: '100%',
                            height: 48,
                            fontWeight: 600,
                            fontSize: 15,
                            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                        }}
                    >
                        <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                        Save All Settings
                    </Button>
                </Form>
            </Col>

            {/* Right: Onboarding & Tips */}
            <Col xs={24} lg={8}>
                {/* Setup Progress */}
                <Card
                    style={{
                        ...sectionCard,
                        background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 60%)',
                    }}
                >
                    <Title level={5} style={{ marginBottom: 20 }}>
                        <RocketOutlined style={{ marginRight: 8, color: '#25D366' }} />
                        Setup Progress
                    </Title>
                    <Steps
                        current={currentStep}
                        direction="vertical"
                        size="small"
                        items={[
                            {
                                title: <Text strong>Add Products</Text>,
                                description: productCount > 0
                                    ? <Text type="success" style={{ fontSize: 12 }}>✅ {productCount} products added</Text>
                                    : <Text type="secondary" style={{ fontSize: 12 }}>Add your first product</Text>,
                                icon: <ShoppingOutlined />,
                            },
                            {
                                title: <Text strong>Configure Settings</Text>,
                                description: <Text type="secondary" style={{ fontSize: 12 }}>Welcome message & payment</Text>,
                                icon: <SettingOutlined />,
                            },
                            {
                                title: <Text strong>Go Live</Text>,
                                description: isActive
                                    ? <Text type="success" style={{ fontSize: 12 }}>✅ Store is live!</Text>
                                    : <Text type="secondary" style={{ fontSize: 12 }}>Toggle automation on</Text>,
                                icon: <CheckCircleOutlined />,
                            },
                        ]}
                    />
                    {productCount === 0 && (
                        <Alert
                            message="Add products first"
                            description="Go to the Products tab to add items to your catalog."
                            type="info"
                            showIcon
                            style={{ marginTop: 16, borderRadius: 10 }}
                        />
                    )}
                </Card>

                {/* How it works */}
                <Card style={sectionCard}>
                    <Title level={5} style={{ marginBottom: 16 }}>
                        💬 How It Works
                    </Title>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        {[
                            { step: '1', text: 'Customer says "hi" on WhatsApp', color: '#4F46E5' },
                            { step: '2', text: 'Bot shows catalog & takes order', color: '#0891B2' },
                            { step: '3', text: 'Customer confirms order details', color: '#D97706' },
                            { step: '4', text: 'Payment link sent automatically', color: '#059669' },
                            { step: '5', text: 'You receive order in dashboard', color: '#DC2626' },
                        ].map((item) => (
                            <div
                                key={item.step}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '8px 0',
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        background: `${item.color}15`,
                                        color: item.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        flexShrink: 0,
                                    }}
                                >
                                    {item.step}
                                </div>
                                <Text style={{ fontSize: 13 }}>{item.text}</Text>
                            </div>
                        ))}
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default StoreSettings;
