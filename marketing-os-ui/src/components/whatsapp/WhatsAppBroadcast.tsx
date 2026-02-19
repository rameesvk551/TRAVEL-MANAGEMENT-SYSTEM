import React, { useState } from 'react';
import {
    Card,
    Steps,
    Form,
    Select,
    Button,
    Input,
    Radio,
    DatePicker,
    Typography,
    Space,
    Tag,
    message,
    Alert,
    Row,
    Col,
    Statistic,
    Divider,
    Segmented
} from 'antd';
import {
    ScheduleOutlined,
    SendOutlined,
    FileTextOutlined,
    PhoneOutlined,
    CloudUploadOutlined,
    UserOutlined,
    UploadOutlined
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { whatsappApi } from '../../api/modules';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const WhatsAppBroadcast: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [recipientCount, setRecipientCount] = useState(0);

    // Fetch approved templates
    const { data: templatesData } = useQuery({
        queryKey: ['whatsapp-templates', 'approved'],
        queryFn: () => whatsappApi.getTemplates({ status: 'APPROVED' }),
    });

    const templates = templatesData?.data || [];

    // Broadcast mutation
    const broadcastMutation = useMutation({
        mutationFn: whatsappApi.broadcast,
        onSuccess: () => {
            message.success('Broadcast scheduled successfully!');
            setCurrentStep(0);
            form.resetFields();
            setSelectedTemplate(null);
            setRecipientCount(0);
        },
        onError: () => message.error('Failed to schedule broadcast'),
    });

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find((t: any) => t.id === templateId);
        setSelectedTemplate(template);
    };

    const onRecipientsChange = (e: any) => {
        const text = e.target.value;
        const count = text.split('\n').filter((line: string) => line.trim().length > 0).length;
        setRecipientCount(count);
    };

    const next = async () => {
        try {
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSend = () => {
        const values = form.getFieldsValue();
        const recipients = values.recipients.split('\n').filter((line: string) => line.trim().length > 0)
            .map((phone: string) => ({ phone: phone.trim() }));

        broadcastMutation.mutate({
            templateName: selectedTemplate.name,
            language: selectedTemplate.language,
            recipients: recipients
        });
    };

    const steps = [
        {
            title: 'Select Template',
            description: 'Choose content',
            icon: <FileTextOutlined />,
        },
        {
            title: 'Add Recipients',
            description: 'Define audience',
            icon: <UserOutlined />,
        },
        {
            title: 'Schedule & Send',
            description: 'Review & Confirm',
            icon: <ScheduleOutlined />,
        }
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
            <Card bordered={false} bodyStyle={{ padding: '0 0 24px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={3} style={{ marginBottom: 8 }}>New Broadcast Campaign</Title>
                    <Text type="secondary">Send personalized messages to thousands of customers in minutes</Text>
                </div>

                <Steps current={currentStep} items={steps} style={{ marginBottom: 48, maxWidth: 800, margin: '0 auto 48px auto' }} />

                <Form form={form} layout="vertical" initialValues={{ recipientSource: 'manual', schedule: 'now' }}>
                    <div style={{ minHeight: 400, maxWidth: 800, margin: '0 auto' }}>
                        {currentStep === 0 && (
                            <div className="fade-in">
                                <Form.Item name="templateId" label={<Text strong>Select a Template</Text>} rules={[{ required: true, message: 'Please select a template' }]}>
                                    <Select
                                        placeholder="Search and select an approved template..."
                                        onChange={handleTemplateChange}
                                        size="large"
                                        style={{ width: '100%' }}
                                        showSearch
                                        optionFilterProp="children"
                                    >
                                        {templates.map((t: any) => (
                                            <Option key={t.id} value={t.id}>{t.name} ({t.language})</Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {selectedTemplate && (
                                    <div style={{ marginTop: 32, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 300 }}>
                                            <Card title="Template Details" size="small" bordered={false} style={{ background: '#fafafa' }}>
                                                <Space direction="vertical">
                                                    <div><Text type="secondary">Name: </Text><Text strong>{selectedTemplate.name}</Text></div>
                                                    <div><Text type="secondary">Language: </Text><Tag>{selectedTemplate.language}</Tag></div>
                                                    <div><Text type="secondary">Category: </Text><Tag color="blue">{selectedTemplate.category}</Tag></div>
                                                </Space>
                                            </Card>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 300 }}>
                                            <div style={{
                                                background: '#e5ddd5',
                                                padding: 16,
                                                borderRadius: 8,
                                                maxWidth: 360,
                                                position: 'relative',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{ background: 'white', padding: '12px 16px', borderRadius: '0 8px 8px 8px', position: 'relative' }}>
                                                    <Paragraph style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                                                        {selectedTemplate.components.find((c: any) => c.type === 'BODY')?.text}
                                                    </Paragraph>
                                                    <div style={{ textAlign: 'right', marginTop: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>12:05 PM</Text>
                                                    </div>
                                                </div>
                                            </div>
                                            <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>Message Preview</Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="fade-in">
                                <Form.Item label={<Text strong>How would you like to add recipients?</Text>}>
                                    <Form.Item name="recipientSource" noStyle>
                                        <Segmented
                                            options={[
                                                { label: 'Manual Input', value: 'manual', icon: <PhoneOutlined /> },
                                                { label: 'Upload CSV', value: 'csv', icon: <CloudUploadOutlined /> },
                                                { label: 'From Contacts', value: 'contacts', icon: <UserOutlined /> },
                                            ]}
                                            block
                                            size="large"
                                        />
                                    </Form.Item>
                                </Form.Item>

                                <Divider style={{ margin: '24px 0' }} />

                                <Form.Item
                                    noStyle
                                    shouldUpdate={(prev, current) => prev.recipientSource !== current.recipientSource}
                                >
                                    {({ getFieldValue }) => {
                                        const source = getFieldValue('recipientSource');
                                        return source === 'manual' ? (
                                            <Form.Item
                                                name="recipients"
                                                label="Phone Numbers"
                                                rules={[{ required: true, message: 'Please enter at least one phone number' }]}
                                                help="Enter phone numbers with country code (e.g., 15551234567), one per line."
                                            >
                                                <TextArea rows={12} onChange={onRecipientsChange} placeholder="15551234567&#10;919876543210" style={{ fontFamily: 'monospace' }} />
                                            </Form.Item>
                                        ) : (
                                            <div style={{ padding: 60, textAlign: 'center', background: '#fafafa', border: '2px dashed #d9d9d9', borderRadius: 12, cursor: 'pointer' }}>
                                                <p className="ant-upload-drag-icon">
                                                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff', opacity: 0.8 }} />
                                                </p>
                                                <Title level={4} style={{ marginTop: 16 }}>Click or drag CSV file to upload</Title>
                                                <p className="ant-upload-hint">Support for massive bulk upload via CSV.</p>
                                                <Button style={{ marginTop: 16 }}>Select File</Button>
                                            </div>
                                        );
                                    }}
                                </Form.Item>

                                <div style={{ marginTop: 24, textAlign: 'right' }}>
                                    <Tag color="cyan" style={{ fontSize: 14, padding: '4px 12px' }}>
                                        <UserOutlined /> {recipientCount} Recipients Identified
                                    </Tag>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="fade-in">
                                <Alert
                                    message="Ready to Broadcast"
                                    description="Review your campaign details before sending. This action normally cannot be undone."
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: 32 }}
                                />

                                <Row gutter={32}>
                                    <Col span={14}>
                                        <Card title="Campaign Overview" bordered={false} style={{ background: '#fafafa', height: '100%' }}>
                                            <Statistic
                                                title="Total Recipients"
                                                value={recipientCount}
                                                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                                                valueStyle={{ fontWeight: 600 }}
                                            />
                                            <Divider />
                                            <div style={{ marginBottom: 16 }}>
                                                <Text type="secondary">Template:</Text>
                                                <div style={{ fontSize: 16, fontWeight: 500 }}>{selectedTemplate?.name}</div>
                                            </div>
                                            <div>
                                                <Text type="secondary">Language:</Text>
                                                <div>{selectedTemplate?.language}</div>
                                            </div>
                                        </Card>
                                    </Col>
                                    <Col span={10}>
                                        <Card title="Scheduling" bordered={false} style={{ height: '100%', border: '1px solid #f0f0f0' }}>
                                            <Form.Item name="schedule" label="When should this send?">
                                                <Radio.Group style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <Radio value="now">
                                                        <Space direction="vertical" size={2}>
                                                            <Text strong>Send Immediately</Text>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>Launch campaign as soon as processed</Text>
                                                        </Space>
                                                    </Radio>
                                                    <Radio value="later">
                                                        <Space direction="vertical" size={2}>
                                                            <Text strong>Schedule for Later</Text>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>Pick a specific date and time</Text>
                                                        </Space>
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>

                                            <Form.Item
                                                noStyle
                                                shouldUpdate={(prev, current) => prev.schedule !== current.schedule}
                                            >
                                                {({ getFieldValue }) => getFieldValue('schedule') === 'later' && (
                                                    <Form.Item name="scheduledTime" rules={[{ required: true }]}>
                                                        <DatePicker showTime style={{ width: '100%' }} size="large" />
                                                    </Form.Item>
                                                )}
                                            </Form.Item>

                                            <Divider style={{ margin: '12px 0' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text type="secondary">Est. Cost</Text>
                                                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>${(recipientCount * 0.05).toFixed(2)}</Title>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        )}
                    </div>

                    <Divider style={{ margin: '40px 0 24px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 800, margin: '0 auto' }}>
                        <Button
                            onClick={prev}
                            disabled={currentStep === 0}
                            size="large"
                            style={{ minWidth: 100 }}
                        >
                            Back
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button type="primary" onClick={next} size="large" style={{ minWidth: 120 }}>
                                Continue
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                onClick={handleSend}
                                size="large"
                                loading={broadcastMutation.isPending}
                                style={{ minWidth: 160, background: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Launch Campaign
                            </Button>
                        )}
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default WhatsAppBroadcast;
